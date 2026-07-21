import type { GenerateTripInput, GeneratedTrip, ModifyTripInput, ModifyTripResult, Trip } from "@/types";
import { aiProvider } from "@/lib/ai";
import { getTripsRepository } from "@/repositories/trips-repository";

/**
 * Application service tying the AI provider + persistence together.
 * Keeps orchestration out of API routes/UI. Persistence is best-effort: when
 * Supabase isn't configured the caller (client store) owns persistence.
 */
export const tripService = {
  async generate(input: GenerateTripInput): Promise<GeneratedTrip> {
    const result = await aiProvider.generateTrip(input);
    const repo = getTripsRepository();
    if (repo) {
      try {
        await repo.create(result.trip);
      } catch {
        // Non-fatal: the client store still holds the trip.
      }
    }
    return result;
  },

  async modify(input: ModifyTripInput): Promise<ModifyTripResult> {
    return aiProvider.modifyTrip(input);
  },

  async persist(trip: Trip): Promise<void> {
    const repo = getTripsRepository();
    if (repo) await repo.update(trip);
  },
};
