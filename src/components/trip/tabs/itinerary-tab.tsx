"use client";

import type { Trip } from "@/types";
import { ItineraryDay } from "@/components/trip/itinerary-day";
import { EstimatedBadge } from "@/components/shared/data-badges";
import { SectionHeading } from "@/components/shared/section";
import { useI18n } from "@/lib/i18n/provider";

export function ItineraryTab({
  trip,
  onFocusMap,
}: {
  trip: Trip;
  onFocusMap?: (activityId: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeading title={t("itinerary.title")} />
        <EstimatedBadge />
      </div>
      <div className="space-y-5">
        {trip.days.map((day) => (
          <ItineraryDay key={day.id} trip={trip} day={day} onFocusMap={onFocusMap} />
        ))}
      </div>
    </div>
  );
}
