import type {
  DestinationRecommendation,
  DestinationRecommendationInput,
  GenerateTripInput,
  GeneratedTrip,
  ModifyTripInput,
  ModifyTripResult,
} from "@/types";

/**
 * Provider-independent AI contract. Concrete implementations (mock, Anthropic)
 * live alongside this file and are selected in lib/ai/index.ts based on env.
 */
export interface AIProvider {
  readonly id: string;
  generateTrip(input: GenerateTripInput): Promise<GeneratedTrip>;
  modifyTrip(input: ModifyTripInput): Promise<ModifyTripResult>;
  recommendDestinations(
    input: DestinationRecommendationInput,
  ): Promise<DestinationRecommendation[]>;
}
