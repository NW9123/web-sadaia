import { env } from "@/config/env";
import { logAi } from "./log";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CallOptions {
  /** Request a JSON object response (json mode). */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

/**
 * Low-level OpenRouter (OpenAI-compatible) chat call. The API key is read
 * server-side only and never logged. Includes a timeout so a hung request can't
 * block a route indefinitely.
 */
export async function callOpenRouter(messages: ChatMessage[], opts: CallOptions = {}): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 45_000);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // Attribution headers (optional, recommended by OpenRouter).
        "HTTP-Referer": env.NEXT_PUBLIC_APP_URL,
        "X-Title": "TripMind",
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL,
        messages,
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 2000,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`OpenRouter ${res.status}: ${detail.slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenRouter: empty completion");
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

/** Extract the first JSON object/array from a model response (strips code fences). */
export function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall back to the first {...} or [...] block.
    const match = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** Call the model and parse its response as JSON, with one retry on parse failure. */
export async function callOpenRouterJSON(messages: ChatMessage[], opts: CallOptions = {}): Promise<unknown> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const raw = await callOpenRouter(messages, { ...opts, json: true });
    const parsed = extractJson(raw);
    if (parsed !== null) return parsed;
    logAi("openrouter:parse_retry", { attempt: attempt + 1 });
  }
  throw new Error("OpenRouter: could not parse JSON response");
}
