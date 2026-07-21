"use client";

import { CalendarRange, Map, MessagesSquare, PieChart, PlaneTakeoff, Star } from "lucide-react";
import { SectionHeading } from "@/components/shared/section";
import { useI18n } from "@/lib/i18n/provider";

export function Features() {
  const { t } = useI18n();
  const features = [
    { icon: CalendarRange, title: t("features.itineraryTitle"), desc: t("features.itineraryDesc") },
    { icon: PieChart, title: t("features.budgetTitle"), desc: t("features.budgetDesc") },
    { icon: Map, title: t("features.mapTitle"), desc: t("features.mapDesc") },
    { icon: MessagesSquare, title: t("features.aiTitle"), desc: t("features.aiDesc") },
    { icon: PlaneTakeoff, title: t("features.flightsTitle"), desc: t("features.flightsDesc") },
    { icon: Star, title: t("features.localTitle"), desc: t("features.localDesc") },
  ];

  return (
    <section className="bg-muted/40 py-16">
      <div className="container-page">
        <SectionHeading
          align="center"
          eyebrow={t("home.featuresTitle")}
          title={t("home.featuresTitle")}
          subtitle={t("home.featuresSubtitle")}
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div key={i} className="rounded-2xl border bg-card p-6 shadow-sm">
              <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <f.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mb-1.5 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
