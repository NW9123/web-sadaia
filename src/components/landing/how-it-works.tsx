"use client";

import { MessageSquareText, Sparkles, Wand2 } from "lucide-react";
import { SectionHeading } from "@/components/shared/section";
import { useI18n } from "@/lib/i18n/provider";

export function HowItWorks() {
  const { t } = useI18n();
  const steps = [
    { icon: Sparkles, title: t("home.step1Title"), desc: t("home.step1Desc") },
    { icon: Wand2, title: t("home.step2Title"), desc: t("home.step2Desc") },
    { icon: MessageSquareText, title: t("home.step3Title"), desc: t("home.step3Desc") },
  ];

  return (
    <section className="container-page py-16">
      <SectionHeading
        align="center"
        eyebrow={t("home.howItWorksTitle")}
        title={t("home.howItWorksTitle")}
        subtitle={t("home.howItWorksSubtitle")}
      />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {steps.map((step, i) => (
          <div key={i} className="relative rounded-2xl border bg-card p-6 shadow-sm">
            <span className="absolute -top-3 end-6 flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground tnum">
              {i + 1}
            </span>
            <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <step.icon className="size-6" aria-hidden />
            </span>
            <h3 className="mb-1.5 text-lg font-semibold">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
