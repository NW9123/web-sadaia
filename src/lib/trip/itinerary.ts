import type {
  Activity,
  Coordinates,
  Place,
  Pace,
  TransportMode,
  Trip,
  TripDay,
} from "@/types";
import { localId } from "@/lib/utils";
import { mockMapsProvider } from "@/lib/integrations/mock/maps";

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutesToTime(total: number): string {
  const clamped = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(clamped / 60);
  const m = Math.round(clamped % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Default day start (minutes from midnight) per pace. */
export const PACE_START_MINUTES: Record<Pace, number> = {
  relaxed: 10 * 60 + 30,
  balanced: 9 * 60 + 30,
  intensive: 8 * 60 + 30,
};

/** Max activities per day per pace (used by the generator). */
export const PACE_MAX_ACTIVITIES: Record<Pace, number> = {
  relaxed: 3,
  balanced: 4,
  intensive: 6,
};

/**
 * Recompute start/end times and travel legs for a day's activities in order,
 * chaining from the hotel to the first activity. Respects a minimum day-start
 * time (e.g. an "no activities before 11:00" constraint) via `earliestStart`.
 * Locked activities keep their explicit start time as an anchor when possible.
 */
export function recomputeDayTimes(
  activities: Activity[],
  hotelCoords: Coordinates,
  transport: TransportMode,
  startMinutes: number,
  earliestStart = 0,
): Activity[] {
  let cursor = Math.max(startMinutes, earliestStart);
  let prevCoords = hotelCoords;

  return activities.map((activity, index) => {
    const leg = mockMapsProvider.estimateLeg(prevCoords, activity.coordinates, transport);
    const startMin = Math.max(cursor + (index === 0 ? Math.min(leg.minutes, 25) : leg.minutes), earliestStart);
    const endMin = startMin + activity.durationMinutes;
    prevCoords = activity.coordinates;
    // Leave a small buffer between activities.
    cursor = endMin + 10;
    return {
      ...activity,
      startTime: minutesToTime(startMin),
      endTime: minutesToTime(endMin),
      travelFromPrevious: { ...leg },
    };
  });
}

/** Convert a verified Place into a schedulable Activity. */
export function placeToActivity(
  place: Place,
  opts: { durationMinutes?: number; estimatedCost: number; reason?: Activity["reason"] },
): Activity {
  return {
    id: localId("act"),
    placeId: place.id,
    name: place.name,
    category: place.category,
    description: place.description,
    address: place.address,
    coordinates: place.coordinates,
    imageUrl: place.imageUrl,
    startTime: "09:00",
    endTime: "10:30",
    durationMinutes: opts.durationMinutes ?? defaultDuration(place.category),
    estimatedCost: Math.round(opts.estimatedCost),
    rating: place.rating,
    openingStatus: place.openingHours ? "open" : "unknown",
    tags: place.tags,
    reason: opts.reason,
    isLocked: false,
    isOptional: false,
    meta: { source: "demo", isEstimated: true, lastUpdatedISO: place.meta.lastUpdatedISO },
  };
}

export function defaultDuration(category: Place["category"]): number {
  switch (category) {
    case "restaurant":
      return 75;
    case "cafe":
      return 45;
    case "museum":
      return 120;
    case "shopping":
      return 120;
    case "nature":
    case "beach":
      return 105;
    case "entertainment":
    case "activity":
      return 150;
    default:
      return 90;
  }
}

export interface LocatedActivity {
  dayIndex: number;
  activityIndex: number;
  day: TripDay;
  activity: Activity;
}

export function findActivity(trip: Trip, activityId: string): LocatedActivity | null {
  for (let d = 0; d < trip.days.length; d += 1) {
    const day = trip.days[d]!;
    const a = day.activities.findIndex((x) => x.id === activityId);
    if (a >= 0) return { dayIndex: d, activityIndex: a, day, activity: day.activities[a]! };
  }
  return null;
}

export function findDay(trip: Trip, dayId: string): TripDay | undefined {
  return trip.days.find((d) => d.id === dayId);
}

/** Total party cost of a day (excluding optional items). */
export function dayCost(day: TripDay): number {
  return Math.round(
    day.activities.filter((a) => !a.isOptional).reduce((s, a) => s + a.estimatedCost, 0),
  );
}

/** Total scheduled minutes of a day (activities + travel). */
export function dayBusyMinutes(day: TripDay): number {
  return day.activities.reduce(
    (s, a) => s + a.durationMinutes + (a.travelFromPrevious?.minutes ?? 0),
    0,
  );
}
