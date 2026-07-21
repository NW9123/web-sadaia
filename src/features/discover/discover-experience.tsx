"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GitCompareArrows, Sparkles, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChipGroup } from "@/components/shared/chip-group";
import { DestinationCard } from "@/components/shared/destination-card";
import { SectionHeading } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/states";
import { Stars } from "@/components/shared/stars";
import {
  INTERESTS,
  TRAVEL_STYLES,
  WEATHER_PREFERENCES,
  type Interest,
  type TravelStyle,
  type WeatherPreference,
} from "@/types/enums";
import { recommendDestinationsSync } from "@/lib/discover";
import { useI18n } from "@/lib/i18n/provider";

interface Filters {
  budgetPerDay: number;
  durationDays: number;
  maxFlightHours: number;
  weather: WeatherPreference;
  styles: TravelStyle[];
  interests: Interest[];
}

const DEFAULTS: Filters = {
  budgetPerDay: 800,
  durationDays: 7,
  maxFlightHours: 10,
  weather: "any",
  styles: [],
  interests: [],
};

export function DiscoverExperience() {
  const { t, locale, fmt } = useI18n();
  const [filters, setFilters] = useState<Filters>(DEFAULTS);
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const results = useMemo(() => {
    const recs = recommendDestinationsSync({
      budgetPerDay: filters.budgetPerDay,
      durationDays: filters.durationDays,
      maxFlightHours: filters.maxFlightHours,
      weather: filters.weather,
      styles: filters.styles,
      interests: filters.interests,
    });
    // Hard filters on flight time and budget (with a small tolerance).
    return recs.filter(
      (r) =>
        r.destination.flightTimeHours <= filters.maxFlightHours + 0.5 &&
        r.destination.avgDailyCost <= filters.budgetPerDay * 1.25,
    );
  }, [filters]);

  const toggleCompare = (id: string) =>
    setCompare((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev,
    );

  const compareDestinations = results
    .filter((r) => compare.includes(r.destination.id))
    .map((r) => r.destination);

  const topMatch = results[0];

  const filtersPanel = (
    <FiltersPanel filters={filters} onChange={setFilters} />
  );

  return (
    <div className="container-page py-8">
      <SectionHeading title={t("discover.title")} subtitle={t("discover.subtitle")} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Desktop filters */}
        <aside className="hidden lg:block">
          <Card className="sticky top-20 p-5">{filtersPanel}</Card>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t("discover.resultsCount", { count: results.length })}
            </p>
            <div className="flex items-center gap-2">
              {/* Mobile filters trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 lg:hidden">
                    <SlidersHorizontal className="size-4" />
                    {t("common.filters")}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{t("discover.filtersTitle")}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">{filtersPanel}</div>
                </SheetContent>
              </Sheet>

              {topMatch && (
                <Button asChild size="sm" className="gap-1.5">
                  <Link href={`/plan?destination=${topMatch.destination.id}&origin=الرياض`}>
                    <Sparkles className="size-4" />
                    {t("home.quickForm.surpriseMe")}
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {results.length === 0 ? (
            <EmptyState
              title={t("discover.noResults")}
              action={
                <Button variant="outline" onClick={() => setFilters(DEFAULTS)}>
                  {t("common.clearAll")}
                </Button>
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((r) => (
                <DestinationCard
                  key={r.destination.id}
                  destination={r.destination}
                  matchScore={r.matchScore}
                  reasons={r.reasons}
                  compare={{ checked: compare.includes(r.destination.id), onToggle: () => toggleCompare(r.destination.id) }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compare bar */}
      {compare.length >= 2 && (
        <div className="fixed inset-x-0 bottom-4 z-30 mx-auto w-fit rounded-full border bg-card px-4 py-2 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {t("discover.comparing")} ({compare.length})
            </span>
            <Button size="sm" className="gap-1.5" onClick={() => setCompareOpen(true)}>
              <GitCompareArrows className="size-4" />
              {t("discover.compare")}
            </Button>
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setCompare([])} aria-label={t("common.clearAll")}>
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("discover.compareTitle")}</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-start text-muted-foreground" />
                  {compareDestinations.map((d) => (
                    <th key={d.id} className="p-2 text-start font-semibold">
                      {d.city[locale]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                <CompareRow label={t("discover.avgDailyCost")}>
                  {compareDestinations.map((d) => (
                    <td key={d.id} className="p-2 tnum">{fmt.currency(d.avgDailyCost, d.currency)}</td>
                  ))}
                </CompareRow>
                <CompareRow label={t("discover.flightTime")}>
                  {compareDestinations.map((d) => (
                    <td key={d.id} className="p-2 tnum">{fmt.duration(d.flightTimeHours * 60)}</td>
                  ))}
                </CompareRow>
                <CompareRow label={t("discover.bestSeason")}>
                  {compareDestinations.map((d) => (
                    <td key={d.id} className="p-2">{d.bestSeasons[locale]}</td>
                  ))}
                </CompareRow>
                <CompareRow label={t("common.rating")}>
                  {compareDestinations.map((d) => (
                    <td key={d.id} className="p-2">
                      <Stars value={4 + (d.popularity % 10) / 10} size="size-3.5" />
                    </td>
                  ))}
                </CompareRow>
                <CompareRow label="">
                  {compareDestinations.map((d) => (
                    <td key={d.id} className="p-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/plan?destination=${d.id}&origin=الرياض`}>{t("discover.planThisTrip")}</Link>
                      </Button>
                    </td>
                  ))}
                </CompareRow>
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CompareRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="p-2 font-medium text-muted-foreground">{label}</td>
      {children}
    </tr>
  );
}

function FiltersPanel({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const { t, fmt } = useI18n();
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="space-y-6">
      <p className="hidden font-semibold lg:block">{t("discover.filtersTitle")}</p>

      <div className="space-y-2">
        <Label className="flex items-center justify-between">
          <span>{t("discover.budgetRange")}</span>
          <span className="text-sm text-muted-foreground tnum">{fmt.currency(filters.budgetPerDay, "SAR")}</span>
        </Label>
        <Slider
          value={[filters.budgetPerDay]}
          min={150}
          max={2000}
          step={50}
          onValueChange={([v]) => set("budgetPerDay", v ?? filters.budgetPerDay)}
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center justify-between">
          <span>{t("discover.tripDuration")}</span>
          <span className="text-sm text-muted-foreground tnum">{filters.durationDays} {t("common.days")}</span>
        </Label>
        <Slider
          value={[filters.durationDays]}
          min={2}
          max={14}
          step={1}
          onValueChange={([v]) => set("durationDays", v ?? filters.durationDays)}
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center justify-between">
          <span>{t("discover.flightDuration")}</span>
          <span className="text-sm text-muted-foreground tnum">≤ {filters.maxFlightHours} {t("common.hours")}</span>
        </Label>
        <Slider
          value={[filters.maxFlightHours]}
          min={1}
          max={12}
          step={1}
          onValueChange={([v]) => set("maxFlightHours", v ?? filters.maxFlightHours)}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("discover.weather")}</Label>
        <ChipGroup
          values={WEATHER_PREFERENCES}
          selected={[filters.weather]}
          onToggle={(v) => set("weather", v)}
          labelPrefix="weather"
          single
        />
      </div>

      <div className="space-y-2">
        <Label>{t("discover.style")}</Label>
        <ChipGroup
          values={TRAVEL_STYLES}
          selected={filters.styles}
          onToggle={(v) =>
            set("styles", filters.styles.includes(v) ? filters.styles.filter((s) => s !== v) : [...filters.styles, v])
          }
          labelPrefix="enums.style"
        />
      </div>

      <div className="space-y-2">
        <Label>{t("discover.interests")}</Label>
        <ChipGroup
          values={INTERESTS}
          selected={filters.interests}
          onToggle={(v) =>
            set("interests", filters.interests.includes(v) ? filters.interests.filter((s) => s !== v) : [...filters.interests, v])
          }
          labelPrefix="enums.interest"
        />
      </div>
    </div>
  );
}
