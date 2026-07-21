"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapMarker } from "./map-panel";
import { cn } from "@/lib/utils";

/**
 * Real map renderer: Leaflet + OpenStreetMap tiles (keyless, attribution
 * included). Implements the same provider-agnostic MapMarker interface as the
 * SVG fallback panel, so swapping providers (Mapbox/Google) stays a one-file
 * change. Loaded client-only via next/dynamic (see trip-map.tsx).
 */
interface TripLeafletMapProps {
  markers: MapMarker[];
  dayColors: string[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Increment to re-fit the view to all visible markers. */
  fitKey?: number;
  /** Message shown when tiles cannot be loaded (offline). */
  offlineNote?: string;
  className?: string;
}

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

/** White bed glyph for the hotel marker (inline SVG keeps us icon-asset-free). */
const HOTEL_GLYPH =
  '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M2 17h20"/></svg>';

function activityIcon(color: string, order: number, active: boolean): L.DivIcon {
  const size = active ? 32 : 25;
  return L.divIcon({
    className: "", // suppress Leaflet's default divIcon styling
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${active ? 13 : 11}px;box-shadow:0 1px 4px rgba(0,0,0,.4)${active ? ",0 0 0 4px rgba(255,255,255,.65)" : ""}">${order + 1}</div>`,
  });
}

function hotelIcon(): L.DivIcon {
  const size = 30;
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:hsl(216 64% 19%);border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 5px rgba(0,0,0,.45)">${HOTEL_GLYPH}</div>`,
  });
}

export default function TripLeafletMap({
  markers,
  dayColors,
  selectedId,
  onSelect,
  fitKey = 0,
  offlineNote,
  className,
}: TripLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const leafletMarkers = useRef<Map<string, L.Marker>>(new Map());
  const didInitialFit = useRef(false);
  const [tilesFailed, setTilesFailed] = useState(false);

  // --- init / teardown -----------------------------------------------------
  useEffect(() => {
    const el = containerRef.current;
    const markerStore = leafletMarkers.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, { zoomControl: true, scrollWheelZoom: true });
    map.setView([26, 42], 4); // neutral start; fitted to markers right after

    const tiles = L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION });
    let consecutiveErrors = 0;
    tiles.on("tileerror", () => {
      consecutiveErrors += 1;
      if (consecutiveErrors > 4) setTilesFailed(true);
    });
    tiles.on("tileload", () => {
      consecutiveErrors = 0;
      setTilesFailed(false);
    });
    tiles.addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      markerStore.clear();
      didInitialFit.current = false;
    };
  }, []);

  // --- markers + routes ----------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    leafletMarkers.current.clear();

    // Per-day dashed polylines: hotel -> stop 1 -> stop 2 …
    const hotel = markers.find((m) => m.isHotel);
    const byDay = new Map<number, MapMarker[]>();
    for (const m of markers) {
      if (m.isHotel) continue;
      const list = byDay.get(m.dayIndex) ?? [];
      list.push(m);
      byDay.set(m.dayIndex, list);
    }
    for (const [dayIndex, list] of byDay) {
      list.sort((a, b) => a.order - b.order);
      const color = dayColors[dayIndex % dayColors.length] ?? "#1e88a8";
      const points: [number, number][] = [];
      if (hotel) points.push([hotel.coordinates.lat, hotel.coordinates.lng]);
      for (const m of list) points.push([m.coordinates.lat, m.coordinates.lng]);
      if (points.length >= 2) {
        L.polyline(points, { color, weight: 3, opacity: 0.8, dashArray: "6 8" }).addTo(layer);
      }
    }

    // Activity markers.
    for (const m of markers) {
      if (m.isHotel) continue;
      const color = dayColors[m.dayIndex % dayColors.length] ?? "#1e88a8";
      const active = m.id === selectedId;
      const marker = L.marker([m.coordinates.lat, m.coordinates.lng], {
        icon: activityIcon(color, m.order, active),
        zIndexOffset: active ? 1000 : 0,
        keyboard: true,
        alt: m.label,
      })
        .bindTooltip(m.label, { direction: "top", offset: [0, -14] })
        .on("click", () => onSelect?.(m.id));
      marker.addTo(layer);
      leafletMarkers.current.set(m.id, marker);
    }

    // Hotel marker on top.
    if (hotel) {
      L.marker([hotel.coordinates.lat, hotel.coordinates.lng], {
        icon: hotelIcon(),
        zIndexOffset: 1200,
        alt: hotel.label,
      })
        .bindTooltip(hotel.label, { direction: "top", offset: [0, -16] })
        .addTo(layer);
    }

    // First render: fit to everything once.
    if (!didInitialFit.current && markers.length > 0) {
      didInitialFit.current = true;
      fitToMarkers(map, markers);
    }
  }, [markers, dayColors, selectedId, onSelect]);

  // --- explicit "fit all" --------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || fitKey === 0) return;
    fitToMarkers(map, markers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  // --- pan to selection ----------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const marker = leafletMarkers.current.get(selectedId);
    if (marker) {
      map.panTo(marker.getLatLng());
      marker.openTooltip();
    }
  }, [selectedId]);

  return (
    <div className={cn("relative z-0 overflow-hidden rounded-2xl border", className)}>
      <div ref={containerRef} className="absolute inset-0" role="application" aria-label="Map" />
      {tilesFailed && offlineNote && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-[500] mx-auto w-fit rounded-full bg-card/95 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow">
          {offlineNote}
        </div>
      )}
    </div>
  );
}

function fitToMarkers(map: L.Map, markers: MapMarker[]) {
  if (markers.length === 0) return;
  if (markers.length === 1) {
    const only = markers[0]!;
    map.setView([only.coordinates.lat, only.coordinates.lng], 13);
    return;
  }
  const bounds = L.latLngBounds(markers.map((m) => [m.coordinates.lat, m.coordinates.lng]));
  map.fitBounds(bounds.pad(0.18));
}
