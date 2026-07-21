import type { GenerateTripInput, ModifyTripInput, Trip } from "@/types";

/**
 * Prompt builders, kept separate from any provider implementation so the same
 * prompts can be reused across adapters (mock logging, Anthropic, …).
 * The system prompt encodes the hard rules from the product spec.
 */
export const SYSTEM_RULES = `You are TripMind's itinerary planner.
STRICT RULES:
- Use ONLY verified places supplied in the candidate list. Never invent a place, hotel, flight, rating, price, or booking link.
- Respect the trip's arrival/departure times, budget, and selected pace.
- Group nearby locations together and include realistic travel time between them.
- Never schedule a place outside its opening hours; avoid overloading a single day.
- Include meal and rest time; consider children and dietary/special requirements when present.
- Mark every price/time as an estimate. Explain briefly why each place was selected.
- Output MUST be valid JSON matching the requested schema. No prose outside JSON.`;

export function buildGenerateMessages(input: GenerateTripInput, candidatePlaceIds: string[]) {
  return {
    system: SYSTEM_RULES,
    user: JSON.stringify(
      {
        task: "generate_trip",
        input,
        candidatePlaceIds,
        outputSchema: "GeneratedTrip",
      },
      null,
      2,
    ),
  };
}

export function buildModifyMessages(input: ModifyTripInput, candidatePlaceIds: string[]) {
  return {
    system: SYSTEM_RULES,
    user: JSON.stringify(
      {
        task: "modify_trip",
        instruction: input.instruction,
        locale: input.locale,
        tripSummary: summarizeTripForPrompt(input.trip),
        candidatePlaceIds,
        outputSchema: "TripModification[]",
      },
      null,
      2,
    ),
  };
}

/** Compact trip representation to keep prompt tokens low. */
export function summarizeTripForPrompt(trip: Trip) {
  return {
    id: trip.id,
    destination: trip.destination.city.en,
    currency: trip.currency,
    budget: trip.budget,
    pace: trip.preferences.pace,
    days: trip.days.map((d) => ({
      id: d.id,
      dayNumber: d.dayNumber,
      activities: d.activities.map((a) => ({
        id: a.id,
        name: a.name.en,
        category: a.category,
        start: a.startTime,
        cost: a.estimatedCost,
        locked: a.isLocked,
        optional: a.isOptional,
      })),
    })),
    selectedHotelId: trip.selectedHotelId,
    hotels: trip.hotels.map((h) => ({ id: h.id, name: h.name.en, stars: h.stars })),
  };
}
