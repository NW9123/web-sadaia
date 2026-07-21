"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Copy, MoreVertical, Trash2, Users, Wallet } from "lucide-react";
import type { Trip } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { destinationImage } from "@/lib/trip/helpers";
import { budgetTotal } from "@/lib/trip/budget";
import { useI18n } from "@/lib/i18n/provider";
import { useTrips } from "@/features/trips/store";

const STATUS_VARIANT: Record<Trip["status"], "secondary" | "accent" | "muted" | "success"> = {
  draft: "muted",
  upcoming: "secondary",
  ongoing: "success",
  past: "muted",
};

export function TripCard({ trip }: { trip: Trip }) {
  const { t, locale, fmt } = useI18n();
  const router = useRouter();
  const { duplicateTrip, deleteTrip } = useTrips();
  const days = trip.days.length;
  const total = budgetTotal(trip.budgetBreakdown);

  return (
    <Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-soft">
      <Link href={`/trips/${trip.id}`} className="relative block aspect-[16/9] overflow-hidden">
        <ImageWithFallback
          src={destinationImage(trip.destination.id)}
          alt={trip.destination.city[locale]}
          fill
          rounded="rounded-none"
          className="transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <Badge variant={STATUS_VARIANT[trip.status]} className="absolute top-3 start-3">
          {t(`trips.status${trip.status.charAt(0).toUpperCase()}${trip.status.slice(1)}`)}
        </Badge>
        <div className="absolute bottom-3 start-3 text-white">
          <p className="text-xs text-white/80">{trip.destination.country[locale]}</p>
          <h3 className="text-lg font-bold drop-shadow">{trip.destination.city[locale]}</h3>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/trips/${trip.id}`} className="line-clamp-1 font-semibold hover:underline">
            {trip.title}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="-me-2 -mt-1 size-8 shrink-0" aria-label={t("common.more")}>
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  const id = duplicateTrip(trip.id);
                  if (id) router.push(`/trips/${id}`);
                }}
              >
                <Copy className="size-4" /> {t("trips.duplicate")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  if (confirm(t("trips.deleteConfirm"))) deleteTrip(trip.id);
                }}
              >
                <Trash2 className="size-4" /> {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" />
            <span className="tnum">{fmt.dateRange(trip.departureDate, trip.returnDate)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-4" />
            <span className="tnum">{trip.adults + trip.children}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" />
            <span className="tnum">{t("trips.cardDays", { count: days })}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Wallet className="size-4" />
            <span className="tnum">{fmt.currency(total, trip.currency)}</span>
          </span>
        </div>

        <Button asChild variant="secondary" size="sm" className="mt-auto">
          <Link href={`/trips/${trip.id}`}>{t("trips.openTrip")}</Link>
        </Button>
      </div>
    </Card>
  );
}
