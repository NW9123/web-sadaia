import { z } from "zod";
import { callOpenRouterJSON } from "@/lib/ai/openrouter";
import { logAi } from "@/lib/ai/log";
import { tavilySearch, type TavilyResult } from "./tavily";
import { firecrawlSearch } from "./firecrawl";

/**
 * Live "best offers" engine. Searches the requested providers (domain-locked)
 * via Tavily — with Firecrawl as a fallback — then uses the configured LLM to
 * extract structured, real offers from the result snippets. Every field is
 * Zod-validated and every offer must carry a real booking URL from the results;
 * the model may not invent hotels/airlines or URLs.
 *
 * Prices are best-effort estimates (normalized to USD by the model) and are
 * always surfaced as estimates in the UI — never as guaranteed fares.
 */

export interface HotelDeal {
  nameEn: string;
  nameAr: string;
  area?: string;
  guestRating?: number; // 0–10 (Booking-style)
  reviewCount?: number;
  priceUsd?: number;
  stars?: number;
  breakfast?: boolean;
  freeCancellation?: boolean;
  url: string;
}

export interface FlightDeal {
  airlineEn: string;
  airlineAr: string;
  priceFromUsd?: number;
  url: string;
  note?: string;
}

// Models vary: they may return a top-level array or an object wrapper, and use
// `name`/`nameEn`/`airline` interchangeably. Parse tolerantly, per item, so one
// malformed entry never discards the whole batch.
const hotelItemSchema = z.object({
  nameEn: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  nameAr: z.string().min(1).optional(),
  area: z.string().optional(),
  guestRating: z.coerce.number().min(0).max(10).optional(),
  reviewCount: z.coerce.number().int().min(0).max(1_000_000).optional(),
  priceUsd: z.coerce.number().min(5).max(20_000).optional(),
  stars: z.coerce.number().int().min(1).max(5).optional(),
  breakfast: z.boolean().optional(),
  freeCancellation: z.boolean().optional(),
  url: z.string().url(),
});

const flightItemSchema = z.object({
  airlineEn: z.string().min(1).optional(),
  airline: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  airlineAr: z.string().min(1).optional(),
  priceFromUsd: z.coerce.number().min(20).max(50_000).optional(),
  priceUsd: z.coerce.number().min(20).max(50_000).optional(),
  price: z.coerce.number().min(20).max(50_000).optional(),
  url: z.string().url(),
  note: z.string().max(200).optional(),
});

/** Unwrap the model's payload to the offers array (top-level array, `{key:[]}`,
 *  or the first array-valued property). */
function coerceArray(raw: unknown, key: string): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj[key])) return obj[key] as unknown[];
    for (const v of Object.values(obj)) if (Array.isArray(v)) return v;
  }
  return [];
}

const HOTEL_SYS =
  'You extract real hotel offers from web search results for a travel app. Reply with STRICT JSON only, shape {"hotels":[...]}. ' +
  "Each hotel: nameEn (English name), nameAr (Arabic name — transliterate if needed), url (a real booking URL copied verbatim from the results). " +
  "Use ONLY hotels/URLs that actually appear in the provided results. NEVER invent a hotel, price, or URL. " +
  "If a price like 'US$120' or '$120' appears for a hotel, set priceUsd to that number; otherwise omit priceUsd. guestRating is 0–10. Return at most 6 hotels.";

const FLIGHT_SYS =
  'You extract real flight offers from web search results for a travel app. Reply with STRICT JSON only, shape {"flights":[...]}. ' +
  "Each flight: airlineEn (English airline name), airlineAr (Arabic airline name), url (a real booking URL copied verbatim from the results). " +
  "Use ONLY airlines/URLs that actually appear in the provided results. NEVER invent an airline, price, or URL. " +
  "If a fare like 'from USD 530' or '$530' appears, set priceFromUsd to that number; otherwise omit it. Return at most 4 offers.";

function snippets(results: TavilyResult[]): { title: string; url: string; snippet: string }[] {
  return results.slice(0, 8).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: (r.content ?? "").replace(/\s+/g, " ").slice(0, 400),
  }));
}

/** Search providers (Tavily, Firecrawl fallback) for a domain-locked query. */
async function gather(query: string, domains: string[]): Promise<{ results: TavilyResult[]; answer?: string }> {
  const tav = await tavilySearch(query, { includeDomains: domains, maxResults: 8, includeAnswer: true });
  if (tav && tav.results.length > 0) return { results: tav.results, answer: tav.answer };
  const fc = await firecrawlSearch(`${query} ${domains.join(" OR ")}`, 6);
  return { results: fc.map((r) => ({ title: r.title, url: r.url, content: r.content })) };
}

export async function fetchHotelDeals(input: {
  cityEn: string;
  monthYear: string;
}): Promise<HotelDeal[]> {
  const { results, answer } = await gather(
    `best hotels in ${input.cityEn} ${input.monthYear} price per night guest rating`,
    ["booking.com", "almosafer.com"],
  );
  if (results.length === 0) return [];
  try {
    const raw = await callOpenRouterJSON(
      [
        { role: "system", content: HOTEL_SYS },
        {
          role: "user",
          content: JSON.stringify({ city: input.cityEn, answer, results: snippets(results) }),
        },
      ],
      { maxTokens: 6000, timeoutMs: 40_000 },
    );
    const deals: HotelDeal[] = [];
    for (const item of coerceArray(raw, "hotels")) {
      const p = hotelItemSchema.safeParse(item);
      if (!p.success) continue;
      const v = p.data;
      const nameEn = v.nameEn ?? v.name;
      if (!nameEn || !/^https?:\/\//.test(v.url)) continue;
      deals.push({
        nameEn,
        nameAr: v.nameAr ?? nameEn,
        area: v.area,
        guestRating: v.guestRating,
        reviewCount: v.reviewCount,
        priceUsd: v.priceUsd,
        stars: v.stars,
        breakfast: v.breakfast,
        freeCancellation: v.freeCancellation,
        url: v.url,
      });
      if (deals.length >= 6) break;
    }
    logAi("deals:hotels", { count: deals.length });
    return deals;
  } catch (error) {
    logAi("deals:hotels_error", { message: error instanceof Error ? error.message : "unknown" });
    return [];
  }
}

export async function fetchFlightDeals(input: {
  originCityEn: string;
  destCityEn: string;
  monthYear: string;
}): Promise<FlightDeal[]> {
  const { results, answer } = await gather(
    `flight tickets from ${input.originCityEn} to ${input.destCityEn} ${input.monthYear} price book`,
    ["saudia.com", "almosafer.com"],
  );
  if (results.length === 0) return [];
  try {
    const raw = await callOpenRouterJSON(
      [
        { role: "system", content: FLIGHT_SYS },
        {
          role: "user",
          content: JSON.stringify({
            route: `${input.originCityEn} -> ${input.destCityEn}`,
            answer,
            results: snippets(results),
          }),
        },
      ],
      { maxTokens: 4000, timeoutMs: 40_000 },
    );
    const deals: FlightDeal[] = [];
    for (const item of coerceArray(raw, "flights")) {
      const p = flightItemSchema.safeParse(item);
      if (!p.success) continue;
      const v = p.data;
      const airlineEn = v.airlineEn ?? v.airline ?? v.name;
      if (!airlineEn || !/^https?:\/\//.test(v.url)) continue;
      deals.push({
        airlineEn,
        airlineAr: v.airlineAr ?? airlineEn,
        priceFromUsd: v.priceFromUsd ?? v.priceUsd ?? v.price,
        url: v.url,
        note: v.note,
      });
      if (deals.length >= 4) break;
    }
    logAi("deals:flights", { count: deals.length });
    return deals;
  } catch (error) {
    logAi("deals:flights_error", { message: error instanceof Error ? error.message : "unknown" });
    return [];
  }
}
