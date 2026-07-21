"use client";

import Link from "next/link";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/shared/section";
import { EstimatedBadge } from "@/components/shared/data-badges";
import { demoTrips } from "@/data/demoTrips";
import { useI18n } from "@/lib/i18n/provider";

export function ExampleItinerary() {
  const { t, locale, fmt } = useI18n();
  const trip = demoTrips[0]!;
  const day = trip.days[1] ?? trip.days[0]!;
  const activities = day.activities.slice(0, 4);

  return (
    <section className="bg-muted/40 py-16">
      <div className="container-page">
        <SectionHeading
          align="center"
          eyebrow={t("home.exampleTitle")}
          title={t("home.exampleTitle")}
          subtitle={t("home.exampleSubtitle")}
        />

        <Card className="mx-auto mt-10 max-w-3xl overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-card p-5">
            <div>
              <p className="text-sm text-muted-foreground">
                {trip.destination.city[locale]} · {fmt.dateRange(trip.departureDate, trip.returnDate)}
              </p>
              <h3 className="text-lg font-bold">{day.title[locale]}</h3>
            </div>
            <Badge variant="secondary" className="tnum">
              {t("itinerary.dailyCost")}: {fmt.currency(
                day.activities.reduce((s, a) => s + a.estimatedCost, 0),
                trip.currency,
              )}
            </Badge>
          </div>

          <ol className="divide-y">
            {activities.map((a) => (
              <li key={a.id} className="flex items-center gap-4 p-4">
                <div className="w-16 shrink-0 text-center">
                  <span className="block text-sm font-semibold tnum">{fmt.time(a.startTime)}</span>
                  <span className="text-xs text-muted-foreground tnum">{fmt.duration(a.durationMinutes)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.name[locale]}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="size-3" /> {a.address[locale]}
                  </p>
                </div>
                <Badge variant="muted" className="hidden shrink-0 gap-1 sm:inline-flex">
                  <Clock className="size-3" />
                  {t(`enums.category.${a.category}`)}
                </Badge>
              </li>
            ))}
          </ol>

          <div className="flex items-center justify-between gap-3 border-t bg-muted/30 p-4">
            <EstimatedBadge />
            <Button asChild size="sm" variant="secondary" className="gap-1">
              <Link href={`/trips/${trip.id}`}>
                {t("common.seeMore")}
                <ArrowLeft className="size-4 ltr:rotate-180" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
