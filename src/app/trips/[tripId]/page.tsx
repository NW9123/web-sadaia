import { WorkspaceShell } from "@/components/layout/app-shell";
import { TripWorkspace } from "@/components/trip/trip-workspace";

export default async function TripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return (
    <WorkspaceShell>
      <TripWorkspace tripId={tripId} />
    </WorkspaceShell>
  );
}
