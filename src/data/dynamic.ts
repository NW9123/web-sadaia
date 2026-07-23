import type { Coordinates, Destination, Localized, Place, Trip } from "@/types";
import { hashString } from "@/lib/utils";

/**
 * Runtime registry for AI-researched ("dynamic") destinations.
 *
 * The static catalog in `destinations.ts` covers a curated set of cities; when
 * a traveler asks for anything else, the AI researcher (`lib/ai/research`)
 * builds a Destination + verified-by-the-model places and registers them here.
 * `getDestination` / `resolveDestination` / `getCityByKey` / `getPlacesFor`
 * all consult this registry, so the rest of the app (generator, budget,
 * hotels, flights, map) works for dynamic destinations unchanged.
 *
 * Entries live for the process lifetime. Trips persist their own destination
 * snapshot, so rendering never depends on this registry; `hydrateFromTrip`
 * rebuilds a minimal entry from a stored trip (e.g. after a server restart or
 * on the client) so regeneration and AI edits keep working.
 */

/** Structurally identical to `CityRef` in data/cities (kept local to avoid an import cycle). */
export interface DynamicCityRef {
  key: string;
  name: Localized;
  airport: string;
  coordinates: Coordinates;
}

const DYNAMIC_PREFIX = "ai-";

const destinationsById = new Map<string, Destination>();
const citiesByKey = new Map<string, DynamicCityRef>();
const placesByDestination = new Map<string, Place[]>();
/** normalized query / city name → destination id */
const queryIndex = new Map<string, string>();

/** Generic city imagery (images.unsplash.com is whitelisted in next.config). */
const IMAGE_POOL = [
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?auto=format&fit=crop&w=1200&q=70",
];

export function isDynamicDestinationId(id: string): boolean {
  return id.startsWith(DYNAMIC_PREFIX);
}

export function dynamicImageFor(seedText: string): string {
  return IMAGE_POOL[Math.abs(hashString(seedText)) % IMAGE_POOL.length]!;
}

export function normalizeDestinationQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

export function registerDynamicDestination(
  destination: Destination,
  city: DynamicCityRef,
  places: Place[],
  queries: string[] = [],
): void {
  destinationsById.set(destination.id, destination);
  citiesByKey.set(city.key, city);
  placesByDestination.set(destination.id, places);
  for (const q of [destination.city.ar, destination.city.en, ...queries]) {
    const key = normalizeDestinationQuery(q);
    if (key) queryIndex.set(key, destination.id);
  }
}

export function setDynamicPlaces(destinationId: string, places: Place[]): void {
  placesByDestination.set(destinationId, places);
}

export function getDynamicDestination(id: string): Destination | undefined {
  return destinationsById.get(id);
}

export function resolveDynamicDestination(query: string): Destination | undefined {
  const key = normalizeDestinationQuery(query);
  if (!key) return undefined;
  const indexed = queryIndex.get(key);
  if (indexed) return destinationsById.get(indexed);
  for (const d of destinationsById.values()) {
    if (d.city.en.toLowerCase().includes(key) || d.city.ar.includes(query.trim())) return d;
  }
  return undefined;
}

export function getDynamicCityByKey(key: string): DynamicCityRef | undefined {
  return citiesByKey.get(key);
}

export function getDynamicCityByAirport(code: string): DynamicCityRef | undefined {
  for (const c of citiesByKey.values()) {
    if (c.airport === code) return c;
  }
  return undefined;
}

export function getDynamicPlacesFor(destinationId: string): Place[] | undefined {
  return placesByDestination.get(destinationId);
}

export function findDynamicPlaceById(placeId: string): Place | undefined {
  for (const list of placesByDestination.values()) {
    const found = list.find((p) => p.id === placeId);
    if (found) return found;
  }
  return undefined;
}

/**
 * Rebuild a minimal registry entry from a persisted trip so regeneration and
 * AI edits work for dynamic destinations even in a fresh process (server
 * restart) or on the client, where the original research result is absent.
 * No-op for catalog destinations or when the id is already registered.
 */
export function hydrateFromTrip(trip: Trip): void {
  const id = trip.destination.id;
  if (!isDynamicDestinationId(id) || destinationsById.has(id)) return;

  const destination: Destination = {
    id,
    city: trip.destination.city,
    country: trip.destination.country,
    countryCode: "",
    coordinates: trip.destination.coordinates,
    imageUrl: dynamicImageFor(id),
    avgDailyCost: 350,
    currency: trip.currency,
    flightTimeHours: 6,
    weather: "mild",
    bestSeasons: { ar: "على مدار السنة", en: "Year-round" },
    tags: [],
    description: trip.summary,
    popularity: 50,
    meta: { source: "ai", isEstimated: true, lastUpdatedISO: trip.updatedAtISO.slice(0, 10) },
  };

  const byId = new Map<string, Place>();
  for (const day of trip.days) {
    for (const a of day.activities) {
      if (!a.placeId || byId.has(a.placeId)) continue;
      byId.set(a.placeId, {
        id: a.placeId,
        name: a.name,
        category: a.category,
        description: a.description,
        address: a.address,
        coordinates: a.coordinates,
        imageUrl: a.imageUrl,
        destinationId: id,
        meta: { source: "ai", isEstimated: true },
      });
    }
  }
  for (const p of trip.savedPlaces) {
    if (p.destinationId === id && !byId.has(p.id)) byId.set(p.id, p);
  }

  const outbound = trip.flights.find((f) => f.direction === "outbound");
  const city: DynamicCityRef = {
    key: id,
    name: trip.destination.city,
    airport: outbound?.destinationAirport ?? "INT",
    coordinates: trip.destination.coordinates,
  };

  registerDynamicDestination(destination, city, [...byId.values()]);
}
