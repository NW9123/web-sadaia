"use client";

import type { Trip } from "@/types";
import { HotelCard } from "@/components/trip/hotel-card";
import { SectionHeading } from "@/components/shared/section";
import { Disclaimer } from "@/components/shared/data-badges";
import { EmptyState } from "@/components/shared/states";
import { useI18n } from "@/lib/i18n/provider";
import { useTrips } from "@/features/trips/store";

export function HotelsTab({ trip }: { trip: Trip }) {
  const { t } = useI18n();
  const { selectHotel } = useTrips();

  if (!trip.preferences.includeHotels || trip.hotels.length === 0) {
    return <EmptyState title={t("hotels.title")} description={t("common.comingSoon")} />;
  }

  return (
    <div className="space-y-6">
      <SectionHeading title={t("hotels.title")} subtitle={t("hotels.subtitle")} />
      <Disclaimer>{t("disclaimers.availabilityDesc")}</Disclaimer>
      <div className="grid gap-5 md:grid-cols-2">
        {trip.hotels.map((hotel) => (
          <HotelCard
            key={hotel.id}
            hotel={hotel}
            trip={trip}
            selected={trip.selectedHotelId === hotel.id}
            onSelect={() => selectHotel(trip.id, hotel.id)}
          />
        ))}
      </div>
    </div>
  );
}
