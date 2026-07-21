import { z } from "zod";
import type {
  DestinationRecommendation,
  DestinationRecommendationInput,
  GenerateTripInput,
  GeneratedTrip,
  Localized,
  ModifyTripInput,
  ModifyTripResult,
} from "@/types";
import { env } from "@/config/env";
import { getDestination, resolveDestination } from "@/data/destinations";
import { getPlacesFor } from "@/data/places";
import { generateTrip, type GenerationPlan } from "@/lib/trip/generator";
import { isOverBudget } from "@/lib/trip/budget";
import { localizedSchema } from "@/lib/validation/common";
import { parseModifications } from "@/lib/validation/ai";
import { recommendDestinationsSync } from "@/lib/discover";
import { mockAIProvider } from "./mock-provider";
import { interpretInstruction } from "./interpret";
import { summarizeTripForPrompt, SYSTEM_RULES } from "./prompt";
import { callOpenRouterJSON } from "./openrouter";
import { logAi } from "./log";
import type { AIProvider } from "./types";

function dayCountOf(input: GenerateTripInput): number {
  const ms = new Date(input.returnDate).getTime() - new Date(input.departureDate).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

/* ----------------------------- generate ----------------------------- */

const planSchema = z.object({
  days: z.array(
    z.object({
      placeIds: z.array(z.string()),
      title: localizedSchema.optional(),
      summary: localizedSchema.optional(),
    }),
  ),
  summary: localizedSchema.optional(),
  highlights: z.array(localizedSchema).optional(),
  tips: z.array(localizedSchema).optional(),
});

async function planTrip(input: GenerateTripInput): Promise<GenerationPlan | null> {
  const destId =
    input.destinationId ?? (input.destinationQuery ? resolveDestination(input.destinationQuery)?.id : undefined);
  if (!destId || !getDestination(destId)) return null; // let the deterministic path resolve it

  const places = getPlacesFor(destId);
  const candidates = places.map((p) => ({
    id: p.id,
    name: p.name.en,
    nameAr: p.name.ar,
    category: p.category,
    tags: p.tags ?? [],
  }));
  const days = dayCountOf(input);

  const user = JSON.stringify({
    task: "plan_trip",
    destination: destId,
    days,
    travelers: { adults: input.adults, children: input.children },
    budget: input.budget,
    currency: input.currency,
    preferences: input.preferences,
    candidatePlaces: candidates,
    instructions: [
      `Produce exactly ${days} day objects.`,
      "Each day: pick 3-5 placeIds ONLY from candidatePlaces, grouped by proximity, include ONE restaurant.",
      "Do not reuse a placeId across days. Respect interests, children, and pace.",
      "Return bilingual (ar/en) title & summary per day, plus overall summary, highlights, tips.",
    ],
    outputSchema:
      '{ "days": [{ "placeIds": string[], "title": {ar,en}, "summary": {ar,en} }], "summary": {ar,en}, "highlights": [{ar,en}], "tips": [{ar,en}] }',
  });

  const raw = await callOpenRouterJSON(
    [
      { role: "system", content: SYSTEM_RULES },
      { role: "user", content: user },
    ],
    { maxTokens: 3000 },
  );
  const parsed = planSchema.safeParse(raw);
  if (!parsed.success) {
    logAi("openrouter:plan_invalid", { issues: parsed.error.issues.length });
    return null;
  }
  return parsed.data;
}

/* ------------------------------ modify ------------------------------ */

const modifyResponseSchema = z.object({
  message: localizedSchema.optional(),
  modifications: z.array(z.unknown()).optional(),
  isDestructive: z.boolean().optional(),
});

const OPS_SPEC = `Allowed modification objects (a JSON array; use REAL ids from the trip):
{"type":"ADD_ACTIVITY","dayId":string,"activity":{"placeId":string,"name":{ar,en},"category":string}}
{"type":"REMOVE_ACTIVITY","activityId":string}
{"type":"MOVE_ACTIVITY","activityId":string,"targetDayId":string,"targetIndex":number}
{"type":"UPDATE_ACTIVITY","activityId":string,"updates":{"startTime":"HH:mm","durationMinutes":number,"estimatedCost":number}}
{"type":"MARK_OPTIONAL","activityId":string,"optional":boolean}
{"type":"LOCK_ACTIVITY","activityId":string,"locked":boolean}
{"type":"CHANGE_HOTEL","hotelId":string}
{"type":"CHANGE_FLIGHT","flightId":string,"direction":"outbound"|"return"}
{"type":"UPDATE_BUDGET","updates":{"reducePercent":number}}
{"type":"SET_TIME_WINDOW","earliestStartMinutes":number,"latestEndMinutes":number}
{"type":"REGENERATE_DAY","dayId":string}
{"type":"REGENERATE_TRIP"}`;

async function modifyViaLLM(input: ModifyTripInput): Promise<ModifyTripResult | null> {
  const candidatePlaces = getPlacesFor(input.trip.destination.id)
    .map((p) => ({ id: p.id, name: p.name.en, category: p.category }))
    .slice(0, 40);

  const user = JSON.stringify({
    task: "modify_trip",
    instruction: input.instruction,
    trip: summarizeTripForPrompt(input.trip),
    candidatePlaces,
    ops: OPS_SPEC,
    output:
      'Return JSON: { "message": {"ar":string,"en":string}, "modifications": <array of op objects above>, "isDestructive": boolean }. Empty modifications if nothing should change.',
  });

  const raw = await callOpenRouterJSON([
    { role: "system", content: SYSTEM_RULES },
    { role: "user", content: user },
  ]);

  const parsed = modifyResponseSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { valid } = parseModifications(parsed.data.modifications ?? []);
  const message: Localized = parsed.data.message ?? {
    ar: "طبّقت طلبك.",
    en: "Applied your request.",
  };
  const isDestructive =
    parsed.data.isDestructive ??
    valid.some((m) => m.type === "REMOVE_ACTIVITY" || m.type === "REGENERATE_DAY" || m.type === "REGENERATE_TRIP");
  return { message, modifications: valid, isDestructive };
}

/* ----------------------------- provider ----------------------------- */

/**
 * OpenRouter adapter (OpenAI-compatible). Uses the configured model
 * (default openai/gpt-5.6-luna) for real generation & natural-language editing,
 * and ALWAYS falls back to the deterministic engine on any error/timeout so the
 * app never hard-fails. All model output is validated with Zod; the model may
 * only reference verified place ids.
 */
export const openRouterAIProvider: AIProvider = {
  id: "openrouter",

  async generateTrip(input: GenerateTripInput): Promise<GeneratedTrip> {
    logAi("openrouter:generateTrip", { model: env.OPENROUTER_MODEL, destination: input.destinationId });
    try {
      const plan = await planTrip(input);
      const trip = generateTrip(input, {}, plan ?? undefined);
      const warnings: Localized[] = [];
      if (isOverBudget(trip.budgetBreakdown)) {
        warnings.push({
          ar: "الخطة الحالية تتجاوز ميزانيتك — راجع تبويب الميزانية للاقتراحات.",
          en: "This plan is over your budget — see the Budget tab for suggestions.",
        });
      }
      return { trip, warnings };
    } catch (error) {
      logAi("openrouter:generate_fallback", { message: error instanceof Error ? error.message : "unknown" });
      return mockAIProvider.generateTrip(input);
    }
  },

  async modifyTrip(input: ModifyTripInput): Promise<ModifyTripResult> {
    logAi("openrouter:modifyTrip", { model: env.OPENROUTER_MODEL });
    try {
      const result = await modifyViaLLM(input);
      if (result && result.modifications.length > 0) return result;
      // Empty/failed LLM result → deterministic interpreter so the user still
      // gets a usable change when their intent is clear.
      const fallback = interpretInstruction(input.trip, input.instruction);
      if (fallback.modifications.length > 0) {
        const { valid } = parseModifications(fallback.modifications);
        return { message: fallback.message, modifications: valid, isDestructive: fallback.isDestructive };
      }
      return result ?? { message: fallback.message, modifications: [], isDestructive: false };
    } catch (error) {
      logAi("openrouter:modify_fallback", { message: error instanceof Error ? error.message : "unknown" });
      return mockAIProvider.modifyTrip(input);
    }
  },

  async recommendDestinations(
    input: DestinationRecommendationInput,
  ): Promise<DestinationRecommendation[]> {
    // Deterministic scorer is fast and reliable; kept out of the LLM path.
    return recommendDestinationsSync(input);
  },
};
