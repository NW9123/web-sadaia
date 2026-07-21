import type {
  Activity,
  Coordinates,
  Currency,
  Destination,
  Flight,
  FlightRecommendation,
  GenerateTripInput,
  Hotel,
  HotelRecommendation,
  Localized,
  Place,
  Trip,
  TripDay,
} from "@/types";
import { convertStatic } from "@/data/currencies";
import { getDestination, destinations, resolveDestination } from "@/data/destinations";
import { getCityByKey, resolveCity } from "@/data/cities";
import { getPlacesFor } from "@/data/places";
import { hashString, localId, seededPick } from "@/lib/utils";
import { mockMapsProvider } from "@/lib/integrations/mock/maps";
import { generateFlights } from "@/lib/integrations/mock/flights";
import { generateHotels } from "@/lib/integrations/mock/hotels";
import { forecast } from "@/lib/integrations/mock/weather";
import { computeBudget } from "./budget";
import {
  PACE_MAX_ACTIVITIES,
  PACE_START_MINUTES,
  placeToActivity,
  recomputeDayTimes,
} from "./itinerary";

const SIGHT_CATEGORIES = new Set([
  "attraction",
  "landmark",
  "museum",
  "nature",
  "beach",
  "entertainment",
  "activity",
  "shopping",
]);

const SPENDING_MULT: Record<Trip["preferences"]["spendingLevel"], number> = {
  low: 0.8,
  medium: 1,
  high: 1.45,
};

/** Per-person entrance/spend estimate (SAR) for an activity, by category. */
function activityCostSar(place: Place, spending: keyof typeof SPENDING_MULT, travelers: number): number {
  const level = place.priceLevel ?? 2;
  let perPerson: number;
  switch (place.category) {
    case "restaurant":
      perPerson = [40, 75, 130, 220][level - 1] ?? 90;
      break;
    case "cafe":
      perPerson = [20, 30, 45, 65][level - 1] ?? 30;
      break;
    case "museum":
      perPerson = [15, 35, 60, 90][level - 1] ?? 40;
      break;
    case "landmark":
    case "nature":
    case "beach":
      perPerson = [0, 15, 30, 50][level - 1] ?? 15;
      break;
    case "shopping":
      perPerson = 0; // shopping tracked in its own budget line
      break;
    case "entertainment":
    case "activity":
      perPerson = [40, 90, 150, 240][level - 1] ?? 120;
      break;
    default:
      perPerson = [10, 30, 55, 90][level - 1] ?? 30;
  }
  const partyCost = perPerson * SPENDING_MULT[spending] * travelers;
  return partyCost;
}

/** Greedy nearest-neighbour ordering to keep each day's stops close together. */
function orderByProximity(places: Place[], start: Coordinates): Place[] {
  const remaining = [...places];
  const ordered: Place[] = [];
  let current = start;
  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((p, i) => {
      const d = mockMapsProvider.distanceKm(current, p.coordinates);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    const [next] = remaining.splice(bestIdx, 1);
    if (next) {
      ordered.push(next);
      current = next.coordinates;
    }
  }
  return ordered;
}

function rankSights(places: Place[], interests: string[], childFriendly: boolean): Place[] {
  const wanted = new Set(interests);
  return [...places].sort((a, b) => scoreSight(b) - scoreSight(a));

  function scoreSight(p: Place): number {
    const tagMatches = (p.tags ?? []).filter((t) => wanted.has(t)).length * 3;
    const kid = childFriendly && (p.tags ?? []).includes("kidsFriendly") ? 4 : 0;
    const rating = (p.rating ?? 4) - 4;
    return tagMatches + kid + rating * 2;
  }
}

function daysBetween(depart: string, ret: string): number {
  const ms = new Date(ret.slice(0, 10)).getTime() - new Date(depart.slice(0, 10)).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

function addDays(dateISO: string, n: number): string {
  const d = new Date(`${dateISO.slice(0, 10)}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function pickHotel(hotels: Hotel[], input: GenerateTripInput): Hotel | undefined {
  const wants: HotelRecommendation =
    input.preferences.styles.includes("luxury") || input.preferences.hotelLevel === "five"
      ? "luxury"
      : input.preferences.hotelLevel === "budget" || input.preferences.styles.includes("budget")
        ? "budget"
        : input.children > 0 || input.preferences.styles.includes("family")
          ? "family"
          : "overall";
  return hotels.find((h) => h.recommendation === wants) ?? hotels[0];
}

function pickFlight(flights: Flight[], input: GenerateTripInput, direction: "outbound" | "return") {
  const wants: FlightRecommendation =
    input.preferences.styles.includes("budget") || input.preferences.spendingLevel === "low"
      ? "cheapest"
      : input.children > 0 || input.preferences.styles.includes("family")
        ? "family"
        : "bestValue";
  const pool = flights.filter((f) => f.direction === direction);
  return pool.find((f) => f.recommendation === wants) ?? pool[0];
}

export interface GenerateOptions {
  ownerId?: string;
  /** Stable ids for demo trips. */
  id?: string;
  shareId?: string;
  title?: string;
  createdAtISO?: string;
}

/** Optional LLM-produced plan: which verified place ids go in each day + copy. */
export interface GenerationPlanDay {
  placeIds: string[];
  title?: Localized;
  summary?: Localized;
}
export interface GenerationPlan {
  days: GenerationPlanDay[];
  summary?: Localized;
  highlights?: Localized[];
  tips?: Localized[];
}

/**
 * Trip generator. Builds a complete, budget-aware itinerary from VERIFIED
 * places only (never invents a place/hotel/flight). Deterministic by default;
 * when an optional `plan` is supplied (e.g. from the OpenRouter LLM adapter) it
 * arranges the days from the plan's place ids, backfilling anything missing.
 */
export function generateTrip(
  input: GenerateTripInput,
  opts: GenerateOptions = {},
  plan?: GenerationPlan,
): Trip {
  const seed = `${input.originCity}${input.destinationId ?? input.destinationQuery}${input.departureDate}`;

  // 1) Resolve destination.
  let destination: Destination | undefined =
    (input.destinationId ? getDestination(input.destinationId) : undefined) ??
    (input.destinationQuery ? resolveDestination(input.destinationQuery) : undefined);
  if (!destination && input.recommendDestination) {
    destination = seededPick(destinations, seed);
  }
  destination = destination ?? destinations[0]!;

  const origin = resolveCity(input.originCity);
  const destCity = getCityByKey(destination.id);

  const travelers = input.adults + input.children;
  const dayCount = daysBetween(input.departureDate, input.returnDate);
  const maxPerDay = PACE_MAX_ACTIVITIES[input.preferences.pace];
  const childFriendly = input.children > 0;

  // 2) Gather and split places.
  const places = getPlacesFor(destination.id);
  const sightsAll = rankSights(
    places.filter((p) => SIGHT_CATEGORIES.has(p.category)),
    input.preferences.interests,
    childFriendly,
  );
  const restaurants = places.filter((p) => p.category === "restaurant");
  const cafes = places.filter((p) => p.category === "cafe");

  // 3) Take enough sights, then order by proximity for grouping.
  const sightsPerDay = Math.max(1, maxPerDay - 1);
  const needed = dayCount * sightsPerDay;
  const chosen = sightsAll.slice(0, Math.min(needed, sightsAll.length));
  const ordered = orderByProximity(chosen, destination.coordinates);

  const hotel = pickHotel(
    generateHotels({
      destinationId: destination.id,
      checkIn: input.departureDate,
      checkOut: input.returnDate,
      adults: input.adults,
      children: input.children,
      currency: input.currency,
    }),
    input,
  );
  const hotelCoords = hotel?.coordinates ?? destination.coordinates;

  // 4) Build days.
  const usedMeals = new Set<string>();
  const usedCafes = new Set<string>();
  const days: TripDay[] = [];

  for (let d = 0; d < dayCount; d += 1) {
    const planDay = plan?.days?.[d];
    let daySights: Place[];
    let composed: Place[];

    if (planDay && planDay.placeIds.length > 0) {
      // LLM-planned day: resolve to VERIFIED places only (unknown ids dropped).
      const resolved = planDay.placeIds
        .map((id) => places.find((p) => p.id === id))
        .filter((p): p is Place => Boolean(p));
      composed =
        resolved.length > 0
          ? resolved
          : ordered.slice(d * sightsPerDay, d * sightsPerDay + sightsPerDay);
      daySights = composed.filter((p) => SIGHT_CATEGORIES.has(p.category));
      if (daySights.length === 0) daySights = composed.slice(0, 1);
      // Guarantee a meal even if the plan omitted one.
      if (!composed.some((p) => p.category === "restaurant")) {
        const centroid = daySights[0]?.coordinates ?? destination.coordinates;
        const meal = pickNearestUnused(restaurants, centroid, usedMeals);
        if (meal) composed.splice(Math.min(1, composed.length), 0, meal);
      }
    } else {
      daySights = ordered.slice(d * sightsPerDay, d * sightsPerDay + sightsPerDay);
      // If we ran out of curated sights, reuse from the ranked pool.
      if (daySights.length === 0 && sightsAll.length > 0) {
        daySights.push(sightsAll[(d * 2) % sightsAll.length]!);
      }
      const centroid = daySights[0]?.coordinates ?? destination.coordinates;
      const meal = pickNearestUnused(restaurants, centroid, usedMeals);
      const cafe =
        input.preferences.pace !== "intensive"
          ? pickNearestUnused(cafes, centroid, usedCafes)
          : undefined;
      // Compose ordered places: sight, (lunch), sight..., (cafe).
      composed = [];
      daySights.forEach((s, i) => {
        composed.push(s);
        if (i === 0 && meal) composed.push(meal);
      });
      if (cafe) composed.push(cafe);
    }

    let activities: Activity[] = composed.map((place, idx) => {
      const cost = activityCostSar(place, input.preferences.spendingLevel, travelers);
      const activity = placeToActivity(place, {
        estimatedCost: Math.round(convertStatic(cost, "SAR", input.currency)),
        reason: reasonFor(place, input),
      });
      // Mark the last sight of long days optional to give a lighter option.
      if (input.preferences.pace === "intensive" && idx === composed.length - 1 && composed.length > 4) {
        activity.isOptional = true;
      }
      return activity;
    });

    activities = recomputeDayTimes(
      activities,
      hotelCoords,
      input.preferences.transport,
      PACE_START_MINUTES[input.preferences.pace],
    );

    const dateISO = addDays(input.departureDate, d);
    const mainSight = daySights[0];
    days.push({
      id: opts.id ? `${opts.id}-day-${d + 1}` : localId("day"),
      dayNumber: d + 1,
      dateISO,
      title: planDay?.title ?? dayTitle(d, dayCount, mainSight),
      summary: planDay?.summary ?? daySummary(daySights, destination),
      activities,
      weather: forecast(destination.coordinates, dateISO),
    });
  }

  // 5) Flights.
  const flights = input.preferences.includeFlights
    ? generateFlights({
        originAirport: origin.airport,
        destinationAirport: destCity.airport,
        departDate: input.departureDate,
        returnDate: input.returnDate,
        adults: input.adults,
        children: input.children,
        currency: input.currency,
      })
    : [];
  const outbound = pickFlight(flights, input, "outbound");
  const ret = pickFlight(flights, input, "return");

  const hotels = input.preferences.includeHotels
    ? generateHotels({
        destinationId: destination.id,
        checkIn: input.departureDate,
        checkOut: input.returnDate,
        adults: input.adults,
        children: input.children,
        currency: input.currency,
      })
    : [];

  const nowISO = opts.createdAtISO ?? input.departureDate + "T08:00:00.000Z";
  const departureInFuture = new Date(input.departureDate) >= new Date(nowISO.slice(0, 10));

  const baseTrip: Trip = {
    id: opts.id ?? localId("trip"),
    ownerId: opts.ownerId ?? "demo-user",
    title:
      opts.title ??
      input.title ??
      `${localize(origin.name)} ← → ${localize(destination.city)}`,
    originCity: origin.name,
    destination: {
      id: destination.id,
      city: destination.city,
      country: destination.country,
      coordinates: destination.coordinates,
    },
    departureDate: input.departureDate,
    returnDate: input.returnDate,
    adults: input.adults,
    children: input.children,
    budget: input.budget,
    currency: input.currency,
    preferences: input.preferences,
    status: departureInFuture ? "upcoming" : "past",
    days,
    hotels,
    selectedHotelId: hotel?.id,
    flights,
    selectedOutboundId: outbound?.id,
    selectedReturnId: ret?.id,
    budgetBreakdown: {
      currency: input.currency,
      userBudget: input.budget,
      items: [],
      minTotal: 0,
      maxTotal: 0,
    },
    savedPlaces: [],
    notes: "",
    summary: plan?.summary ?? tripSummary(destination, dayCount, input),
    highlights: plan?.highlights && plan.highlights.length > 0 ? plan.highlights : buildHighlights(days),
    tips: plan?.tips && plan.tips.length > 0 ? plan.tips : buildTips(destination, input),
    isPublic: false,
    shareId: opts.shareId ?? `shr-${Math.abs(hashString(seed)).toString(36)}`,
    version: 1,
    createdAtISO: nowISO,
    updatedAtISO: nowISO,
  };

  baseTrip.budgetBreakdown = computeBudget(baseTrip);
  return baseTrip;
}

function pickNearestUnused(pool: Place[], near: Coordinates, used: Set<string>): Place | undefined {
  const available = pool.filter((p) => !used.has(p.id));
  const list = available.length > 0 ? available : pool;
  if (list.length === 0) return undefined;
  const best = orderByProximity(list, near)[0];
  if (best) used.add(best.id);
  return best;
}

function localize(v: Localized): string {
  return v.ar;
}

function reasonFor(place: Place, input: GenerateTripInput): Localized {
  const matched = (place.tags ?? []).find((t) => input.preferences.interests.includes(t));
  if (matched) {
    return {
      ar: `اخترناه لتوافقه مع اهتمامك بـ «${matched}» وتقييمه المرتفع.`,
      en: `Chosen for matching your interest in "${matched}" and its high rating.`,
    };
  }
  return {
    ar: "من أبرز معالم الوجهة وقريب من محطات اليوم.",
    en: "A destination highlight, close to the day's other stops.",
  };
}

function dayTitle(index: number, total: number, mainSight?: Place): Localized {
  if (index === 0) return { ar: "الوصول والاستكشاف", en: "Arrival & first look" };
  if (index === total - 1) return { ar: "التسوق والمغادرة", en: "Shopping & departure" };
  if (mainSight) {
    return {
      ar: `جولة حول ${mainSight.name.ar}`,
      en: `Around ${mainSight.name.en}`,
    };
  }
  return { ar: `اليوم ${index + 1}`, en: `Day ${index + 1}` };
}

function daySummary(sights: Place[], destination: Destination): Localized {
  const names = sights.slice(0, 2).map((s) => s.name);
  if (names.length === 0) {
    return {
      ar: `يوم حر لاستكشاف ${destination.city.ar}.`,
      en: `A free day to explore ${destination.city.en}.`,
    };
  }
  return {
    ar: `زيارة ${names.map((n) => n.ar).join(" و")} مع وقت للطعام والراحة.`,
    en: `Visit ${names.map((n) => n.en).join(" & ")}, with time to eat and relax.`,
  };
}

function tripSummary(destination: Destination, dayCount: number, input: GenerateTripInput): Localized {
  return {
    ar: `رحلة ${dayCount} أيام إلى ${destination.city.ar} لـ ${input.adults + input.children} مسافرين، مصممة حسب اهتماماتك وميزانيتك.`,
    en: `A ${dayCount}-day trip to ${destination.city.en} for ${input.adults + input.children} travelers, tailored to your interests and budget.`,
  };
}

function buildHighlights(days: TripDay[]): Localized[] {
  const highlights: Localized[] = [];
  for (const day of days) {
    const first = day.activities.find((a) => a.category !== "restaurant" && a.category !== "cafe");
    if (first) highlights.push(first.name);
    if (highlights.length >= 5) break;
  }
  return highlights;
}

function buildTips(destination: Destination, input: GenerateTripInput): Localized[] {
  const tips: Localized[] = [
    {
      ar: "احجز الأنشطة الشهيرة مسبقًا لتجنّب الطوابير.",
      en: "Book popular activities ahead to skip the queues.",
    },
    {
      ar: `أفضل أوقات زيارة ${destination.city.ar}: ${destination.bestSeasons.ar}.`,
      en: `Best time to visit ${destination.city.en}: ${destination.bestSeasons.en}.`,
    },
    {
      ar: "احتفظ بنسخة من جواز السفر والتأمين على هاتفك.",
      en: "Keep a copy of your passport and insurance on your phone.",
    },
  ];
  if (input.children > 0) {
    tips.push({
      ar: "خطّطنا فترات راحة تناسب الأطفال بين الأنشطة.",
      en: "We spaced activities with rest breaks suitable for children.",
    });
  }
  if (input.preferences.specialRequirements.trim()) {
    tips.push({
      ar: "راعينا متطلباتك الخاصة قدر الإمكان في اختيار الأماكن.",
      en: "We considered your special requirements where possible.",
    });
  }
  return tips;
}
