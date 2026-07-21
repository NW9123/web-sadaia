import type {
  Activity,
  Coordinates,
  GenerateTripInput,
  Trip,
  TripDay,
} from "@/types";
import type { ValidatedModification } from "@/lib/validation/ai";
import { getPlaceById, getPlacesFor } from "@/data/places";
import { convertStatic } from "@/data/currencies";
import { localId } from "@/lib/utils";
import { computeBudget, budgetTotal } from "@/lib/trip/budget";
import { generateTrip } from "@/lib/trip/generator";
import {
  PACE_START_MINUTES,
  placeToActivity,
  recomputeDayTimes,
  timeToMinutes,
} from "@/lib/trip/itinerary";
import { mockMapsProvider } from "@/lib/integrations/mock/maps";

interface RecomputeWindow {
  earliestStartMinutes?: number;
  latestEndMinutes?: number;
}

/** Reconstruct a GenerateTripInput from an existing trip (for regeneration). */
export function tripToGenerateInput(trip: Trip): GenerateTripInput {
  return {
    title: trip.title,
    originCity: trip.originCity.en,
    destinationId: trip.destination.id,
    recommendDestination: false,
    departureDate: trip.departureDate,
    returnDate: trip.returnDate,
    adults: trip.adults,
    children: trip.children,
    budget: trip.budget,
    currency: trip.currency,
    preferences: trip.preferences,
  };
}

function hotelCoordsOf(trip: Trip): Coordinates {
  const hotel = trip.hotels.find((h) => h.id === trip.selectedHotelId) ?? trip.hotels[0];
  return hotel?.coordinates ?? trip.destination.coordinates;
}

/** Recompute times for every day, honoring locks and an optional time window. */
function recomputeTrip(trip: Trip, window: RecomputeWindow): Trip {
  const hotelCoords = hotelCoordsOf(trip);
  const paceStart = PACE_START_MINUTES[trip.preferences.pace];
  const earliest = window.earliestStartMinutes ?? paceStart;

  const days = trip.days.map((day) => {
    let activities = recomputeDayTimes(
      day.activities,
      hotelCoords,
      trip.preferences.transport,
      earliest,
      window.earliestStartMinutes ?? 0,
    );
    if (window.latestEndMinutes !== undefined) {
      activities = activities.map((a) =>
        !a.isLocked && timeToMinutes(a.endTime) > window.latestEndMinutes! && a.category !== "restaurant"
          ? { ...a, isOptional: true }
          : a,
      );
    }
    return { ...day, activities };
  });

  const next: Trip = { ...trip, days };
  next.budgetBreakdown = computeBudget(next);
  return next;
}

/** Build an Activity from an ADD_ACTIVITY input, resolving a placeId when given. */
function buildActivity(mod: Extract<ValidatedModification, { type: "ADD_ACTIVITY" }>, trip: Trip): Activity {
  const place = mod.activity.placeId ? getPlaceById(mod.activity.placeId) : undefined;
  if (place) {
    return placeToActivity(place, {
      estimatedCost:
        mod.activity.estimatedCost ??
        Math.round(convertStatic(90, "SAR", trip.currency)),
      durationMinutes: mod.activity.durationMinutes,
    });
  }
  const a = mod.activity;
  return {
    id: localId("act"),
    name: a.name,
    category: a.category,
    description: a.description ?? { ar: "نشاط مُضاف", en: "Added activity" },
    address: a.address ?? { ar: "", en: "" },
    coordinates: a.coordinates ?? trip.destination.coordinates,
    imageUrl: a.imageUrl,
    startTime: a.startTime ?? "12:00",
    endTime: "13:30",
    durationMinutes: a.durationMinutes ?? 90,
    estimatedCost: Math.round(a.estimatedCost ?? convertStatic(90, "SAR", trip.currency)),
    isLocked: false,
    isOptional: false,
    meta: { source: "ai", isEstimated: true },
  };
}

/** Pick fresh unused places for a day when regenerating it (keeps locked items). */
function regenerateDay(trip: Trip, day: TripDay): TripDay {
  const usedIds = new Set(trip.days.flatMap((d) => d.activities.map((a) => a.placeId).filter(Boolean)));
  const locked = day.activities.filter((a) => a.isLocked);
  const candidates = getPlacesFor(trip.destination.id).filter(
    (p) =>
      !usedIds.has(p.id) &&
      ["attraction", "landmark", "museum", "nature", "entertainment", "activity"].includes(p.category),
  );
  const anchor = locked[0]?.coordinates ?? trip.destination.coordinates;
  const nearest = [...candidates]
    .sort(
      (a, b) =>
        mockMapsProvider.distanceKm(anchor, a.coordinates) -
        mockMapsProvider.distanceKm(anchor, b.coordinates),
    )
    .slice(0, 3)
    .map((p) =>
      placeToActivity(p, { estimatedCost: Math.round(convertStatic(70, "SAR", trip.currency)) }),
    );
  return { ...day, activities: [...locked, ...nearest] };
}

/** Reduce the estimated total toward a target by downgrading and trimming. */
function applyBudgetReduction(trip: Trip, target: number): Trip {
  let next = { ...trip };
  // 1) Cheaper hotel.
  if (next.preferences.includeHotels && next.hotels.length > 0) {
    const cheapest = [...next.hotels].sort((a, b) => a.nightlyPrice - b.nightlyPrice)[0];
    if (cheapest) next.selectedHotelId = cheapest.id;
  }
  // 2) Cheapest flights.
  const cheapestOut = [...next.flights.filter((f) => f.direction === "outbound")].sort(
    (a, b) => a.price - b.price,
  )[0];
  const cheapestRet = [...next.flights.filter((f) => f.direction === "return")].sort(
    (a, b) => a.price - b.price,
  )[0];
  if (cheapestOut) next.selectedOutboundId = cheapestOut.id;
  if (cheapestRet) next.selectedReturnId = cheapestRet.id;

  next.budgetBreakdown = computeBudget(next);

  // 3) Mark the most expensive non-locked activities optional until under target.
  const flatExpensive = next.days
    .flatMap((d, di) => d.activities.map((a, ai) => ({ a, di, ai })))
    .filter((x) => !x.a.isLocked && !x.a.isOptional && x.a.category !== "restaurant")
    .sort((x, y) => y.a.estimatedCost - x.a.estimatedCost);

  const days = next.days.map((d) => ({ ...d, activities: [...d.activities] }));
  for (const item of flatExpensive) {
    if (budgetTotal(computeBudget({ ...next, days })) <= target) break;
    const act = days[item.di]!.activities[item.ai]!;
    days[item.di]!.activities[item.ai] = { ...act, isOptional: true };
  }
  next = { ...next, days };
  next.budgetBreakdown = computeBudget(next);
  return next;
}

/**
 * Apply validated modifications to a trip immutably, then recompute derived
 * data (times, budget). Locked activities are protected from removal/move/edit.
 * Returns the new trip. Never mutates the input.
 */
export function applyModifications(trip: Trip, mods: ValidatedModification[]): Trip {
  let next: Trip = structuredClone(trip);
  const window: RecomputeWindow = {};

  for (const mod of mods) {
    switch (mod.type) {
      case "ADD_ACTIVITY": {
        const day = next.days.find((d) => d.id === mod.dayId) ?? next.days[0];
        if (!day) break;
        const activity = buildActivity(mod, next);
        const idx = mod.index ?? day.activities.length;
        day.activities.splice(Math.min(idx, day.activities.length), 0, activity);
        break;
      }
      case "REMOVE_ACTIVITY": {
        for (const day of next.days) {
          const i = day.activities.findIndex((a) => a.id === mod.activityId);
          if (i >= 0) {
            if (!day.activities[i]!.isLocked) day.activities.splice(i, 1);
            break;
          }
        }
        break;
      }
      case "MOVE_ACTIVITY": {
        let moved: Activity | undefined;
        for (const day of next.days) {
          const i = day.activities.findIndex((a) => a.id === mod.activityId);
          if (i >= 0) {
            if (day.activities[i]!.isLocked) break;
            [moved] = day.activities.splice(i, 1);
            break;
          }
        }
        if (moved) {
          const target = next.days.find((d) => d.id === mod.targetDayId) ?? next.days[0];
          target?.activities.splice(Math.min(mod.targetIndex, target.activities.length), 0, moved);
        }
        break;
      }
      case "UPDATE_ACTIVITY": {
        for (const day of next.days) {
          const act = day.activities.find((a) => a.id === mod.activityId);
          if (act && !act.isLocked) Object.assign(act, mod.updates);
          if (act) break;
        }
        break;
      }
      case "REORDER_DAY": {
        const day = next.days.find((d) => d.id === mod.dayId);
        if (day) {
          const byId = new Map(day.activities.map((a) => [a.id, a]));
          const reordered = mod.orderedActivityIds
            .map((id) => byId.get(id))
            .filter((a): a is Activity => Boolean(a));
          // Keep any activities not referenced at the end.
          for (const a of day.activities) if (!mod.orderedActivityIds.includes(a.id)) reordered.push(a);
          day.activities = reordered;
        }
        break;
      }
      case "LOCK_ACTIVITY": {
        for (const day of next.days) {
          const act = day.activities.find((a) => a.id === mod.activityId);
          if (act) act.isLocked = mod.locked;
        }
        break;
      }
      case "MARK_OPTIONAL": {
        for (const day of next.days) {
          const act = day.activities.find((a) => a.id === mod.activityId);
          if (act && !act.isLocked) act.isOptional = mod.optional;
        }
        break;
      }
      case "CHANGE_HOTEL": {
        if (next.hotels.some((h) => h.id === mod.hotelId)) next.selectedHotelId = mod.hotelId;
        break;
      }
      case "CHANGE_FLIGHT": {
        const flight = next.flights.find((f) => f.id === mod.flightId);
        if (flight) {
          if (mod.direction === "outbound") next.selectedOutboundId = flight.id;
          else next.selectedReturnId = flight.id;
        }
        break;
      }
      case "UPDATE_BUDGET": {
        const currentTotal = budgetTotal(computeBudget(next));
        const target =
          mod.updates.targetTotal ??
          (mod.updates.reducePercent
            ? Math.round(currentTotal * (1 - mod.updates.reducePercent / 100))
            : currentTotal);
        next = applyBudgetReduction(next, target);
        break;
      }
      case "SET_TIME_WINDOW": {
        window.earliestStartMinutes = mod.earliestStartMinutes;
        window.latestEndMinutes = mod.latestEndMinutes;
        break;
      }
      case "REGENERATE_DAY": {
        next.days = next.days.map((d) => (d.id === mod.dayId ? regenerateDay(next, d) : d));
        break;
      }
      case "REGENERATE_TRIP": {
        const regenerated = generateTrip(tripToGenerateInput(next), {
          id: next.id,
          shareId: next.shareId,
          ownerId: next.ownerId,
          title: next.title,
          createdAtISO: next.createdAtISO,
        });
        regenerated.notes = next.notes;
        regenerated.savedPlaces = next.savedPlaces;
        regenerated.isPublic = next.isPublic;
        regenerated.version = next.version;
        next = regenerated;
        break;
      }
      default:
        break;
    }
  }

  next = recomputeTrip(next, window);
  next.updatedAtISO = next.updatedAtISO; // preserved; store bumps it on save
  return next;
}
