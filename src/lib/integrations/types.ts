import type {
  Coordinates,
  Currency,
  Destination,
  Flight,
  Hotel,
  Place,
  PlaceCategory,
  TravelLeg,
  TransportMode,
  WeatherInfo,
} from "@/types";

/**
 * Provider-independent integration contracts.
 * UI and services depend on these interfaces only; concrete adapters (mock,
 * Google, Amadeus, Mapbox…) are selected in lib/integrations/index.ts based on
 * environment configuration. This keeps external APIs out of components.
 */

export interface SearchPlacesInput {
  destinationId: string;
  categories?: PlaceCategory[];
  interests?: string[];
  /** Bias results near this point. */
  near?: Coordinates;
  limit?: number;
}

export interface PlacesProvider {
  readonly id: string;
  searchPlaces(input: SearchPlacesInput): Promise<Place[]>;
  getPlaceDetails(placeId: string): Promise<Place | null>;
}

export interface SearchFlightsInput {
  originAirport: string;
  destinationAirport: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  currency: Currency;
}

export interface FlightsProvider {
  readonly id: string;
  searchFlights(input: SearchFlightsInput): Promise<Flight[]>;
}

export interface SearchHotelsInput {
  destinationId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  currency: Currency;
  /** Preferred star band, when known. */
  minStars?: number;
  near?: Coordinates;
}

export interface HotelsProvider {
  readonly id: string;
  searchHotels(input: SearchHotelsInput): Promise<Hotel[]>;
}

export interface MapsProvider {
  readonly id: string;
  /** Travel leg estimate between two points by mode. */
  estimateLeg(from: Coordinates, to: Coordinates, mode: TransportMode): TravelLeg;
  /** Great-circle-ish distance in km. */
  distanceKm(from: Coordinates, to: Coordinates): number;
}

export interface WeatherProvider {
  readonly id: string;
  getForecast(coordinates: Coordinates, dateISO: string): Promise<WeatherInfo>;
}

export interface CurrencyProvider {
  readonly id: string;
  /** Convert an amount; returns the converted amount (estimate). */
  convert(amount: number, from: Currency, to: Currency): Promise<number>;
  rate(from: Currency, to: Currency): number;
}

export interface DestinationsProvider {
  readonly id: string;
  list(): Promise<Destination[]>;
  get(id: string): Promise<Destination | null>;
}
