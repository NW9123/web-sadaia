import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { AdminDashboard } from "@/features/admin/admin-dashboard";

export const metadata: Metadata = { title: "لوحة التحكم", robots: { index: false } };

export default function AdminPage() {
  return (
    <AppShell footer={false}>
      <AdminDashboard />
    </AppShell>
  );
}
