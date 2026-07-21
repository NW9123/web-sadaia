"use client";

import { useMemo } from "react";
import { MapPin } from "lucide-react";
import type { Coordinates } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Provider-agnostic map panel. The domain model (markers) is decoupled from any
 * map SDK: this demo renderer projects lat/lng into an SVG viewport. A real
 * provider (Mapbox/Google) can be swapped behind the same marker interface.
 */
export interface MapMarker {
  id: string;
  coordinates: Coordinates;
  label: string;
  dayIndex: number;
  order: number;
  isHotel?: boolean;
}

const VIEW_W = 800;
const VIEW_H = 560;
const PAD = 60;

function project(markers: MapMarker[]) {
  const lats = markers.map((m) => m.coordinates.lat);
  const lngs = markers.map((m) => m.coordinates.lng);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);
  // Avoid zero span for a single/clustered set.
  if (maxLat - minLat < 0.01) {
    minLat -= 0.02;
    maxLat += 0.02;
  }
  if (maxLng - minLng < 0.01) {
    minLng -= 0.02;
    maxLng += 0.02;
  }
  const toXY = (c: Coordinates) => ({
    x: ((c.lng - minLng) / (maxLng - minLng)) * (VIEW_W - 2 * PAD) + PAD,
    y: ((maxLat - c.lat) / (maxLat - minLat)) * (VIEW_H - 2 * PAD) + PAD,
  });
  return toXY;
}

export function MapPanel({
  markers,
  dayColors,
  selectedId,
  onSelect,
  className,
}: {
  markers: MapMarker[];
  dayColors: string[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const toXY = useMemo(() => (markers.length ? project(markers) : null), [markers]);

  const routesByDay = useMemo(() => {
    const byDay = new Map<number, MapMarker[]>();
    const hotel = markers.find((m) => m.isHotel);
    for (const m of markers) {
      if (m.isHotel) continue;
      const list = byDay.get(m.dayIndex) ?? [];
      list.push(m);
      byDay.set(m.dayIndex, list);
    }
    for (const [, list] of byDay) list.sort((a, b) => a.order - b.order);
    return { byDay, hotel };
  }, [markers]);

  if (!toXY || markers.length === 0) {
    return (
      <div className={cn("flex aspect-[4/3] items-center justify-center rounded-2xl border bg-muted/40 text-muted-foreground", className)}>
        <MapPin className="size-6" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border bg-[#e8eef3]", className)}>
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-full w-full" role="img" aria-label="Trip map">
        {/* Faux water/land grid backdrop */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cdd8e3" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={VIEW_W} height={VIEW_H} fill="url(#grid)" />
        <rect width={VIEW_W} height={VIEW_H} fill="#7fb3d520" />

        {/* Routes per day */}
        {[...routesByDay.byDay.entries()].map(([dayIndex, list]) => {
          const color = dayColors[dayIndex % dayColors.length] ?? "#1e88a8";
          const points: string[] = [];
          if (routesByDay.hotel) {
            const h = toXY(routesByDay.hotel.coordinates);
            points.push(`${h.x},${h.y}`);
          }
          for (const m of list) {
            const p = toXY(m.coordinates);
            points.push(`${p.x},${p.y}`);
          }
          return (
            <polyline
              key={dayIndex}
              points={points.join(" ")}
              fill="none"
              stroke={color}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="1 8"
              opacity={0.85}
            />
          );
        })}

        {/* Activity markers */}
        {markers
          .filter((m) => !m.isHotel)
          .map((m) => {
            const { x, y } = toXY(m.coordinates);
            const color = dayColors[m.dayIndex % dayColors.length] ?? "#1e88a8";
            const active = m.id === selectedId;
            return (
              <g
                key={m.id}
                transform={`translate(${x},${y})`}
                className="cursor-pointer"
                onClick={() => onSelect?.(m.id)}
              >
                {active && <circle r={16} fill={color} opacity={0.25} />}
                <circle r={active ? 12 : 9} fill={color} stroke="#fff" strokeWidth={2} />
                <text textAnchor="middle" dy="4" fontSize="10" fontWeight="700" fill="#fff">
                  {m.order + 1}
                </text>
              </g>
            );
          })}

        {/* Hotel marker */}
        {routesByDay.hotel &&
          (() => {
            const { x, y } = toXY(routesByDay.hotel!.coordinates);
            return (
              <g transform={`translate(${x},${y})`}>
                <circle r={13} fill="hsl(216 64% 19%)" stroke="#fff" strokeWidth={2} />
                {/* Simple bed glyph */}
                <rect x={-6} y={-1} width={12} height={5} rx={1} fill="#fff" />
                <rect x={-6} y={-4} width={5} height={3} rx={1} fill="#fff" />
                <line x1={-6} y1={4} x2={-6} y2={6} stroke="#fff" strokeWidth={1.5} />
                <line x1={6} y1={4} x2={6} y2={6} stroke="#fff" strokeWidth={1.5} />
              </g>
            );
          })()}
      </svg>
    </div>
  );
}
