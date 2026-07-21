"use client";

import Link from "next/link";
import { Sparkles, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickPlanForm } from "./quick-plan-form";
import { useI18n } from "@/lib/i18n/provider";

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="hero-gradient relative overflow-hidden text-primary-foreground">
      <div className="container-page relative grid gap-10 py-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-20">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium ring-1 ring-white/20">
            <Sparkles className="size-4 text-accent" />
            {t("home.heroBadge")}
          </span>

          <h1 className="text-balance text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl">
            {t("home.heroTitle")}
          </h1>
          <p className="max-w-xl text-lg text-white/85">{t("home.heroSubtitle")}</p>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="accent" className="gap-2">
              <Link href="/plan">{t("home.heroPrimaryCta")}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <Link href="/discover">{t("home.heroSecondaryCta")}</Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-white/75">
            <span className="inline-flex items-center gap-1.5">
              <Star className="size-4 fill-accent text-accent" /> 4.9/5
            </span>
            <span className="inline-flex items-center gap-1.5">
              <TrendingUp className="size-4 text-accent" /> +50 {t("discover.title")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-4 text-accent" /> {t("common.poweredByAi")}
            </span>
          </div>
        </div>

        <QuickPlanForm className="lg:justify-self-end lg:max-w-md" />
      </div>
    </section>
  );
}
