import { env } from "@/config/env";
import { logAi } from "@/lib/ai/log";

const ENDPOINT = "https://api.tavily.com/search";

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface TavilyResponse {
  answer?: string;
  results: TavilyResult[];
}

interface TavilyOptions {
  includeDomains?: string[];
  maxResults?: number;
  includeAnswer?: boolean;
  searchDepth?: "basic" | "advanced";
  timeoutMs?: number;
}

/**
 * Tavily web search (AI search API). Server-side only; the key never reaches
 * the browser. Domain-filtered searches (e.g. booking.com, saudia.com) return
 * real listing pages + price snippets used to build live offers. Returns null
 * on any failure so callers can fall back gracefully.
 */
export async function tavilySearch(
  query: string,
  opts: TavilyOptions = {},
): Promise<TavilyResponse | null> {
  if (!env.TAVILY_API_KEY) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15_000);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: env.TAVILY_API_KEY,
        query,
        search_depth: opts.searchDepth ?? "advanced",
        max_results: opts.maxResults ?? 6,
        include_answer: opts.includeAnswer ?? false,
        ...(opts.includeDomains ? { include_domains: opts.includeDomains } : {}),
      }),
    });
    if (!res.ok) {
      logAi("tavily:error", { status: res.status });
      return null;
    }
    const data = (await res.json()) as {
      answer?: string;
      results?: { title?: string; url?: string; content?: string; score?: number }[];
    };
    return {
      answer: data.answer,
      results: (data.results ?? [])
        .filter((r) => r.url)
        .map((r) => ({
          title: r.title ?? "",
          url: r.url!,
          content: r.content ?? "",
          score: r.score,
        })),
    };
  } catch (error) {
    logAi("tavily:exception", { message: error instanceof Error ? error.message : "unknown" });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
