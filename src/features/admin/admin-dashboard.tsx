"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, MapPinned, ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeading } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/states";
import { destinations } from "@/data/destinations";
import { allCuratedPlaces } from "@/data/places";
import { chartPalette } from "@/config/brand";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/features/auth/store";
import { useTrips } from "@/features/trips/store";

export function AdminDashboard() {
  const { t, locale, fmt } = useI18n();
  const { isAdmin, ready } = useAuth();
  const { trips } = useTrips();

  const [hiddenDest, setHiddenDest] = useState<Set<string>>(new Set());
  const [hiddenPlace, setHiddenPlace] = useState<Set<string>>(new Set());

  const popular = useMemo(() => {
    const counts = new Map<string, number>();
    for (const trip of trips) counts.set(trip.destination.id, (counts.get(trip.destination.id) ?? 0) + 1);
    return destinations
      .map((d) => ({
        id: d.id,
        name: d.city[locale],
        value: Math.round(d.popularity / 8) + (counts.get(d.id) ?? 0) * 5,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [trips, locale]);

  // Deterministic demo analytics (clearly labelled).
  const aiUsage = [
    { name: "Sat", value: 42 },
    { name: "Sun", value: 65 },
    { name: "Mon", value: 51 },
    { name: "Tue", value: 78 },
    { name: "Wed", value: 96 },
    { name: "Thu", value: 84 },
    { name: "Fri", value: 120 },
  ];

  const apiErrors = [
    { provider: "Places API", code: 429, count: 3 },
    { provider: "Flights API", code: 503, count: 1 },
    { provider: "Weather API", code: 500, count: 2 },
  ];

  if (ready && !isAdmin) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ShieldCheck}
          title={t("admin.accessDenied")}
          action={
            <Button asChild>
              <Link href="/auth/login?next=/admin">{t("nav.login")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const stats = [
    { icon: MapPinned, label: t("admin.totalTrips"), value: (trips.length + 1284).toLocaleString("en-US") },
    { icon: Users, label: t("admin.totalUsers"), value: "3,942" },
    { icon: TrendingUp, label: t("admin.tripsThisMonth"), value: "268" },
    { icon: Sparkles, label: t("admin.aiRequests"), value: "12,530" },
    { icon: AlertTriangle, label: t("admin.errorRate"), value: "0.4%" },
  ];

  return (
    <div className="container-page py-8">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <ShieldCheck className="size-3" /> Admin
        </Badge>
      </div>
      <SectionHeading className="mt-2" title={t("admin.title")} subtitle={t("admin.subtitle")} />

      {/* Stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s, i) => (
          <Card key={i} className="p-4">
            <s.icon className="mb-2 size-5 text-secondary" />
            <p className="text-2xl font-bold tnum">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Popular destinations */}
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">{t("admin.popularDestinations")}</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popular} layout="vertical" margin={{ left: 10, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={80} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {popular.map((entry, i) => (
                    <Cell key={entry.id} fill={chartPalette[i % chartPalette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI usage */}
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">{t("admin.aiUsage")}</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aiUsage} margin={{ left: 0, right: 8 }}>
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} width={32} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={chartPalette[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* API errors */}
      <Card className="mt-5 p-5">
        <h3 className="mb-3 font-semibold">{t("admin.apiErrors")}</h3>
        <ul className="divide-y text-sm">
          {apiErrors.map((e, i) => (
            <li key={i} className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-warning" />
                {e.provider}
              </span>
              <span className="flex items-center gap-3 text-muted-foreground">
                <Badge variant="outline" className="tnum">{e.code}</Badge>
                <span className="tnum">×{e.count}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Management */}
      <Card className="mt-5 p-5">
        <Tabs defaultValue="destinations">
          <TabsList>
            <TabsTrigger value="destinations">{t("admin.manageDestinations")}</TabsTrigger>
            <TabsTrigger value="places">{t("admin.managePlaces")}</TabsTrigger>
          </TabsList>

          <TabsContent value="destinations" className="mt-4">
            <ManagementTable
              rows={destinations.map((d) => ({
                id: d.id,
                name: d.city[locale],
                meta: `${fmt.currency(d.avgDailyCost, d.currency)} / ${t("common.perDay")}`,
              }))}
              hidden={hiddenDest}
              onToggle={(id) =>
                setHiddenDest((prev) => {
                  const next = new Set(prev);
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                })
              }
            />
          </TabsContent>

          <TabsContent value="places" className="mt-4">
            <ManagementTable
              rows={allCuratedPlaces.slice(0, 20).map((p) => ({
                id: p.id,
                name: p.name[locale],
                meta: t(`enums.category.${p.category}`),
              }))}
              hidden={hiddenPlace}
              onToggle={(id) =>
                setHiddenPlace((prev) => {
                  const next = new Set(prev);
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                })
              }
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function ManagementTable({
  rows,
  hidden,
  onToggle,
}: {
  rows: { id: string; name: string; meta: string }[];
  hidden: Set<string>;
  onToggle: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="border-b text-start text-muted-foreground">
            <th className="p-2 text-start font-medium">{t("admin.destination")}</th>
            <th className="p-2 text-start font-medium">—</th>
            <th className="p-2 text-start font-medium">{t("admin.status")}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => {
            const isHidden = hidden.has(row.id);
            return (
              <tr key={row.id}>
                <td className="p-2 font-medium">{row.name}</td>
                <td className="p-2 text-muted-foreground">{row.meta}</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={!isHidden} onCheckedChange={() => onToggle(row.id)} aria-label={row.name} />
                    <Badge variant={isHidden ? "muted" : "success"}>
                      {isHidden ? t("admin.hidden") : t("admin.active")}
                    </Badge>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
