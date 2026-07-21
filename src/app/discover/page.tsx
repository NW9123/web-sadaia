import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { DiscoverExperience } from "@/features/discover/discover-experience";

export const metadata: Metadata = { title: "اكتشف وجهتك" };

export default function DiscoverPage() {
  return (
    <AppShell>
      <DiscoverExperience />
    </AppShell>
  );
}
