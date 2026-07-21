"use client";

import type { Trip } from "@/types";
import { FlightCard } from "@/components/trip/flight-card";
import { SectionHeading } from "@/components/shared/section";
import { Disclaimer } from "@/components/shared/data-badges";
import { EmptyState } from "@/components/shared/states";
import { useI18n } from "@/lib/i18n/provider";
import { useTrips } from "@/features/trips/store";

export function FlightsTab({ trip }: { trip: Trip }) {
  const { t } = useI18n();
  const { selectFlight } = useTrips();

  if (!trip.preferences.includeFlights || trip.flights.length === 0) {
    return <EmptyState title={t("flights.title")} description={t("common.comingSoon")} />;
  }

  const outbound = trip.flights.filter((f) => f.direction === "outbound");
  const returns = trip.flights.filter((f) => f.direction === "return");

  return (
    <div className="space-y-6">
      <SectionHeading title={t("flights.title")} subtitle={t("flights.subtitle")} />
      <Disclaimer>{t("disclaimers.availabilityDesc")}</Disclaimer>

      <div>
        <h3 className="mb-3 font-semibold">{t("flights.outbound")}</h3>
        <div className="grid gap-4 lg:grid-cols-2">
          {outbound.map((f) => (
            <FlightCard
              key={f.id}
              flight={f}
              trip={trip}
              selected={trip.selectedOutboundId === f.id}
              onSelect={() => selectFlight(trip.id, f.id, "outbound")}
            />
          ))}
        </div>
      </div>

      {returns.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold">{t("flights.return")}</h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {returns.map((f) => (
              <FlightCard
                key={f.id}
                flight={f}
                trip={trip}
                selected={trip.selectedReturnId === f.id}
                onSelect={() => selectFlight(trip.id, f.id, "return")}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
