"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, ArrowDownRight, CheckCircle2 } from "lucide-react";
import type { Trip } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/shared/section";
import { EstimatedBadge } from "@/components/shared/data-badges";
import {
  averageDailyCost,
  budgetRemaining,
  budgetTotal,
  dailyCosts,
  isOverBudget,
} from "@/lib/trip/budget";
import { chartPalette } from "@/config/brand";
import { useI18n } from "@/lib/i18n/provider";
import { useTrips } from "@/features/trips/store";
import { cn } from "@/lib/utils";

export function BudgetTab({ trip }: { trip: Trip }) {
  const { t, fmt } = useI18n();
  const { selectHotel, selectFlight, mutate } = useTrips();
  const budget = trip.budgetBreakdown;
  const total = budgetTotal(budget);
  const remaining = budgetRemaining(budget);
  const over = isOverBudget(budget);
  const avgDaily = averageDailyCost(budget, trip.days.length);

  const items = budget.items
    .filter((i) => i.amount > 0)
    .map((i) => ({ key: i.category, name: t(`budget.category.${i.category}`), value: i.amount }));

  const daily = dailyCosts(trip).map((d) => ({ name: `${d.day}`, value: d.cost }));

  const stats = [
    { label: t("budget.yourBudget"), value: fmt.currency(budget.userBudget, trip.currency) },
    { label: t("budget.estimatedTotal"), value: fmt.currency(total, trip.currency), accent: true },
    {
      label: over ? t("budget.over") : t("budget.remaining"),
      value: fmt.currency(Math.abs(remaining), trip.currency),
      tone: over ? "bad" : "good",
    },
    { label: t("budget.avgDaily"), value: fmt.currency(avgDaily, trip.currency) },
    { label: t("budget.minExpected"), value: fmt.currency(budget.minTotal, trip.currency) },
    { label: t("budget.maxExpected"), value: fmt.currency(budget.maxTotal, trip.currency) },
  ];

  const suggestions = [
    {
      key: "hotel",
      label: t("budget.suggestionCheaperHotel"),
      run: () => {
        const cheapest = [...trip.hotels].sort((a, b) => a.nightlyPrice - b.nightlyPrice)[0];
        if (cheapest) selectHotel(trip.id, cheapest.id);
      },
    },
    {
      key: "flight",
      label: t("budget.suggestionCheaperFlight"),
      run: () => {
        const out = [...trip.flights.filter((f) => f.direction === "outbound")].sort((a, b) => a.price - b.price)[0];
        const ret = [...trip.flights.filter((f) => f.direction === "return")].sort((a, b) => a.price - b.price)[0];
        if (out) selectFlight(trip.id, out.id, "outbound");
        if (ret) selectFlight(trip.id, ret.id, "return");
      },
    },
    {
      key: "activity",
      label: t("budget.suggestionRemoveActivity"),
      run: () =>
        mutate(trip.id, (t2) => {
          const all = t2.days.flatMap((d) => d.activities).filter((a) => !a.isLocked && !a.isOptional && a.category !== "restaurant");
          const most = [...all].sort((a, b) => b.estimatedCost - a.estimatedCost)[0];
          if (most) most.isOptional = true;
        }),
    },
    {
      key: "transport",
      label: t("budget.suggestionPublicTransport"),
      run: () => mutate(trip.id, (t2) => {
        t2.preferences = { ...t2.preferences, transport: "public" };
      }),
    },
    {
      key: "dining",
      label: t("budget.suggestionReduceDining"),
      run: () => mutate(trip.id, (t2) => {
        t2.preferences = { ...t2.preferences, spendingLevel: "low" };
      }),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeading title={t("budget.title")} subtitle={t("budget.subtitle")} />
        <EstimatedBadge />
      </div>

      {/* Budget vs estimate bar */}
      <Card className="p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("budget.estimatedTotal")}</span>
          <span className="font-semibold tnum">
            {fmt.currency(total, trip.currency)} / {fmt.currency(budget.userBudget, trip.currency)}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", over ? "bg-destructive" : "bg-success")}
            style={{ width: `${Math.min(100, (total / Math.max(budget.userBudget, 1)) * 100)}%` }}
          />
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s, i) => (
          <Card key={i} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p
              className={cn(
                "mt-1 text-base font-bold tnum",
                s.accent && "text-primary",
                s.tone === "bad" && "text-destructive",
                s.tone === "good" && "text-success",
              )}
            >
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Over/within budget banner */}
      {over ? (
        <Card className="border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive">{t("budget.overBudgetTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("budget.overBudgetDesc", { amount: fmt.currency(Math.abs(remaining), trip.currency) })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <Button key={s.key} variant="outline" size="sm" className="gap-1" onClick={s.run}>
                    <ArrowDownRight className="size-3.5" />
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-success/30 bg-success/5 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 shrink-0 text-success" />
            <p className="text-sm">
              <span className="font-semibold text-success">{t("budget.withinBudgetTitle")}</span>{" "}
              <span className="text-muted-foreground">
                {t("budget.withinBudgetDesc", { amount: fmt.currency(Math.abs(remaining), trip.currency) })}
              </span>
            </p>
          </div>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">{t("budget.breakdown")}</h3>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-52 w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={items} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {items.map((entry, i) => (
                      <Cell key={entry.key} fill={chartPalette[i % chartPalette.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => fmt.currency(value, trip.currency)}
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-full space-y-1.5 text-sm sm:w-1/2">
              {items.map((item, i) => (
                <li key={item.key} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: chartPalette[i % chartPalette.length] }} />
                    {item.name}
                  </span>
                  <span className="font-medium tnum">{fmt.currency(item.value, trip.currency)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold">{t("budget.dailySpending")}</h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  formatter={(value: number) => fmt.currency(value, trip.currency)}
                  labelFormatter={(l) => `${t("common.day")} ${l}`}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={chartPalette[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
