"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

export function LandingCta() {
  const { t } = useI18n();
  return (
    <section className="container-page py-16">
      <div className="hero-gradient relative overflow-hidden rounded-3xl px-6 py-14 text-center text-primary-foreground sm:px-12">
        <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t("home.ctaTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/85">{t("home.ctaSubtitle")}</p>
        <Button asChild size="lg" variant="accent" className="mt-7">
          <Link href="/plan">{t("home.ctaButton")}</Link>
        </Button>
      </div>
    </section>
  );
}
