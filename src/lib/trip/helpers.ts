import type { Flight, Hotel, Trip } from "@/types";
import { getDestination } from "@/data/destinations";
import { budgetTotal } from "./budget";

/** Resolve a destination's hero image (used by trip cards). */
export function destinationImage(destinationId: string): string | undefined {
  return getDestination(destinationId)?.imageUrl;
}

/** Number of nights between departure and return. */
export function tripNights(trip: Trip): number {
  const ms = new Date(trip.returnDate).getTime() - new Date(trip.departureDate).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

export function selectedHotel(trip: Trip): Hotel | undefined {
  return trip.hotels.find((h) => h.id === trip.selectedHotelId) ?? trip.hotels[0];
}

export function selectedFlight(trip: Trip, direction: "outbound" | "return"): Flight | undefined {
  const id = direction === "outbound" ? trip.selectedOutboundId : trip.selectedReturnId;
  return (
    trip.flights.find((f) => f.id === id) ??
    trip.flights.find((f) => f.direction === direction)
  );
}

export function estimatedTotal(trip: Trip): number {
  return budgetTotal(trip.budgetBreakdown);
}

/** Derive a live status from dates (fallback if a trip's stored status is stale). */
export function liveStatus(trip: Trip, nowISO: string): Trip["status"] {
  if (trip.status === "draft") return "draft";
  const now = new Date(nowISO.slice(0, 10)).getTime();
  const start = new Date(trip.departureDate).getTime();
  const end = new Date(trip.returnDate).getTime();
  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "ongoing";
}
