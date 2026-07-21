import { Suspense } from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PlanWizard } from "@/features/plan/plan-wizard";
import { LoadingCards } from "@/components/shared/states";

export const metadata: Metadata = { title: "خطط رحلتك" };

export default function PlanPage() {
  return (
    <AppShell footer={false}>
      <Suspense fallback={<div className="container-page max-w-3xl py-10"><LoadingCards count={1} /></div>}>
        <PlanWizard />
      </Suspense>
    </AppShell>
  );
}
