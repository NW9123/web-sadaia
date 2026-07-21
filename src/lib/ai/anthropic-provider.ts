import type {
  DestinationRecommendation,
  DestinationRecommendationInput,
  GenerateTripInput,
  GeneratedTrip,
  ModifyTripInput,
  ModifyTripResult,
} from "@/types";
import { env } from "@/config/env";
import { getPlacesFor } from "@/data/places";
import { modifyResultSchema, parseModifications } from "@/lib/validation/ai";
import { mockAIProvider } from "./mock-provider";
import { buildGenerateMessages, buildModifyMessages } from "./prompt";
import { logAi, withRetry } from "./log";
import type { AIProvider } from "./types";

/**
 * Real-provider adapter placeholder (Anthropic).
 *
 * The wiring (prompt building, retry, Zod validation of the model's JSON) is in
 * place; the actual network call is intentionally NOT implemented here so the
 * project builds and runs without credentials. Until it is implemented every
 * method safely falls back to the deterministic mock provider.
 *
 * To implement: call the Messages API with `env.ANTHROPIC_MODEL`, request a
 * tool/JSON response matching `GeneratedTrip` / `TripModification[]`, then parse
 * it with the schemas below. NEVER apply unvalidated model output.
 */
export const anthropicAIProvider: AIProvider = {
  id: "anthropic",

  async generateTrip(input: GenerateTripInput): Promise<GeneratedTrip> {
    const candidateIds = getPlacesFor(input.destinationId ?? "").map((p) => p.id);
    const messages = buildGenerateMessages(input, candidateIds);
    logAi("anthropic:generateTrip", { model: env.ANTHROPIC_MODEL, hasPrompt: Boolean(messages.system) });
    // TODO: replace with a real Messages API call + schema validation.
    return mockAIProvider.generateTrip(input);
  },

  async modifyTrip(input: ModifyTripInput): Promise<ModifyTripResult> {
    const candidateIds = getPlacesFor(input.trip.destination.id).map((p) => p.id);
    const messages = buildModifyMessages(input, candidateIds);
    logAi("anthropic:modifyTrip", { model: env.ANTHROPIC_MODEL, hasPrompt: Boolean(messages.system) });
    return withRetry(async () => {
      // TODO: real API call. The shape below is what the parser expects:
      //   const raw = await callModel(messages);
      //   const parsed = modifyResultSchema.safeParse(raw);
      //   if (!parsed.success) throw new Error("invalid AI output");
      //   const { valid } = parseModifications(parsed.data.modifications);
      //   return { ...parsed.data, modifications: valid };
      void modifyResultSchema;
      void parseModifications;
      return mockAIProvider.modifyTrip(input);
    });
  },

  async recommendDestinations(
    input: DestinationRecommendationInput,
  ): Promise<DestinationRecommendation[]> {
    logAi("anthropic:recommendDestinations", { model: env.ANTHROPIC_MODEL });
    return mockAIProvider.recommendDestinations(input);
  },
};
