"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, PlaneTakeoff, Search, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencySelect } from "@/components/shared/currency-select";
import { TravelersField } from "@/components/shared/travelers-field";
import type { Currency } from "@/types";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function QuickPlanForm({ className }: { className?: string }) {
  const { t } = useI18n();
  const router = useRouter();

  const [origin, setOrigin] = useState("الرياض");
  const [destination, setDestination] = useState("");
  const [recommend, setRecommend] = useState(false);
  const [departureDate, setDepartureDate] = useState(isoOffset(21));
  const [returnDate, setReturnDate] = useState(isoOffset(28));
  const [travelers, setTravelers] = useState({ adults: 2, children: 0 });
  const [budget, setBudget] = useState("15000");
  const [currency, setCurrency] = useState<Currency>("SAR");
  const [error, setError] = useState<string | null>(null);

  function buildParams(): URLSearchParams {
    const params = new URLSearchParams();
    params.set("origin", origin);
    if (recommend) params.set("recommend", "1");
    else if (destination) params.set("destination", destination);
    params.set("depart", departureDate);
    params.set("return", returnDate);
    params.set("adults", String(travelers.adults));
    params.set("children", String(travelers.children));
    params.set("budget", budget);
    params.set("currency", currency);
    return params;
  }

  function submit(advanced: boolean) {
    setError(null);
    if (!origin.trim()) return setError(t("plan.origin"));
    if (!recommend && !destination.trim()) {
      setRecommend(true);
    }
    if (new Date(returnDate) < new Date(departureDate)) {
      return setError(t("plan.returnDate"));
    }
    router.push(`/plan?${buildParams().toString()}${advanced ? "&step=1" : "&auto=1"}`);
  }

  return (
    <div
      className={cn(
        "rounded-3xl border border-border/60 bg-card/95 p-5 shadow-card backdrop-blur sm:p-6",
        className,
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="q-origin" className="text-xs text-muted-foreground">
            {t("home.quickForm.origin")}
          </Label>
          <div className="relative">
            <PlaneTakeoff className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
            <Input
              id="q-origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="ps-9"
              placeholder={t("plan.originPlaceholder")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="q-dest" className="text-xs text-muted-foreground">
              {t("home.quickForm.destination")}
            </Label>
            <button
              type="button"
              onClick={() => setRecommend((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                recommend ? "text-secondary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Sparkles className="size-3" />
              {t("home.quickForm.surpriseMe")}
            </button>
          </div>
          <div className="relative">
            <MapPin className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
            <Input
              id="q-dest"
              value={recommend ? "" : destination}
              disabled={recommend}
              onChange={(e) => setDestination(e.target.value)}
              className="ps-9"
              placeholder={recommend ? t("discover.surpriseTitle") : t("plan.destinationPlaceholder")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="q-depart" className="text-xs text-muted-foreground">
            {t("plan.departureDate")}
          </Label>
          <Input
            id="q-depart"
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="q-return" className="text-xs text-muted-foreground">
            {t("plan.returnDate")}
          </Label>
          <Input
            id="q-return"
            type="date"
            value={returnDate}
            min={departureDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("home.quickForm.travelers")}</Label>
          <TravelersField
            adults={travelers.adults}
            kids={travelers.children}
            onChange={setTravelers}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="q-budget" className="text-xs text-muted-foreground">
            {t("home.quickForm.budget")}
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Wallet className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
              <Input
                id="q-budget"
                inputMode="numeric"
                value={budget}
                onChange={(e) => setBudget(e.target.value.replace(/[^\d]/g, ""))}
                className="ps-9 tnum"
              />
            </div>
            <CurrencySelect value={currency} onChange={setCurrency} className="w-28 shrink-0" />
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button size="lg" className="flex-1 gap-2" onClick={() => submit(false)}>
          <Search className="size-4" />
          {t("home.quickForm.submit")}
        </Button>
        <Button size="lg" variant="outline" onClick={() => submit(true)}>
          {t("home.quickForm.advanced")}
        </Button>
      </div>
    </div>
  );
}
