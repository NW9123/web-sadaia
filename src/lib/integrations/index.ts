import { env } from "@/config/env";
import { mockCurrencyProvider } from "./mock/currency";
import { mockDestinationsProvider } from "./mock/destinations";
import { mockFlightsProvider } from "./mock/flights";
import { mockHotelsProvider } from "./mock/hotels";
import { mockMapsProvider } from "./mock/maps";
import { mockPlacesProvider } from "./mock/places";
import { mockWeatherProvider } from "./mock/weather";
import type {
  CurrencyProvider,
  DestinationsProvider,
  FlightsProvider,
  HotelsProvider,
  MapsProvider,
  PlacesProvider,
  WeatherProvider,
} from "./types";

/**
 * Central integration selector. Every provider defaults to its mock adapter.
 * Real adapters (Google/Amadeus/Mapbox/…) are not implemented yet; when their
 * env flag is set but no adapter exists we log once and keep the mock so the
 * app never hard-fails on a missing integration.
 */
function warnFallback(kind: string, requested: string) {
  if (requested !== "mock") {
    // eslint-disable-next-line no-console
    console.warn(`[integrations] ${kind} provider "${requested}" not implemented — using mock.`);
  }
}

warnFallback("places", env.PLACES_PROVIDER);
warnFallback("flights", env.FLIGHTS_PROVIDER);
warnFallback("hotels", env.HOTELS_PROVIDER);
warnFallback("maps", env.MAPS_PROVIDER);
warnFallback("weather", env.WEATHER_PROVIDER);
warnFallback("currency", env.CURRENCY_PROVIDER);

export const placesProvider: PlacesProvider = mockPlacesProvider;
export const flightsProvider: FlightsProvider = mockFlightsProvider;
export const hotelsProvider: HotelsProvider = mockHotelsProvider;
export const mapsProvider: MapsProvider = mockMapsProvider;
export const weatherProvider: WeatherProvider = mockWeatherProvider;
export const currencyProvider: CurrencyProvider = mockCurrencyProvider;
export const destinationsProvider: DestinationsProvider = mockDestinationsProvider;

/** True when everything is running on demo/mock data (used for UI labels). */
export const isDemoMode =
  env.PLACES_PROVIDER === "mock" &&
  env.FLIGHTS_PROVIDER === "mock" &&
  env.HOTELS_PROVIDER === "mock";
