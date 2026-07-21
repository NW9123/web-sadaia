"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChipGroup } from "@/components/shared/chip-group";
import { CurrencySelect } from "@/components/shared/currency-select";
import { NumberStepper } from "@/components/shared/number-stepper";
import { GenerationScreen } from "@/components/plan/generation-screen";
import {
  HOTEL_LEVELS,
  INTERESTS,
  PACES,
  SPENDING_LEVELS,
  TRANSPORT_MODES,
  TRAVEL_STYLES,
  type Currency,
  type HotelLevel,
  type Interest,
  type Pace,
  type SpendingLevel,
  type TransportMode,
  type TravelStyle,
} from "@/types/enums";
import type { GenerateTripInput } from "@/types";
import { planFormSchema } from "@/lib/validation/plan";
import { useI18n } from "@/lib/i18n/provider";
import { useTrips } from "@/features/trips/store";
import { resolveDestination } from "@/data/destinations";
import { cn } from "@/lib/utils";

interface WizardState {
  title: string;
  originCity: string;
  destinationQuery: string;
  destinationId?: string;
  recommendDestination: boolean;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  budget: number;
  currency: Currency;
  styles: TravelStyle[];
  interests: Interest[];
  pace: Pace;
  hotelLevel: HotelLevel;
  transport: TransportMode;
  spendingLevel: SpendingLevel;
  includeFlights: boolean;
  includeHotels: boolean;
  specialRequirements: string;
}

const STORAGE_KEY = "tripmind.wizard.v1";

function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function defaultState(): WizardState {
  return {
    title: "",
    originCity: "الرياض",
    destinationQuery: "",
    recommendDestination: false,
    departureDate: isoOffset(21),
    returnDate: isoOffset(28),
    adults: 2,
    children: 0,
    budget: 15000,
    currency: "SAR",
    styles: [],
    interests: [],
    pace: "balanced",
    hotelLevel: "any",
    transport: "mixed",
    spendingLevel: "medium",
    includeFlights: true,
    includeHotels: true,
    specialRequirements: "",
  };
}

function toInput(s: WizardState): GenerateTripInput {
  const resolved = s.destinationId
    ? s.destinationId
    : resolveDestination(s.destinationQuery)?.id;
  return {
    title: s.title || undefined,
    originCity: s.originCity,
    destinationId: resolved,
    destinationQuery: s.destinationQuery || undefined,
    recommendDestination: s.recommendDestination,
    departureDate: s.departureDate,
    returnDate: s.returnDate,
    adults: s.adults,
    children: s.children,
    budget: s.budget,
    currency: s.currency,
    preferences: {
      styles: s.styles,
      interests: s.interests,
      pace: s.pace,
      hotelLevel: s.hotelLevel,
      transport: s.transport,
      spendingLevel: s.spendingLevel,
      includeFlights: s.includeFlights,
      includeHotels: s.includeHotels,
      specialRequirements: s.specialRequirements,
    },
  };
}

const STEP_KEYS = [
  "plan.stepDestination",
  "plan.stepDates",
  "plan.stepBudget",
  "plan.stepPreferences",
  "plan.stepReview",
] as const;

export function PlanWizard() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const { createTrip } = useTrips();

  const [state, setState] = useState<WizardState>(defaultState);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const hydrated = useRef(false);

  // Prefill from URL params (landing quick form) or restore from sessionStorage.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    let next = defaultState();
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) next = { ...next, ...(JSON.parse(saved) as Partial<WizardState>) };
    } catch {
      /* ignore */
    }
    const p = params;
    if (p.get("origin")) next.originCity = p.get("origin")!;
    if (p.get("destination")) {
      const dest = p.get("destination")!;
      next.destinationId = dest;
      next.destinationQuery = resolveDestination(dest)?.city[locale] ?? dest;
    }
    if (p.get("recommend")) next.recommendDestination = true;
    if (p.get("depart")) next.departureDate = p.get("depart")!;
    if (p.get("return")) next.returnDate = p.get("return")!;
    if (p.get("adults")) next.adults = Number(p.get("adults"));
    if (p.get("children")) next.children = Number(p.get("children"));
    if (p.get("budget")) next.budget = Number(p.get("budget"));
    if (p.get("currency")) next.currency = p.get("currency") as Currency;
    setState(next);
    if (p.get("step")) setStep(Math.max(0, Math.min(4, Number(p.get("step")) - 1)));
    // Auto-generate path from the quick form's primary CTA.
    if (p.get("auto")) {
      setTimeout(() => setGenerating(true), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist state as the user edits (draft continuity).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  // Warn about unsaved changes while editing the wizard.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!generating && (state.destinationQuery || state.styles.length > 0)) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state, generating]);

  const set = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const toggleArray = <T extends string>(key: "styles" | "interests", value: T) =>
    setState((s) => {
      const arr = s[key] as T[];
      return {
        ...s,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });

  function validateStep(current: number): boolean {
    const e: Record<string, string> = {};
    if (current === 0) {
      if (state.originCity.trim().length < 2) e.originCity = t("plan.origin");
      if (!state.recommendDestination && !state.destinationQuery.trim() && !state.destinationId)
        e.destinationQuery = t("plan.destination");
    }
    if (current === 1) {
      if (new Date(state.returnDate) < new Date(state.departureDate))
        e.returnDate = t("plan.returnDate");
    }
    if (current === 2) {
      if (!state.budget || state.budget <= 0) e.budget = t("plan.totalBudget");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, 4));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function generate(): Promise<string> {
    const input = toInput(state);
    const check = planFormSchema.safeParse(input);
    if (!check.success) throw new Error("invalid input");
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("generation failed");
    const data = (await res.json()) as { trip: { id: string } };
    createTrip(data.trip as never);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return data.trip.id;
  }

  const canGenerate = useMemo(() => planFormSchema.safeParse(toInput(state)).success, [state]);

  if (generating) {
    return <GenerationScreen generate={generate} onDone={(id) => router.push(`/trips/${id}`)} />;
  }

  return (
    <div className="container-page max-w-3xl py-8">
      <Stepper step={step} onJump={(i) => i <= step && setStep(i)} />

      <Card className="mt-6 p-6 sm:p-8">
        {step === 0 && (
          <StepDestination state={state} set={set} errors={errors} />
        )}
        {step === 1 && <StepDates state={state} set={set} errors={errors} />}
        {step === 2 && <StepBudget state={state} set={set} errors={errors} />}
        {step === 3 && <StepPreferences state={state} set={set} toggleArray={toggleArray} />}
        {step === 4 && <StepReview state={state} onEdit={setStep} />}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={back} disabled={step === 0} className="gap-1">
            <ArrowRight className="size-4 ltr:rotate-180" />
            {t("common.back")}
          </Button>
          {step < 4 ? (
            <Button onClick={next} className="gap-1">
              {t("common.next")}
              <ArrowLeft className="size-4 ltr:rotate-180" />
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => setGenerating(true)}
              disabled={!canGenerate}
              className="gap-2"
            >
              <Sparkles className="size-4" />
              {t("plan.generate")}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ----------------------------- sub-components ----------------------------- */

function Stepper({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  const { t } = useI18n();
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-muted-foreground">
        {t("plan.step", { current: step + 1, total: STEP_KEYS.length })}
      </p>
      <ol className="flex items-center gap-1.5">
        {STEP_KEYS.map((key, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={key} className="flex flex-1 items-center gap-1.5">
              <button
                type="button"
                onClick={() => onJump(i)}
                disabled={i > step}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                  active && "border-secondary bg-secondary text-secondary-foreground",
                  done && "border-success bg-success text-success-foreground",
                  !active && !done && "border-border text-muted-foreground",
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </button>
              {i < STEP_KEYS.length - 1 && (
                <span className={cn("h-0.5 flex-1 rounded", done ? "bg-success" : "bg-border")} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

type SetFn = <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

function StepDestination({
  state,
  set,
  errors,
}: {
  state: WizardState;
  set: SetFn;
  errors: Record<string, string>;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t("plan.stepDestination")}</h2>
      <div className="space-y-2">
        <Label htmlFor="w-name">{t("plan.tripName")}</Label>
        <Input
          id="w-name"
          value={state.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder={t("plan.tripNamePlaceholder")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="w-origin">{t("plan.origin")}</Label>
        <Input
          id="w-origin"
          value={state.originCity}
          onChange={(e) => set("originCity", e.target.value)}
          placeholder={t("plan.originPlaceholder")}
        />
        <FieldError message={errors.originCity} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="w-dest">{t("plan.destination")}</Label>
        <Input
          id="w-dest"
          value={state.destinationQuery}
          disabled={state.recommendDestination}
          onChange={(e) => {
            set("destinationQuery", e.target.value);
            set("destinationId", undefined);
          }}
          placeholder={t("plan.destinationPlaceholder")}
        />
        <FieldError message={errors.destinationQuery} />
      </div>
      <label className="flex cursor-pointer items-center justify-between rounded-xl border bg-muted/40 p-4">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-secondary" />
          {t("plan.recommendToggle")}
        </span>
        <Switch
          checked={state.recommendDestination}
          onCheckedChange={(v) => set("recommendDestination", v)}
        />
      </label>
    </div>
  );
}

function StepDates({
  state,
  set,
  errors,
}: {
  state: WizardState;
  set: SetFn;
  errors: Record<string, string>;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t("plan.stepDates")}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="w-depart">{t("plan.departureDate")}</Label>
          <Input
            id="w-depart"
            type="date"
            value={state.departureDate}
            onChange={(e) => set("departureDate", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="w-return">{t("plan.returnDate")}</Label>
          <Input
            id="w-return"
            type="date"
            min={state.departureDate}
            value={state.returnDate}
            onChange={(e) => set("returnDate", e.target.value)}
          />
          <FieldError message={errors.returnDate} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-xl border p-4">
          <Label>{t("plan.adults")}</Label>
          <NumberStepper value={state.adults} min={1} onChange={(v) => set("adults", v)} />
        </div>
        <div className="flex items-center justify-between rounded-xl border p-4">
          <Label>{t("plan.children")}</Label>
          <NumberStepper value={state.children} min={0} onChange={(v) => set("children", v)} />
        </div>
      </div>
    </div>
  );
}

function StepBudget({
  state,
  set,
  errors,
}: {
  state: WizardState;
  set: SetFn;
  errors: Record<string, string>;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t("plan.stepBudget")}</h2>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="w-budget">{t("plan.totalBudget")}</Label>
          <Input
            id="w-budget"
            inputMode="numeric"
            className="tnum"
            value={state.budget ? String(state.budget) : ""}
            onChange={(e) => set("budget", Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
          />
          <FieldError message={errors.budget} />
        </div>
        <div className="space-y-2">
          <Label>{t("plan.currency")}</Label>
          <CurrencySelect value={state.currency} onChange={(v) => set("currency", v)} className="w-36" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("plan.spendingLevel")}</Label>
        <ChipGroup
          values={SPENDING_LEVELS}
          selected={[state.spendingLevel]}
          onToggle={(v) => set("spendingLevel", v)}
          labelPrefix="enums.spending"
          single
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center justify-between rounded-xl border p-4">
          <span className="text-sm font-medium">{t("plan.includeFlights")}</span>
          <Switch checked={state.includeFlights} onCheckedChange={(v) => set("includeFlights", v)} />
        </label>
        <label className="flex cursor-pointer items-center justify-between rounded-xl border p-4">
          <span className="text-sm font-medium">{t("plan.includeHotels")}</span>
          <Switch checked={state.includeHotels} onCheckedChange={(v) => set("includeHotels", v)} />
        </label>
      </div>
    </div>
  );
}

function StepPreferences({
  state,
  set,
  toggleArray,
}: {
  state: WizardState;
  set: SetFn;
  toggleArray: <T extends string>(key: "styles" | "interests", value: T) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t("plan.stepPreferences")}</h2>

      <div className="space-y-2">
        <Label>{t("plan.travelStyle")}</Label>
        <p className="text-xs text-muted-foreground">{t("plan.travelStyleHint")}</p>
        <ChipGroup
          values={TRAVEL_STYLES}
          selected={state.styles}
          onToggle={(v) => toggleArray("styles", v)}
          labelPrefix="enums.style"
        />
      </div>

      <div className="space-y-2">
        <Label>{t("plan.interests")}</Label>
        <p className="text-xs text-muted-foreground">{t("plan.interestsHint")}</p>
        <ChipGroup
          values={INTERESTS}
          selected={state.interests}
          onToggle={(v) => toggleArray("interests", v)}
          labelPrefix="enums.interest"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("plan.pace")}</Label>
          <ChipGroup
            values={PACES}
            selected={[state.pace]}
            onToggle={(v) => set("pace", v)}
            labelPrefix="enums.pace"
            single
          />
        </div>
        <div className="space-y-2">
          <Label>{t("plan.transport")}</Label>
          <Select value={state.transport} onValueChange={(v) => set("transport", v as TransportMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSPORT_MODES.map((m) => (
                <SelectItem key={m} value={m}>
                  {t(`enums.transport.${m}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("plan.hotelLevel")}</Label>
        <ChipGroup
          values={HOTEL_LEVELS}
          selected={[state.hotelLevel]}
          onToggle={(v) => set("hotelLevel", v)}
          labelPrefix="enums.hotelLevel"
          single
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="w-special">{t("plan.specialRequirements")}</Label>
        <Textarea
          id="w-special"
          value={state.specialRequirements}
          onChange={(e) => set("specialRequirements", e.target.value)}
          placeholder={t("plan.specialRequirementsPlaceholder")}
          rows={3}
        />
      </div>
    </div>
  );
}

function StepReview({ state, onEdit }: { state: WizardState; onEdit: (i: number) => void }) {
  const { t, locale, fmt } = useI18n();
  const rows: { label: string; value: string; step: number }[] = [
    { label: t("plan.origin"), value: state.originCity, step: 0 },
    {
      label: t("plan.destination"),
      value: state.recommendDestination ? t("discover.surpriseTitle") : state.destinationQuery,
      step: 0,
    },
    { label: t("trip.tripDates"), value: fmt.dateRange(state.departureDate, state.returnDate), step: 1 },
    {
      label: t("trip.numTravelers"),
      value: `${state.adults} ${t("common.adults")} · ${state.children} ${t("common.children")}`,
      step: 1,
    },
    { label: t("plan.totalBudget"), value: fmt.currency(state.budget, state.currency), step: 2 },
    {
      label: t("plan.travelStyle"),
      value: state.styles.map((s) => t(`enums.style.${s}`)).join("، ") || "—",
      step: 3,
    },
    {
      label: t("plan.interests"),
      value: state.interests.map((s) => t(`enums.interest.${s}`)).join("، ") || "—",
      step: 3,
    },
    { label: t("plan.pace"), value: t(`enums.pace.${state.pace}`), step: 3 },
    { label: t("plan.hotelLevel"), value: t(`enums.hotelLevel.${state.hotelLevel}`), step: 3 },
    { label: t("plan.transport"), value: t(`enums.transport.${state.transport}`), step: 3 },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">{t("plan.reviewTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("plan.reviewSubtitle")}</p>
      </div>
      <dl className="divide-y rounded-xl border">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between gap-3 p-3.5">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="flex items-center gap-2 text-sm font-medium">
              <span className="text-end">{row.value}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => onEdit(row.step)}
                aria-label={t("plan.editSection")}
              >
                <Pencil className="size-3.5" />
              </Button>
            </dd>
          </div>
        ))}
      </dl>
      {state.specialRequirements && (
        <div className="rounded-xl bg-muted/50 p-4 text-sm">
          <p className="mb-1 font-medium">{t("plan.specialRequirements")}</p>
          <p className="text-muted-foreground">{state.specialRequirements}</p>
        </div>
      )}
    </div>
  );
}
