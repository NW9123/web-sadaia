"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Link2,
  Lock,
  Printer,
  Send,
  Users,
} from "lucide-react";
import type { Trip } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Disclaimer } from "@/components/shared/data-badges";
import { destinationImage, selectedFlight, selectedHotel } from "@/lib/trip/helpers";
import { budgetTotal } from "@/lib/trip/budget";
import { dayCost } from "@/lib/trip/itinerary";
import { brand } from "@/config/brand";
import { useI18n } from "@/lib/i18n/provider";
import { useTrips } from "@/features/trips/store";
import { getDemoTrip } from "@/data/demoTrips";
import { EmptyState } from "@/components/shared/states";

export function ShareView({ tripId }: { tripId: string }) {
  const { t, locale, fmt } = useI18n();
  const { getTrip, ready, setPublic } = useTrips();

  const trip = getTrip(tripId) ?? getDemoTrip(tripId);

  if (!ready && !trip) {
    return <div className="container-page py-16" />;
  }
  if (!trip) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title={t("states.tripNotFound")}
          action={
            <Button asChild>
              <Link href="/trips">{t("nav.trips")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const isOwner = Boolean(getTrip(tripId));
  const hotel = selectedHotel(trip);
  const outbound = selectedFlight(trip, "outbound");
  const total = budgetTotal(trip.budgetBreakdown);

  return (
    <div className="min-h-dvh bg-muted/30">
      <ShareToolbar trip={trip} isOwner={isOwner} onTogglePublic={(v) => setPublic(trip.id, v)} />

      <main className="container-page max-w-4xl py-8">
        {/* Hero */}
        <Card className="overflow-hidden">
          <div className="relative aspect-[21/9] w-full">
            <ImageWithFallback
              src={destinationImage(trip.destination.id)}
              alt={trip.destination.city[locale]}
              fill
              rounded="rounded-none"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 start-5 text-white">
              <Badge variant="muted" className="mb-2 gap-1">
                <Lock className="size-3" /> {t("share.readOnlyBadge")}
              </Badge>
              <h1 className="text-2xl font-bold drop-shadow sm:text-3xl">{trip.title}</h1>
              <p className="text-white/85">
                {trip.destination.city[locale]}، {trip.destination.country[locale]}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 p-5 text-sm">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4 text-secondary" />
              <span className="tnum">{fmt.dateRange(trip.departureDate, trip.returnDate)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-4 text-secondary" />
              <span className="tnum">{trip.adults + trip.children}</span>
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              {t("trip.estimatedTotal")}: <span className="tnum">{fmt.currency(total, trip.currency)}</span>
            </span>
          </div>
        </Card>

        {/* Summary */}
        <Card className="mt-6 p-5">
          <p className="text-muted-foreground">{trip.summary[locale]}</p>
        </Card>

        {/* Itinerary */}
        <h2 className="mb-4 mt-8 text-xl font-bold">{t("itinerary.title")}</h2>
        <div className="space-y-5">
          {trip.days.map((day) => (
            <Card key={day.id} className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground tnum">{fmt.date(day.dateISO, { weekday: "long", day: "numeric", month: "long" })}</p>
                  <h3 className="font-bold">
                    {t("itinerary.dayLabel", { n: day.dayNumber })} — {day.title[locale]}
                  </h3>
                </div>
                <Badge variant="secondary" className="tnum">{fmt.currency(dayCost(day), trip.currency)}</Badge>
              </div>
              <ol className="space-y-2.5">
                {day.activities.map((a) => (
                  <li key={a.id} className="flex gap-3 border-s-2 border-secondary/30 ps-3">
                    <span className="w-14 shrink-0 text-sm font-semibold text-secondary tnum">{fmt.time(a.startTime)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{a.name[locale]}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t(`enums.category.${a.category}`)} · {a.address[locale]}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-muted-foreground tnum">
                      {a.estimatedCost > 0 ? fmt.currency(a.estimatedCost, trip.currency) : "—"}
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>

        {/* Hotel + flight */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {hotel && (
            <Card className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{t("trip.hotels")}</p>
              <p className="font-semibold">{hotel.name[locale]}</p>
              <p className="text-sm text-muted-foreground tnum">{fmt.currency(hotel.nightlyPrice, hotel.currency)} · {t("common.perNight")}</p>
            </Card>
          )}
          {outbound && (
            <Card className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{t("trip.flights")}</p>
              <p className="font-semibold">{outbound.airline[locale]}</p>
              <p className="text-sm text-muted-foreground tnum">
                {outbound.originAirport} → {outbound.destinationAirport} · {fmt.currency(outbound.price, outbound.currency)}
              </p>
            </Card>
          )}
        </div>

        {/* Budget */}
        <h2 className="mb-3 mt-8 text-xl font-bold">{t("budget.title")}</h2>
        <Card className="p-5">
          <ul className="divide-y text-sm">
            {trip.budgetBreakdown.items.filter((i) => i.amount > 0).map((item) => (
              <li key={item.category} className="flex items-center justify-between py-2">
                <span>{t(`budget.category.${item.category}`)}</span>
                <span className="font-medium tnum">{fmt.currency(item.amount, trip.currency)}</span>
              </li>
            ))}
            <li className="flex items-center justify-between py-2 font-bold">
              <span>{t("budget.estimatedTotal")}</span>
              <span className="tnum">{fmt.currency(total, trip.currency)}</span>
            </li>
          </ul>
        </Card>

        <Disclaimer icon="warning" className="mt-6">
          {t("disclaimers.visaDesc")}
        </Disclaimer>

        <p className="mt-8 text-center text-sm text-muted-foreground no-print">
          {t("share.createdWith")} <span className="font-semibold text-foreground">{brand.name}</span>
        </p>
      </main>
    </div>
  );
}

function ShareToolbar({
  trip,
  isOwner,
  onTogglePublic,
}: {
  trip: Trip;
  isOwner: boolean;
  onTogglePublic: (v: boolean) => void;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t("common.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="glass-header sticky top-0 z-30 border-b no-print">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/trips/${trip.id}`} className="text-muted-foreground hover:text-foreground" aria-label={t("common.back")}>
            <ArrowRight className="size-5 ltr:rotate-180" />
          </Link>
          <BrandLogo />
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <label className="hidden items-center gap-2 text-sm sm:flex">
              {t("share.makePublic")}
              <Switch defaultChecked={trip.isPublic} onCheckedChange={onTogglePublic} />
            </label>
          )}
          <LocaleSwitcher />
          <Button variant="outline" size="sm" className="gap-1.5" onClick={copy}>
            {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
            <span className="hidden sm:inline">{t("common.copyLink")}</span>
          </Button>
          <Button
            asChild
            variant="outline"
            size="icon"
            aria-label="WhatsApp"
          >
            <a href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">
              <Send className="size-4" />
            </a>
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="size-4" />
            <span className="hidden sm:inline">{t("common.print")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
