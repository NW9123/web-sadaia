"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CloudUpload,
  Download,
  Layers,
  MessageSquareText,
  Share2,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { OverviewTab } from "./tabs/overview-tab";
import { ItineraryTab } from "./tabs/itinerary-tab";
import { MapTab } from "./tabs/map-tab";
import { FlightsTab } from "./tabs/flights-tab";
import { HotelsTab } from "./tabs/hotels-tab";
import { BudgetTab } from "./tabs/budget-tab";
import { SavedTab } from "./tabs/saved-tab";
import { NotesTab } from "./tabs/notes-tab";
import { AiAssistant } from "./ai-assistant";
import { VersionHistory } from "./version-history";
import { EmptyState, LoadingCards } from "@/components/shared/states";
import { budgetTotal } from "@/lib/trip/budget";
import { useI18n } from "@/lib/i18n/provider";
import { useTrips } from "@/features/trips/store";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "overview", key: "trip.overview" },
  { value: "itinerary", key: "trip.itinerary" },
  { value: "map", key: "trip.map" },
  { value: "flights", key: "trip.flights" },
  { value: "hotels", key: "trip.hotels" },
  { value: "budget", key: "trip.budget" },
  { value: "saved", key: "trip.savedPlaces" },
  { value: "notes", key: "trip.notes" },
] as const;

export function TripWorkspace({ tripId }: { tripId: string }) {
  const { t, locale, fmt } = useI18n();
  const { getTrip, ready, saveStatus } = useTrips();
  const [tab, setTab] = useState<string>("overview");
  const [mapFocus, setMapFocus] = useState<string | undefined>();
  const [aiOpen, setAiOpen] = useState(false);

  const trip = getTrip(tripId);

  if (!ready) {
    return (
      <div className="container-page py-10">
        <LoadingCards count={3} />
      </div>
    );
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

  const focusOnMap = (activityId: string) => {
    setMapFocus(activityId);
    setTab("map");
  };

  const total = budgetTotal(trip.budgetBreakdown);

  return (
    <div className="container-page py-6">
      {/* Header */}
      <div className="rounded-2xl border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link href="/trips" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowRight className="size-3.5 ltr:rotate-180" />
              {t("nav.trips")}
            </Link>
            <h1 className="text-xl font-bold sm:text-2xl">{trip.title}</h1>
            <p className="text-sm text-muted-foreground">
              {trip.destination.city[locale]}، {trip.destination.country[locale]}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <SaveIndicator status={saveStatus} />
            <VersionHistory trip={trip} />
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
              <Download className="size-4" />
              <span className="hidden sm:inline">{t("common.download")}</span>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/trips/${trip.id}/share`}>
                <Share2 className="size-4" />
                <span className="hidden sm:inline">{t("common.share")}</span>
              </Link>
            </Button>
            <Button size="sm" className="gap-1.5 lg:hidden" onClick={() => setAiOpen(true)}>
              <MessageSquareText className="size-4" />
              {t("trip.aiAssistant")}
            </Button>
          </div>
        </div>

        {/* Summary chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <SummaryChip icon={CalendarDays} value={fmt.dateRange(trip.departureDate, trip.returnDate)} />
          <SummaryChip icon={Layers} value={t("trips.cardDays", { count: trip.days.length })} />
          <SummaryChip icon={Users} value={`${trip.adults + trip.children}`} />
          <SummaryChip
            icon={Wallet}
            value={`${fmt.currency(total, trip.currency)} / ${fmt.currency(trip.budget, trip.currency)}`}
            tone={total > trip.budget ? "bad" : "good"}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Main */}
        <div className="min-w-0">
          <Tabs value={tab} onValueChange={setTab}>
            <div className="overflow-x-auto pb-1">
              <TabsList className="w-max">
                {TABS.map((tabItem) => (
                  <TabsTrigger key={tabItem.value} value={tabItem.value}>
                    {t(tabItem.key)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="mt-5">
              <TabsContent value="overview"><OverviewTab trip={trip} /></TabsContent>
              <TabsContent value="itinerary"><ItineraryTab trip={trip} onFocusMap={focusOnMap} /></TabsContent>
              <TabsContent value="map"><MapTab trip={trip} selectedId={mapFocus} onSelect={setMapFocus} /></TabsContent>
              <TabsContent value="flights"><FlightsTab trip={trip} /></TabsContent>
              <TabsContent value="hotels"><HotelsTab trip={trip} /></TabsContent>
              <TabsContent value="budget"><BudgetTab trip={trip} /></TabsContent>
              <TabsContent value="saved"><SavedTab trip={trip} /></TabsContent>
              <TabsContent value="notes"><NotesTab trip={trip} /></TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Desktop AI side panel */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 h-[calc(100dvh-6rem)] overflow-hidden rounded-2xl border bg-card">
            <AiAssistant trip={trip} />
          </div>
        </aside>
      </div>

      {/* Mobile AI drawer + floating button */}
      <Button
        size="icon"
        className="fixed bottom-5 end-5 z-30 size-14 rounded-full shadow-lg lg:hidden"
        onClick={() => setAiOpen(true)}
        aria-label={t("trip.aiAssistant")}
      >
        <MessageSquareText className="size-6" />
      </Button>
      <Sheet open={aiOpen} onOpenChange={setAiOpen}>
        <SheetContent side="bottom" className="h-[85dvh] p-0">
          <AiAssistant trip={trip} onClose={() => setAiOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SummaryChip({
  icon: Icon,
  value,
  tone,
}: {
  icon: typeof CalendarDays;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-sm",
        tone === "bad" && "border-destructive/30 text-destructive",
        tone === "good" && "border-success/30",
      )}
    >
      <Icon className="size-4 text-muted-foreground" />
      <span className="tnum">{value}</span>
    </span>
  );
}

function SaveIndicator({ status }: { status: "saved" | "saving" | "unsaved" }) {
  const { t } = useI18n();
  return (
    <Badge variant="muted" className="gap-1 font-normal">
      {status === "saving" ? <CloudUpload className="size-3 animate-pulse" /> : <Check className="size-3 text-success" />}
      {status === "saving" ? t("common.saving") : t("common.saved")}
    </Badge>
  );
}
