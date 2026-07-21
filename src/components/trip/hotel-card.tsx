"use client";

import { useState } from "react";
import { Check, ExternalLink, MapPin } from "lucide-react";
import type { Hotel, HotelRecommendation, Trip } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Stars } from "@/components/shared/stars";
import { amenityLabel } from "@/data/amenities";
import { tripNights } from "@/lib/trip/helpers";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const BADGE_KEY: Record<HotelRecommendation, string> = {
  overall: "hotels.badgeOverall",
  budget: "hotels.badgeBudget",
  family: "hotels.badgeFamily",
  location: "hotels.badgeLocation",
  luxury: "hotels.badgeLuxury",
};

export function HotelCard({
  hotel,
  trip,
  selected,
  onSelect,
}: {
  hotel: Hotel;
  trip: Trip;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t, locale, fmt } = useI18n();
  const [imageIndex, setImageIndex] = useState(0);
  const nights = tripNights(trip);
  const total = hotel.nightlyPrice * nights;

  return (
    <Card className={cn("flex flex-col overflow-hidden transition-shadow hover:shadow-sm", selected && "ring-2 ring-secondary")}>
      <div className="relative aspect-[16/10] w-full">
        <ImageWithFallback
          src={hotel.images[imageIndex]}
          alt={hotel.name[locale]}
          category="hotel"
          fill
          rounded="rounded-none"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <Badge variant="accent" className="absolute top-3 start-3">
          {t(BADGE_KEY[hotel.recommendation])}
        </Badge>
        {hotel.images.length > 1 && (
          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
            {hotel.images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}`}
                onClick={() => setImageIndex(i)}
                className={cn("size-1.5 rounded-full bg-white/60", i === imageIndex && "w-4 bg-white")}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{hotel.name[locale]}</h3>
          <Stars value={hotel.stars} size="size-3.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="success" className="tnum">{hotel.rating.toFixed(1)}</Badge>
          <span className="tnum">{t("hotels.reviewCount", { count: hotel.reviewCount })}</span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3" /> {fmt.distance(hotel.distanceFromCenterKm)}
          </span>
        </div>

        <p className="text-sm text-muted-foreground">{hotel.reason[locale]}</p>

        <div className="flex flex-wrap gap-1.5">
          {hotel.amenities.slice(0, 4).map((a) => (
            <Badge key={a} variant="muted" className="font-normal">
              {amenityLabel(a)[locale]}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          <span className={cn(hotel.breakfastIncluded ? "text-success" : "text-muted-foreground")}>
            {hotel.breakfastIncluded ? t("hotels.breakfastIncluded") : t("hotels.breakfastNotIncluded")}
          </span>
          <span className={cn(hotel.freeCancellation ? "text-success" : "text-muted-foreground")}>
            {hotel.freeCancellation ? t("hotels.freeCancellation") : t("hotels.nonRefundable")}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 border-t pt-3">
          <div>
            <p className="text-lg font-bold text-primary tnum">{fmt.currency(hotel.nightlyPrice, hotel.currency)}</p>
            <p className="text-xs text-muted-foreground">
              {t("common.perNight")} · {fmt.currency(total, hotel.currency)} {t("hotels.nightsStay", { count: nights })}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={selected ? "secondary" : "outline"}
            size="sm"
            className="flex-1 gap-1"
            onClick={onSelect}
            aria-pressed={selected}
          >
            {selected && <Check className="size-4" />}
            {selected ? t("hotels.selected") : t("hotels.selectHotel")}
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <a href={hotel.bookingUrl ?? "#"} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" /> {t("hotels.bookNow")}
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}
