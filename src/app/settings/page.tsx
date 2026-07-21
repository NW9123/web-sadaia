import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { SettingsPage } from "@/features/settings/settings-page";

export const metadata: Metadata = { title: "الإعدادات" };

export default function Settings() {
  return (
    <AppShell>
      <SettingsPage />
    </AppShell>
  );
}
