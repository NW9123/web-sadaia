import type { Coordinates, TransportMode, TravelLeg } from "@/types";
import type { MapsProvider } from "../types";

/** Average speeds (km/h) per transport mode, used for demo travel-time estimates. */
const SPEED_KMH: Record<TransportMode, number> = {
  walking: 4.5,
  public: 22,
  taxi: 28,
  rental: 30,
  mixed: 25,
};

function haversine(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const mockMapsProvider: MapsProvider = {
  id: "mock",
  distanceKm(from, to) {
    return Math.round(haversine(from, to) * 100) / 100;
  },
  estimateLeg(from, to, mode): TravelLeg {
    // Straight-line distance inflated by a routing factor to approximate roads.
    const straight = haversine(from, to);
    const routeKm = straight * 1.3;
    const speed = SPEED_KMH[mode];
    // Add a small fixed overhead (parking, waiting, walking to stop).
    const minutes = Math.max(3, Math.round((routeKm / speed) * 60) + 4);
    return {
      distanceKm: Math.round(routeKm * 10) / 10,
      minutes,
      method: mode,
    };
  },
};
