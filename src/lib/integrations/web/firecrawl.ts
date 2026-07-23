import { env } from "@/config/env";
import { logAi } from "@/lib/ai/log";

const SEARCH_ENDPOINT = "https://api.firecrawl.dev/v1/search";

export interface FirecrawlResult {
  title: string;
  url: string;
  content: string;
}

/**
 * Firecrawl web search — used as a secondary source when Tavily returns nothing
 * (e.g. thin results for a niche destination). Server-side only. Returns an
 * empty array on any failure so callers degrade gracefully.
 */
export async function firecrawlSearch(
  query: string,
  limit = 5,
  timeoutMs = 15_000,
): Promise<FirecrawlResult[]> {
  if (!env.FIRECRAWL_API_KEY) return [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(SEARCH_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, limit }),
    });
    if (!res.ok) {
      logAi("firecrawl:error", { status: res.status });
      return [];
    }
    const data = (await res.json()) as {
      data?: {
        title?: string;
        url?: string;
        description?: string;
        markdown?: string;
        metadata?: { title?: string; sourceURL?: string };
      }[];
    };
    return (data.data ?? [])
      .map((r) => ({
        title: r.title ?? r.metadata?.title ?? "",
        url: r.url ?? r.metadata?.sourceURL ?? "",
        content: r.description ?? r.markdown?.slice(0, 500) ?? "",
      }))
      .filter((r) => r.url);
  } catch (error) {
    logAi("firecrawl:exception", { message: error instanceof Error ? error.message : "unknown" });
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
