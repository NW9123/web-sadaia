"use client";

import { Briefcase, Check, ExternalLink, Plane } from "lucide-react";
import type { Flight, FlightRecommendation, Trip } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const BADGE_KEY: Record<FlightRecommendation, string> = {
  cheapest: "flights.badgeCheapest",
  fastest: "flights.badgeFastest",
  bestValue: "flights.badgeBestValue",
  bestArrival: "flights.badgeBestArrival",
  family: "flights.badgeFamily",
};

const BADGE_VARIANT: Record<FlightRecommendation, "accent" | "secondary" | "success"> = {
  cheapest: "success",
  fastest: "secondary",
  bestValue: "accent",
  bestArrival: "secondary",
  family: "secondary",
};

export function FlightCard({
  flight,
  trip,
  selected,
  onSelect,
}: {
  flight: Flight;
  trip: Trip;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t, locale, fmt } = useI18n();

  return (
    <Card className={cn("p-4 transition-shadow hover:shadow-sm", selected && "ring-2 ring-secondary")}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
            {flight.airlineCode}
          </span>
          <div>
            <p className="text-sm font-semibold">{flight.airline[locale]}</p>
            <p className="text-xs text-muted-foreground">
              {flight.direction === "outbound" ? t("flights.outbound") : t("flights.return")}
            </p>
          </div>
        </div>
        <Badge variant={BADGE_VARIANT[flight.recommendation]}>{t(BADGE_KEY[flight.recommendation])}</Badge>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-center">
          <p className="text-lg font-bold tnum">{fmt.time(flight.departISO)}</p>
          <p className="text-xs text-muted-foreground">{flight.originAirport}</p>
        </div>
        <div className="flex flex-1 flex-col items-center">
          <span className="text-xs text-muted-foreground tnum">{fmt.duration(flight.durationMinutes)}</span>
          <div className="my-1 flex w-full items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            <span className="h-px flex-1 bg-border" />
            <Plane className="size-3.5 rotate-90 text-secondary rtl:-rotate-90" />
            <span className="h-px flex-1 bg-border" />
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          </div>
          <span className="text-xs text-muted-foreground">
            {flight.stops === 0
              ? t("flights.direct")
              : flight.stops === 1
                ? t("flights.oneStop")
                : t("flights.multiStop", { count: flight.stops })}
          </span>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold tnum">{fmt.time(flight.arriveISO)}</p>
          <p className="text-xs text-muted-foreground">{flight.destinationAirport}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Briefcase className="size-3.5" />
            {flight.baggageIncluded ? t("flights.included") : t("flights.notIncluded")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary tnum">{fmt.currency(flight.price, flight.currency)}</span>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          variant={selected ? "secondary" : "outline"}
          size="sm"
          className="flex-1 gap-1"
          onClick={onSelect}
          aria-pressed={selected}
        >
          {selected && <Check className="size-4" />}
          {selected ? t("flights.selected") : t("flights.selectFlight")}
        </Button>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <a href={flight.bookingUrl ?? "#"} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" /> {t("flights.bookNow")}
          </a>
        </Button>
      </div>
    </Card>
  );
}
