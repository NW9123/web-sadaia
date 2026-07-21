import type { GenerateTripInput, Trip } from "@/types";
import { generateTrip } from "@/lib/trip/generator";

const CREATED = "2026-07-01T10:00:00.000Z";

const istanbulInput: GenerateTripInput = {
  title: "رحلة العائلة إلى إسطنبول",
  originCity: "riyadh",
  destinationId: "istanbul",
  recommendDestination: false,
  departureDate: "2026-08-05",
  returnDate: "2026-08-11",
  adults: 2,
  children: 2,
  budget: 22000,
  currency: "SAR",
  preferences: {
    styles: ["family", "culture"],
    interests: ["restaurants", "history", "museums", "kidsFriendly", "shopping"],
    pace: "balanced",
    hotelLevel: "four",
    transport: "mixed",
    spendingLevel: "medium",
    includeFlights: true,
    includeHotels: true,
    specialRequirements: "مطاعم حلال، أنشطة مناسبة للأطفال، العودة للفندق قبل الساعة 10 مساءً",
  },
};

const dubaiInput: GenerateTripInput = {
  title: "شهر العسل الفاخر في دبي",
  originCity: "riyadh",
  destinationId: "dubai",
  recommendDestination: false,
  departureDate: "2026-09-12",
  returnDate: "2026-09-16",
  adults: 2,
  children: 0,
  budget: 30000,
  currency: "SAR",
  preferences: {
    styles: ["luxury", "relaxation", "shopping"],
    interests: ["shopping", "restaurants", "beaches", "events"],
    pace: "relaxed",
    hotelLevel: "five",
    transport: "taxi",
    spendingLevel: "high",
    includeFlights: true,
    includeHotels: true,
    specialRequirements: "إطلالة على البحر، مطاعم راقية",
  },
};

const londonInput: GenerateTripInput = {
  title: "عشرة أيام متوازنة في لندن",
  originCity: "jeddah",
  destinationId: "london",
  recommendDestination: false,
  departureDate: "2026-04-18",
  returnDate: "2026-04-27",
  adults: 2,
  children: 1,
  budget: 45000,
  currency: "SAR",
  preferences: {
    styles: ["culture", "family"],
    interests: ["museums", "history", "shopping", "restaurants", "nature"],
    pace: "balanced",
    hotelLevel: "four",
    transport: "public",
    spendingLevel: "medium",
    includeFlights: true,
    includeHotels: true,
    specialRequirements: "استخدام المواصلات العامة، أماكن مناسبة للأطفال",
  },
};

/** Build the seeded demo trips (deterministic — no Date.now / randomness). */
function buildDemoTrips(): Trip[] {
  const istanbul = generateTrip(istanbulInput, {
    id: "demo-istanbul-family",
    shareId: "demo-istanbul",
    ownerId: "demo-user",
    createdAtISO: CREATED,
  });

  const dubai = generateTrip(dubaiInput, {
    id: "demo-dubai-luxury",
    shareId: "demo-dubai",
    ownerId: "demo-user",
    createdAtISO: CREATED,
  });
  // Represent a saved-but-not-finalized plan for the dashboard "drafts" tab.
  dubai.status = "draft";

  const london = generateTrip(londonInput, {
    id: "demo-london-balanced",
    shareId: "demo-london",
    ownerId: "demo-user",
    createdAtISO: CREATED,
  });
  london.isPublic = true;

  return [istanbul, dubai, london];
}

/** Frozen demo trips. Clone before mutating in a store. */
export const demoTrips: Trip[] = buildDemoTrips();

export function getDemoTrip(id: string): Trip | undefined {
  return demoTrips.find((t) => t.id === id);
}

export function getDemoTripByShareId(shareId: string): Trip | undefined {
  return demoTrips.find((t) => t.shareId === shareId);
}
