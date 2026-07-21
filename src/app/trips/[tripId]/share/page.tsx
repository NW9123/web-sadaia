import type { Metadata } from "next";
import { ShareView } from "@/features/trips/share-view";

export const metadata: Metadata = {
  title: "مشاركة الرحلة",
  robots: { index: false },
};

export default async function SharePage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return <ShareView tripId={tripId} />;
}
