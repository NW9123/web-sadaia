import { destinations, getDestination } from "@/data/destinations";
import type { DestinationsProvider } from "../types";

export const mockDestinationsProvider: DestinationsProvider = {
  id: "mock",
  async list() {
    return destinations;
  },
  async get(id) {
    return getDestination(id) ?? null;
  },
};
