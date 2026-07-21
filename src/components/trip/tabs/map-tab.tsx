"use client";

import { useMemo, useState } from "react";
import { Maximize2, Route, Timer } from "lucide-react";
import type { Trip } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type MapMarker } from "@/components/maps/map-panel";
import { TripMap } from "@/components/maps/trip-map";
import { Disclaimer } from "@/components/shared/data-badges";
import { selectedHotel } from "@/lib/trip/helpers";
import { findActivity } from "@/lib/trip/itinerary";
import { chartPalette } from "@/config/brand";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const DAY_COLORS = chartPalette as unknown as string[];

export function MapTab({
  trip,
  selectedId,
  onSelect,
}: {
  trip: Trip;
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  const { t, locale, fmt } = useI18n();
  const hotel = selectedHotel(trip);
  const [visibleDays, setVisibleDays] = useState<Set<number>>(
    () => new Set(trip.days.map((_, i) => i)),
  );
  const [fitKey, setFitKey] = useState(0);

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [];
    if (hotel) {
      list.push({
        id: "hotel",
        coordinates: hotel.coordinates,
        label: hotel.name[locale],
        dayIndex: -1,
        order: -1,
        isHotel: true,
      });
    }
    trip.days.forEach((day, dayIndex) => {
      if (!visibleDays.has(dayIndex)) return;
      day.activities.forEach((a, order) => {
        list.push({ id: a.id, coordinates: a.coordinates, label: a.name[locale], dayIndex, order });
      });
    });
    return list;
  }, [trip.days, hotel, visibleDays, locale]);

  const dayStats = useMemo(
    () =>
      trip.days.map((day) => {
        const minutes = day.activities.reduce((s, a) => s + (a.travelFromPrevious?.minutes ?? 0), 0);
        const km = day.activities.reduce((s, a) => s + (a.travelFromPrevious?.distanceKm ?? 0), 0);
        return { minutes, km };
      }),
    [trip.days],
  );

  const selected = selectedId ? findActivity(trip, selectedId)?.activity : undefined;

  const toggleDay = (i: number) =>
    setVisibleDays((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{t("map.title")}</h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setVisibleDays(new Set(trip.days.map((_, i) => i)));
            setFitKey((k) => k + 1);
          }}
        >
          <Maximize2 className="size-4" /> {t("map.fitAll")}
        </Button>
      </div>

      {/* Day legend / toggles */}
      <div className="flex flex-wrap gap-2">
        {trip.days.map((day, i) => {
          const on = visibleDays.has(i);
          const color = DAY_COLORS[i % DAY_COLORS.length];
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => toggleDay(i)}
              aria-pressed={on}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-opacity",
                on ? "bg-card" : "opacity-40",
              )}
            >
              <span className="size-2.5 rounded-full" style={{ background: color }} />
              {t("itinerary.dayLabel", { n: day.dayNumber })}
            </button>
          );
        })}
      </div>

      <TripMap
        markers={markers}
        dayColors={DAY_COLORS}
        selectedId={selectedId}
        onSelect={onSelect}
        fitKey={fitKey}
        offlineNote={t("states.offlineTitle")}
        className="aspect-[16/11] w-full"
      />

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <Card className="p-4">
          <p className="mb-1 text-sm font-medium text-muted-foreground">{t("map.selectActivity")}</p>
          {selected ? (
            <div>
              <p className="font-semibold">{selected.name[locale]}</p>
              <p className="text-sm text-muted-foreground">{selected.address[locale]}</p>
              <p className="mt-1 text-sm tnum">
                {fmt.time(selected.startTime)} – {fmt.time(selected.endTime)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("map.selectActivity")}</p>
          )}
        </Card>

        <Card className="p-4">
          <p className="mb-2 text-sm font-medium">{t("map.routeDistance")} / {t("map.routeTime")}</p>
          <ul className="space-y-1.5 text-sm">
            {trip.days.map((day, i) => (
              <li key={day.id} className="flex items-center gap-3">
                <span className="size-2.5 rounded-full" style={{ background: DAY_COLORS[i % DAY_COLORS.length] }} />
                <span className="w-14 text-muted-foreground">{t("itinerary.dayLabel", { n: day.dayNumber })}</span>
                <Badge variant="muted" className="gap-1">
                  <Route className="size-3" /> {fmt.distance(dayStats[i]!.km)}
                </Badge>
                <Badge variant="muted" className="gap-1">
                  <Timer className="size-3" /> {fmt.duration(dayStats[i]!.minutes)}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Disclaimer icon="info">{t("map.providerNote")}</Disclaimer>
    </div>
  );
}
