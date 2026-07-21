"use client";

import { Bookmark, MapPin, Trash2 } from "lucide-react";
import type { Trip } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/states";
import { categoryVisual } from "@/lib/category-visual";
import { useI18n } from "@/lib/i18n/provider";
import { useTrips } from "@/features/trips/store";

export function SavedTab({ trip }: { trip: Trip }) {
  const { t, locale } = useI18n();
  const { toggleSavedPlace } = useTrips();

  if (trip.savedPlaces.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title={t("saved.empty")}
        description={t("saved.emptyDesc")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t("saved.title")}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {trip.savedPlaces.map((place) => {
          const Icon = categoryVisual(place.category).icon;
          return (
            <Card key={place.id} className="flex items-center gap-3 p-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{place.name[locale]}</p>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="size-3" /> {place.address[locale]}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                onClick={() => toggleSavedPlace(trip.id, place)}
                aria-label={t("saved.remove")}
              >
                <Trash2 className="size-4" />
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
