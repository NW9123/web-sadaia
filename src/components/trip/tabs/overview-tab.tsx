"use client";

import { Bed, CalendarDays, Lightbulb, MapPin, PlaneTakeoff, Sparkles, Users, Wallet } from "lucide-react";
import type { Trip } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/shared/data-badges";
import { budgetTotal } from "@/lib/trip/budget";
import { selectedFlight, selectedHotel, tripNights } from "@/lib/trip/helpers";
import { useI18n } from "@/lib/i18n/provider";

export function OverviewTab({ trip }: { trip: Trip }) {
  const { t, locale, fmt } = useI18n();
  const hotel = selectedHotel(trip);
  const outbound = selectedFlight(trip, "outbound");
  const total = budgetTotal(trip.budgetBreakdown);

  const stats = [
    { icon: CalendarDays, label: t("trip.numDays"), value: String(trip.days.length) },
    { icon: Users, label: t("trip.numTravelers"), value: String(trip.adults + trip.children) },
    { icon: Wallet, label: t("trip.estimatedTotal"), value: fmt.currency(total, trip.currency) },
    { icon: Bed, label: t("trip.overview"), value: `${tripNights(trip)} ${t("common.nights")}` },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-secondary" />
          <div>
            <h2 className="font-semibold">{t("trip.overviewSummary")}</h2>
            <p className="mt-1 text-muted-foreground">{trip.summary[locale]}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Card key={i} className="flex items-center gap-3 p-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <s.icon className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-bold tnum">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {trip.highlights.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold">{t("trip.highlights")}</h3>
          <div className="flex flex-wrap gap-2">
            {trip.highlights.map((h, i) => (
              <Badge key={i} variant="secondary" className="gap-1 py-1">
                <MapPin className="size-3" />
                {h[locale]}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {hotel && (
          <Card className="p-4">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Bed className="size-3.5" /> {t("trip.hotels")}
            </p>
            <p className="font-semibold">{hotel.name[locale]}</p>
            <p className="text-sm text-muted-foreground tnum">
              {fmt.currency(hotel.nightlyPrice, hotel.currency)} · {t("common.perNight")}
            </p>
          </Card>
        )}
        {outbound && (
          <Card className="p-4">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <PlaneTakeoff className="size-3.5" /> {t("trip.flights")}
            </p>
            <p className="font-semibold">{outbound.airline[locale]}</p>
            <p className="text-sm text-muted-foreground tnum">
              {outbound.originAirport} → {outbound.destinationAirport} · {fmt.currency(outbound.price, outbound.currency)}
            </p>
          </Card>
        )}
      </div>

      {trip.tips.length > 0 && (
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <Lightbulb className="size-5 text-accent" /> {t("trip.tips")}
          </h3>
          <ul className="space-y-2">
            {trip.tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-secondary">•</span>
                {tip[locale]}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Disclaimer title={t("disclaimers.visaTitle")} icon="warning">
        {t("disclaimers.visaDesc")}
      </Disclaimer>
    </div>
  );
}
