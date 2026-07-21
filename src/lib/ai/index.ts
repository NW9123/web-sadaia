import { env, isAiConfigured, isOpenRouterConfigured } from "@/config/env";
import { anthropicAIProvider } from "./anthropic-provider";
import { openRouterAIProvider } from "./openrouter-provider";
import { mockAIProvider } from "./mock-provider";
import type { AIProvider } from "./types";

/** Selected AI provider. Falls back to mock unless a real provider is configured. */
function selectProvider(): AIProvider {
  if (env.AI_PROVIDER === "openrouter" && isOpenRouterConfigured) return openRouterAIProvider;
  if (env.AI_PROVIDER === "anthropic" && isAiConfigured) return anthropicAIProvider;
  return mockAIProvider;
}

export const aiProvider: AIProvider = selectProvider();

export { mockAIProvider, anthropicAIProvider, openRouterAIProvider };
export type { AIProvider };
export { applyModifications, tripToGenerateInput } from "./apply";
export { buildPreview } from "./preview";
export { interpretInstruction } from "./interpret";
