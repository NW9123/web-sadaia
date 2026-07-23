import { z } from "zod";
import type { Destination, Place } from "@/types";
import {
  CURRENCIES,
  INTERESTS,
  PLACE_CATEGORIES,
  TRAVEL_STYLES,
  WEATHER_PREFERENCES,
  type Interest,
  type TravelStyle,
} from "@/types/enums";
import { destinations } from "@/data/destinations";
import {
  dynamicImageFor,
  getDynamicDestination,
  normalizeDestinationQuery,
  registerDynamicDestination,
  setDynamicPlaces,
  type DynamicCityRef,
} from "@/data/dynamic";
import { generateSyntheticPlaces } from "@/data/places/synthetic";
import { hashString } from "@/lib/utils";
import { callOpenRouterJSON } from "./openrouter";
import { logAi } from "./log";

/** The query doesn't correspond to any real place the model recognizes. */
export class DestinationNotFoundError extends Error {
  constructor(query: string) {
    super(`destination_not_found: ${query.slice(0, 80)}`);
    this.name = "DestinationNotFoundError";
  }
}

/** The research call itself failed (network/model/shape) — retryable. */
export class DestinationResearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DestinationResearchError";
  }
}

/* ------------------------------ validation ------------------------------ */

const localizedSchema = z.object({ ar: z.string().min(1), en: z.string().min(1) });
const coordinatesSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

const researchPlaceSchema = z.object({
  name: localizedSchema,
  category: z.enum(PLACE_CATEGORIES).catch("attraction"),
  description: localizedSchema,
  address: localizedSchema.optional(),
  coordinates: coordinatesSchema,
  rating: z.coerce.number().min(1).max(5).optional(),
  priceLevel: z.coerce.number().int().min(1).max(4).optional(),
  tags: z.array(z.string()).optional(),
  openingHours: localizedSchema.optional(),
});

const researchSchema = z.object({
  isRealCity: z.boolean(),
  city: localizedSchema.optional(),
  country: localizedSchema.optional(),
  countryCode: z.string().min(2).max(3).optional(),
  coordinates: coordinatesSchema.optional(),
  airport: z.string().optional(),
  currency: z.enum(CURRENCIES).catch("USD").optional(),
  avgDailyCost: z.coerce.number().positive().optional(),
  flightTimeHours: z.coerce.number().positive().max(30).optional(),
  weather: z.enum(WEATHER_PREFERENCES).catch("mild").optional(),
  bestSeasons: localizedSchema.optional(),
  tags: z.array(z.string()).optional(),
  description: localizedSchema.optional(),
  places: z.array(z.unknown()).optional(),
});

const INTEREST_SET = new Set<string>(INTERESTS);
const DEST_TAG_SET = new Set<string>([...TRAVEL_STYLES, ...INTERESTS]);

function interestTags(tags: string[] | undefined): Interest[] {
  return (tags ?? []).filter((t): t is Interest => INTEREST_SET.has(t)).slice(0, 6);
}

function destinationTags(tags: string[] | undefined): (TravelStyle | Interest)[] {
  const cleaned = (tags ?? []).filter((t): t is TravelStyle | Interest => DEST_TAG_SET.has(t));
  return cleaned.length > 0 ? cleaned.slice(0, 6) : ["culture"];
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/* -------------------------------- prompt -------------------------------- */

const RESEARCH_SYSTEM = [
  "You are TripMind's travel destination researcher. Reply with STRICT JSON only — no markdown, no commentary.",
  "The user query is a city/town/region/country name typed by a traveler, in Arabic or English, possibly misspelled.",
  "Identify the intended REAL place. If the query names a country, choose its most-visited tourist city. If it does not correspond to any real place, return exactly {\"isRealCity\": false}.",
  "Every text field is bilingual: {\"ar\": natural Arabic, \"en\": English}. Use the standard Arabic name of the city/venues.",
  "Places MUST be real, famous venues that exist today, with accurate coordinates (within ~1 km). NEVER invent a venue; when unsure, pick a more famous one instead.",
  "Include the city's signature experiences/events as places with category \"activity\" or \"entertainment\" when relevant (e.g. a famous cruise, market night, seasonal festival grounds).",
  "Descriptions are 1-2 sentences that sell what's special; mention free entry, typical offers, or the best visiting time when true and relevant.",
].join("\n");

function buildUserPrompt(query: string): string {
  return JSON.stringify({
    task: "research_destination",
    query,
    allowed: {
      currencies: CURRENCIES,
      weathers: WEATHER_PREFERENCES,
      placeCategories: PLACE_CATEGORIES.filter((c) => c !== "hotel" && c !== "transport"),
      tags: [...TRAVEL_STYLES, ...INTERESTS],
    },
    requirements: [
      "16-22 places total.",
      "9-12 sights across attraction/landmark/museum/nature/beach/entertainment/activity — the city's true must-sees, best experiences and famous events.",
      "4-5 top-rated restaurants (local cuisine first, mixed price levels).",
      "2-3 cafes and 1-2 shopping spots (famous market or mall).",
      "rating: typical public rating 3.8-4.9. priceLevel: 1 (cheap) to 4 (expensive).",
      "currency: the destination's local currency if it appears in allowed.currencies, otherwise USD.",
      "avgDailyCost: realistic mid-range cost per person per day in that currency (food + activities + local transport).",
      "flightTimeHours: approximate direct flight time from Riyadh.",
      "airport: the main international airport IATA code (3 letters).",
      "tags: 3-6 values chosen ONLY from allowed.tags.",
      "countryCode: ISO 3166-1 alpha-2.",
    ],
    outputShape: {
      isRealCity: true,
      city: { ar: "…", en: "…" },
      country: { ar: "…", en: "…" },
      countryCode: "XX",
      coordinates: { lat: 0, lng: 0 },
      airport: "XXX",
      currency: "USD",
      avgDailyCost: 0,
      flightTimeHours: 0,
      weather: "mild",
      bestSeasons: { ar: "…", en: "…" },
      tags: ["…"],
      description: { ar: "…", en: "…" },
      places: [
        {
          name: { ar: "…", en: "…" },
          category: "attraction",
          description: { ar: "…", en: "…" },
          address: { ar: "…", en: "…" },
          coordinates: { lat: 0, lng: 0 },
          rating: 4.5,
          priceLevel: 2,
          tags: ["…"],
          openingHours: { ar: "09:00 – 18:00", en: "09:00 – 18:00" },
        },
      ],
    },
  });
}

/* ------------------------------- research ------------------------------- */

/** In-flight/resolved research jobs, keyed by normalized query (per process). */
const jobs = new Map<string, Promise<Destination | null>>();

/**
 * Ask the model to research a free-text destination (any city/country the
 * traveler typed), validate the result, and register it as a dynamic
 * destination so the whole pipeline can plan trips for it.
 *
 * Returns the Destination, or `null` when the model says the query is not a
 * real place. Throws {@link DestinationResearchError} on call/shape failures.
 */
export async function researchDestination(query: string): Promise<Destination | null> {
  const key = normalizeDestinationQuery(query);
  if (!key) return null;
  const existing = jobs.get(key);
  if (existing) return existing;
  const job = doResearch(query, key).catch((error: unknown) => {
    jobs.delete(key); // allow retry after a transient failure
    throw error;
  });
  jobs.set(key, job);
  return job;
}

async function doResearch(query: string, key: string): Promise<Destination | null> {
  logAi("research:start", { query: query.slice(0, 60) });

  let raw: unknown;
  try {
    raw = await callOpenRouterJSON(
      [
        { role: "system", content: RESEARCH_SYSTEM },
        { role: "user", content: buildUserPrompt(query) },
      ],
      { maxTokens: 16000, timeoutMs: 90_000, temperature: 0.3 },
    );
  } catch (error) {
    throw new DestinationResearchError(error instanceof Error ? error.message : "research call failed");
  }

  const parsed = researchSchema.safeParse(raw);
  if (!parsed.success) throw new DestinationResearchError("invalid research payload");
  const data = parsed.data;

  if (!data.isRealCity) {
    logAi("research:not_a_place", { query: query.slice(0, 60) });
    return null;
  }
  if (!data.city || !data.country || !data.coordinates) {
    throw new DestinationResearchError("incomplete research payload");
  }

  // The model may map the query onto a city we already curate — prefer it.
  const cityEn = data.city.en.trim().toLowerCase();
  const catalogHit = destinations.find((d) => d.city.en.toLowerCase() === cityEn);
  if (catalogHit) return catalogHit;

  const slug = slugify(data.city.en) || `city-${Math.abs(hashString(key)).toString(36)}`;
  const id = `ai-${slug}`;
  const already = getDynamicDestination(id);
  if (already) return already; // same city reached via a different query

  const center = data.coordinates;
  const places: Place[] = [];
  (data.places ?? []).forEach((rawPlace, i) => {
    const p = researchPlaceSchema.safeParse(rawPlace);
    if (!p.success) return;
    const v = p.data;
    // Snap hallucinated far-away coordinates back near the city center (~0.8° ≈ 80 km).
    const off = Math.hypot(v.coordinates.lat - center.lat, v.coordinates.lng - center.lng) > 0.8;
    const seed = hashString(`${id}${i}`);
    places.push({
      id: `${id}-p${i}`,
      name: v.name,
      category: v.category,
      description: v.description,
      address: v.address ?? data.city!,
      coordinates: off
        ? {
            lat: center.lat + (((Math.abs(seed) % 60) - 30) / 1000),
            lng: center.lng + (((Math.abs(seed >> 4) % 60) - 30) / 1000),
          }
        : v.coordinates,
      rating: v.rating,
      priceLevel: v.priceLevel as Place["priceLevel"],
      tags: interestTags(v.tags),
      openingHours: v.openingHours,
      destinationId: id,
      meta: { source: "ai", isEstimated: true, lastUpdatedISO: todayISO() },
    });
  });

  if (places.length < 6) throw new DestinationResearchError("too few usable places");

  const airportRaw = (data.airport ?? "").trim().toUpperCase();
  const airport = /^[A-Z]{3}$/.test(airportRaw) ? airportRaw : (slug.replace(/-/g, "").slice(0, 3).toUpperCase() || "INT");

  const destination: Destination = {
    id,
    city: data.city,
    country: data.country,
    countryCode: data.countryCode?.slice(0, 2).toUpperCase() ?? "",
    coordinates: center,
    imageUrl: dynamicImageFor(id),
    avgDailyCost: Math.round(data.avgDailyCost ?? 350),
    currency: data.currency ?? "USD",
    flightTimeHours: data.flightTimeHours ?? 6,
    weather: data.weather ?? "mild",
    bestSeasons: data.bestSeasons ?? { ar: "على مدار السنة", en: "Year-round" },
    tags: destinationTags(data.tags),
    description:
      data.description ?? {
        ar: `وجهة سياحية في ${data.country.ar}.`,
        en: `A travel destination in ${data.country.en}.`,
      },
    popularity: 60,
    meta: { source: "ai", isEstimated: true, lastUpdatedISO: todayISO() },
  };

  const cityRef: DynamicCityRef = { key: id, name: data.city, airport, coordinates: center };

  // Register first so the synthetic top-up below anchors to the right coords.
  registerDynamicDestination(destination, cityRef, places, [query]);

  // Guarantee the generator's minimum ingredients (a meal + a cafe per day).
  const need = {
    restaurant: Math.max(0, 2 - places.filter((p) => p.category === "restaurant").length),
    cafe: Math.max(0, 1 - places.filter((p) => p.category === "cafe").length),
  };
  if (need.restaurant > 0 || need.cafe > 0) {
    const synthetic = generateSyntheticPlaces(id);
    const extras = [
      ...synthetic.filter((p) => p.category === "restaurant").slice(0, need.restaurant),
      ...synthetic.filter((p) => p.category === "cafe").slice(0, need.cafe),
    ];
    setDynamicPlaces(id, [...places, ...extras]);
  }

  logAi("research:registered", { id, places: places.length });
  return destination;
}
