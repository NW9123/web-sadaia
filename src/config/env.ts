import { z } from "zod";

/**
 * Environment-variable validation.
 * Every external dependency is optional — when unset the app degrades to mock
 * providers, so validation only enforces *shape* (e.g. URLs) rather than
 * requiring credentials. This keeps local/demo runs zero-config while still
 * catching malformed values in production.
 */
const serverSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal("")),
  AI_PROVIDER: z.enum(["mock", "anthropic", "openrouter"]).default("mock"),
  ANTHROPIC_API_KEY: z.string().optional().or(z.literal("")),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-5"),
  OPENROUTER_API_KEY: z.string().optional().or(z.literal("")),
  OPENROUTER_MODEL: z.string().default("openai/gpt-5.6-luna"),
  MAPS_PROVIDER: z.enum(["mock", "mapbox", "google"]).default("mock"),
  PLACES_PROVIDER: z.enum(["mock", "google", "foursquare"]).default("mock"),
  FLIGHTS_PROVIDER: z.enum(["mock", "amadeus"]).default("mock"),
  HOTELS_PROVIDER: z.enum(["mock", "amadeus", "booking"]).default("mock"),
  WEATHER_PROVIDER: z.enum(["mock", "openweather"]).default("mock"),
  CURRENCY_PROVIDER: z.enum(["mock", "exchangerate"]).default("mock"),
});

function readEnv() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    // Do not leak secret values; only report which keys are malformed.
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    // eslint-disable-next-line no-console
    console.warn(
      `[env] Some environment variables are invalid and were ignored:\n${issues}`,
    );
    // Fall back to defaults so the app still boots in demo mode.
    return serverSchema.parse({});
  }
  return parsed.data;
}

export const env = readEnv();

/** True when a Supabase connection is fully configured. */
export const isSupabaseConfigured = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/** True when the real Anthropic AI adapter can be used. */
export const isAiConfigured =
  env.AI_PROVIDER === "anthropic" && Boolean(env.ANTHROPIC_API_KEY);

/** True when the OpenRouter adapter can be used. */
export const isOpenRouterConfigured =
  env.AI_PROVIDER === "openrouter" && Boolean(env.OPENROUTER_API_KEY);
