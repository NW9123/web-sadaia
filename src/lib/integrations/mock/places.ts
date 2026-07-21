import type { Place } from "@/types";
import { getPlaceById, getPlacesFor } from "@/data/places";
import type { PlacesProvider, SearchPlacesInput } from "../types";

export const mockPlacesProvider: PlacesProvider = {
  id: "mock",
  async searchPlaces(input: SearchPlacesInput): Promise<Place[]> {
    let places = getPlacesFor(input.destinationId);

    if (input.categories && input.categories.length > 0) {
      const set = new Set(input.categories);
      places = places.filter((p) => set.has(p.category));
    }

    if (input.interests && input.interests.length > 0) {
      const wanted = new Set(input.interests);
      // Rank by number of matching interest tags (keep all, just reorder).
      places = [...places].sort((a, b) => {
        const score = (p: Place) => (p.tags ?? []).filter((t) => wanted.has(t)).length;
        return score(b) - score(a);
      });
    }

    return typeof input.limit === "number" ? places.slice(0, input.limit) : places;
  },
  async getPlaceDetails(placeId: string): Promise<Place | null> {
    return getPlaceById(placeId) ?? null;
  },
};
