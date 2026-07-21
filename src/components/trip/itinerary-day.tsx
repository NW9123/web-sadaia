"use client";

import { useState } from "react";
import { CalendarDays, CloudRain, CloudSun, Plus, Snowflake, Sun, Wallet } from "lucide-react";
import type { Place, Trip, TripDay, WeatherInfo } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityCard } from "./activity-card";
import { EmptyState } from "@/components/shared/states";
import { getPlacesFor } from "@/data/places";
import { placeToActivity, dayCost } from "@/lib/trip/itinerary";
import { convertStatic } from "@/data/currencies";
import { categoryVisual } from "@/lib/category-visual";
import { useI18n } from "@/lib/i18n/provider";
import { useTrips } from "@/features/trips/store";

const WEATHER_ICON: Record<WeatherInfo["condition"], typeof Sun> = {
  sunny: Sun,
  clear: Sun,
  cloudy: CloudSun,
  rain: CloudRain,
  snow: Snowflake,
  storm: CloudRain,
};

export function ItineraryDay({
  trip,
  day,
  onFocusMap,
}: {
  trip: Trip;
  day: TripDay;
  onFocusMap?: (activityId: string) => void;
}) {
  const { t, locale, fmt } = useI18n();
  const { mutate } = useTrips();
  const [addOpen, setAddOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const Weather = day.weather ? WEATHER_ICON[day.weather.condition] : CloudSun;

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    mutate(trip.id, (t2) => {
      const d = t2.days.find((x) => x.id === day.id);
      if (!d) return;
      const [moved] = d.activities.splice(from, 1);
      if (moved) d.activities.splice(to, 0, moved);
    });
  };

  const addPlace = (place: Place) => {
    mutate(trip.id, (t2) => {
      const d = t2.days.find((x) => x.id === day.id);
      if (!d) return;
      d.activities.push(
        placeToActivity(place, { estimatedCost: Math.round(convertStatic(70, "SAR", t2.currency)) }),
      );
    });
    setAddOpen(false);
  };

  return (
    <section className="rounded-2xl border bg-card/60 p-4 sm:p-5" aria-label={t("itinerary.dayLabel", { n: day.dayNumber })}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <span className="text-[10px] uppercase opacity-80">{t("common.day")}</span>
            <span className="text-lg font-bold leading-none tnum">{day.dayNumber}</span>
          </div>
          <div>
            <h3 className="font-bold">{day.title[locale]}</h3>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3" />
              <span className="tnum">{fmt.date(day.dateISO, { weekday: "long", day: "numeric", month: "long" })}</span>
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">{day.summary[locale]}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <Badge variant="secondary" className="gap-1 tnum">
            <Wallet className="size-3" />
            {fmt.currency(dayCost(day), trip.currency)}
          </Badge>
          {day.weather && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground tnum" title={t("itinerary.weatherPlaceholder")}>
              <Weather className="size-4 text-accent" />
              {day.weather.highC}° / {day.weather.lowC}°
            </span>
          )}
        </div>
      </div>

      {day.activities.length === 0 ? (
        <EmptyState title={t("itinerary.emptyDay")} className="py-8" />
      ) : (
        <ol className="space-y-3">
          {day.activities.map((activity, index) => (
            <li
              key={activity.id}
              onDragOver={(e) => {
                if (dragIndex !== null) e.preventDefault();
              }}
              onDrop={() => {
                if (dragIndex !== null) reorder(dragIndex, index);
                setDragIndex(null);
              }}
              draggable={dragIndex !== null}
            >
              <ActivityCard
                trip={trip}
                activity={activity}
                dayId={day.id}
                onFocusMap={onFocusMap}
                dragHandleProps={{
                  draggable: true,
                  onDragStart: () => setDragIndex(index),
                  onDragEnd: () => setDragIndex(null),
                }}
              />
            </li>
          ))}
        </ol>
      )}

      <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5 border-dashed" onClick={() => setAddOpen(true)}>
        <Plus className="size-4" /> {t("itinerary.addActivity")}
      </Button>

      <AddActivityDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        trip={trip}
        onAdd={addPlace}
      />
    </section>
  );
}

function AddActivityDialog({
  open,
  onOpenChange,
  trip,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  trip: Trip;
  onAdd: (place: Place) => void;
}) {
  const { t, locale } = useI18n();
  const used = new Set(trip.days.flatMap((d) => d.activities.map((a) => a.placeId).filter(Boolean)));
  const available = getPlacesFor(trip.destination.id).filter((p) => !used.has(p.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("itinerary.addActivityTitle")}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pe-2">
          <div className="space-y-2">
            {available.map((place) => {
              const Icon = categoryVisual(place.category).icon;
              return (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => onAdd(place)}
                  className="flex w-full items-center gap-3 rounded-xl border p-3 text-start transition-colors hover:border-secondary hover:bg-muted"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{place.name[locale]}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {t(`enums.category.${place.category}`)} · {place.address[locale]}
                    </span>
                  </span>
                  <Plus className="size-4 shrink-0 text-muted-foreground" />
                </button>
              );
            })}
            {available.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("common.comingSoon")}</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
