"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/section";
import { DestinationCard } from "@/components/shared/destination-card";
import { destinations } from "@/data/destinations";
import { useI18n } from "@/lib/i18n/provider";

export function SuggestedDestinations() {
  const { t } = useI18n();
  const top = [...destinations].sort((a, b) => b.popularity - a.popularity).slice(0, 6);

  return (
    <section className="container-page py-16">
      <div className="flex items-end justify-between gap-4">
        <SectionHeading
          eyebrow={t("home.suggestedTitle")}
          title={t("home.suggestedTitle")}
          subtitle={t("home.suggestedSubtitle")}
        />
        <Button asChild variant="ghost" className="hidden shrink-0 gap-1 sm:inline-flex">
          <Link href="/discover">
            {t("common.viewAll")}
            <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
          </Link>
        </Button>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {top.map((d) => (
          <DestinationCard key={d.id} destination={d} />
        ))}
      </div>
    </section>
  );
}
