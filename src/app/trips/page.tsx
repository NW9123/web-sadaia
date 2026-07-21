import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { TripsDashboard } from "@/features/trips/trips-dashboard";

export const metadata: Metadata = { title: "رحلاتي" };

export default function TripsPage() {
  return (
    <AppShell>
      <TripsDashboard />
    </AppShell>
  );
}
