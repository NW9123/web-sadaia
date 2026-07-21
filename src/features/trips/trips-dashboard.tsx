"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeading } from "@/components/shared/section";
import { EmptyState, LoadingCards } from "@/components/shared/states";
import { TripCard } from "@/components/trip/trip-card";
import { useI18n } from "@/lib/i18n/provider";
import { useTrips } from "@/features/trips/store";

type Filter = "all" | "upcoming" | "drafts" | "past";

export function TripsDashboard() {
  const { t, locale } = useI18n();
  const { trips, ready } = useTrips();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return trips.filter((trip) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "drafts" && trip.status === "draft") ||
        (filter === "upcoming" && (trip.status === "upcoming" || trip.status === "ongoing")) ||
        (filter === "past" && trip.status === "past");
      if (!matchesFilter) return false;
      if (!q) return true;
      return (
        trip.title.toLowerCase().includes(q) ||
        trip.destination.city[locale].toLowerCase().includes(q) ||
        trip.destination.city.en.toLowerCase().includes(q)
      );
    });
  }, [trips, filter, query, locale]);

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading title={t("trips.title")} subtitle={t("trips.subtitle")} />
        <Button asChild className="gap-2">
          <Link href="/plan">
            <Plus className="size-4" />
            {t("trips.newTrip")}
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">{t("trips.tabAll")}</TabsTrigger>
            <TabsTrigger value="upcoming">{t("trips.tabUpcoming")}</TabsTrigger>
            <TabsTrigger value="drafts">{t("trips.tabDrafts")}</TabsTrigger>
            <TabsTrigger value="past">{t("trips.tabPast")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("trips.searchPlaceholder")}
            className="ps-9"
            aria-label={t("common.search")}
          />
        </div>
      </div>

      <div className="mt-6">
        {!ready ? (
          <LoadingCards count={6} />
        ) : filtered.length === 0 ? (
          query ? (
            <EmptyState title={t("trips.noSearchResults")} />
          ) : (
            <EmptyState
              title={t("trips.empty")}
              description={t("trips.emptyDesc")}
              action={
                <Button asChild className="gap-2">
                  <Link href="/plan">
                    <Plus className="size-4" />
                    {t("trips.emptyCta")}
                  </Link>
                </Button>
              }
            />
          )
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
