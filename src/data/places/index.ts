import type { Place } from "@/types";
import { istanbulPlaces } from "./istanbul";
import { dubaiPlaces } from "./dubai";
import { londonPlaces } from "./london";
import { generateSyntheticPlaces } from "./synthetic";

/** Curated datasets keyed by destination id. */
const CURATED: Record<string, Place[]> = {
  istanbul: istanbulPlaces,
  dubai: dubaiPlaces,
  london: londonPlaces,
};

/** Cache synthetic sets so ids stay stable within a process. */
const syntheticCache = new Map<string, Place[]>();

export function getPlacesFor(destinationId: string): Place[] {
  const curated = CURATED[destinationId];
  if (curated && curated.length > 0) return curated;
  if (!syntheticCache.has(destinationId)) {
    syntheticCache.set(destinationId, generateSyntheticPlaces(destinationId));
  }
  return syntheticCache.get(destinationId)!;
}

export function getPlaceById(placeId: string): Place | undefined {
  for (const list of Object.values(CURATED)) {
    const found = list.find((p) => p.id === placeId);
    if (found) return found;
  }
  for (const list of syntheticCache.values()) {
    const found = list.find((p) => p.id === placeId);
    if (found) return found;
  }
  return undefined;
}

export const allCuratedPlaces: Place[] = Object.values(CURATED).flat();
