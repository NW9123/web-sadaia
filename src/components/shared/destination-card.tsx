"use client";

import Link from "next/link";
import { Clock, Plane, Wallet } from "lucide-react";
import type { Destination, Localized } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageWithFallback } from "./image-with-fallback";
import { EstimatedBadge } from "./data-badges";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

interface DestinationCardProps {
  destination: Destination;
  matchScore?: number;
  reasons?: Localized[];
  compare?: { checked: boolean; onToggle: () => void };
  className?: string;
}

export function DestinationCard({
  destination,
  matchScore,
  reasons,
  compare,
  className,
}: DestinationCardProps) {
  const { t, locale, fmt } = useI18n();
  const d = destination;

  return (
    <Card className={cn("group flex flex-col overflow-hidden transition-shadow hover:shadow-soft", className)}>
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <ImageWithFallback
          src={d.imageUrl}
          alt={d.city[locale]}
          category="attraction"
          fill
          rounded="rounded-none"
          className="transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute bottom-3 start-3 text-white">
          <h3 className="text-lg font-bold drop-shadow">{d.city[locale]}</h3>
          <p className="text-sm text-white/85">{d.country[locale]}</p>
        </div>
        {typeof matchScore === "number" && (
          <Badge variant="accent" className="absolute top-3 end-3 tnum">
            {t("discover.matchScore")} {matchScore}%
          </Badge>
        )}
        {compare && (
          <label className="absolute top-3 start-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium shadow">
            <Checkbox checked={compare.checked} onCheckedChange={compare.onToggle} aria-label={t("discover.addToCompare")} />
            {t("discover.compare")}
          </label>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="line-clamp-2 text-sm text-muted-foreground">{d.description[locale]}</p>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5">
            <Wallet className="size-4 text-secondary" aria-hidden />
            <span className="tnum">{fmt.currency(d.avgDailyCost, d.currency)}</span>
            <span className="text-xs text-muted-foreground">/{t("common.perDay")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Plane className="size-4 text-secondary" aria-hidden />
            <span className="tnum">{fmt.duration(d.flightTimeHours * 60)}</span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-4" aria-hidden />
            <span className="text-xs">{d.bestSeasons[locale]}</span>
          </div>
        </div>

        {reasons && reasons.length > 0 && (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {reasons.slice(0, 2).map((r, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-secondary">✓</span>
                {r[locale]}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <EstimatedBadge />
          <Button asChild size="sm" variant="secondary">
            <Link href={`/plan?destination=${d.id}&origin=الرياض`}>{t("discover.planThisTrip")}</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
