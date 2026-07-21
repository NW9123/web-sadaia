import type {
  DestinationRecommendation,
  DestinationRecommendationInput,
  GenerateTripInput,
  GeneratedTrip,
  Localized,
  ModifyTripInput,
  ModifyTripResult,
} from "@/types";
import { generateTrip } from "@/lib/trip/generator";
import { budgetTotal, isOverBudget } from "@/lib/trip/budget";
import { parseModifications } from "@/lib/validation/ai";
import { recommendDestinationsSync } from "@/lib/discover";
import { logAi } from "./log";
import { interpretInstruction } from "./interpret";
import type { AIProvider } from "./types";

/**
 * Local, deterministic AI provider. Produces the same structured outputs a real
 * LLM adapter would — everything flows through the same Zod validation.
 */
export const mockAIProvider: AIProvider = {
  id: "mock",

  async generateTrip(input: GenerateTripInput): Promise<GeneratedTrip> {
    logAi("generateTrip", { destinationId: input.destinationId, days: input.departureDate });
    const trip = generateTrip(input);
    const warnings: Localized[] = [];
    if (isOverBudget(trip.budgetBreakdown)) {
      warnings.push({
        ar: "الخطة الحالية تتجاوز ميزانيتك — راجع تبويب الميزانية للاقتراحات.",
        en: "This plan is over your budget — see the Budget tab for suggestions.",
      });
    }
    return { trip, warnings };
  },

  async modifyTrip(input: ModifyTripInput): Promise<ModifyTripResult> {
    logAi("modifyTrip", { instruction: input.instruction.slice(0, 80) });
    const interpretation = interpretInstruction(input.trip, input.instruction);
    // Even for the mock, run output through the same validator to enforce the
    // contract and demonstrate that raw model JSON is never trusted directly.
    const { valid, dropped } = parseModifications(interpretation.modifications);
    if (dropped > 0) logAi("modifyTrip:dropped", { dropped });
    return {
      message: interpretation.message,
      modifications: valid,
      isDestructive: interpretation.isDestructive,
    };
  },

  async recommendDestinations(
    input: DestinationRecommendationInput,
  ): Promise<DestinationRecommendation[]> {
    logAi("recommendDestinations", { budgetPerDay: input.budgetPerDay });
    return recommendDestinationsSync(input);
  },
};

/** Exposed for the over-budget UI to reuse the same estimate. */
export function estimatedTotal(trip: GeneratedTrip["trip"]): number {
  return budgetTotal(trip.budgetBreakdown);
}
