/**
 * Domain enumerations as `as const` tuples so they can be iterated for UI
 * (chips, selects) and reused directly by Zod (`z.enum`).
 * Labels live in the i18n dictionaries under `enums.*`, keyed by these values.
 */

export const TRAVEL_STYLES = [
  "family",
  "honeymoon",
  "relaxation",
  "adventure",
  "shopping",
  "nature",
  "culture",
  "entertainment",
  "budget",
  "luxury",
  "friends",
] as const;
export type TravelStyle = (typeof TRAVEL_STYLES)[number];

export const INTERESTS = [
  "restaurants",
  "cafes",
  "shopping",
  "museums",
  "history",
  "nature",
  "beaches",
  "themeparks",
  "adventure",
  "photography",
  "events",
  "kidsFriendly",
  "hiddenGems",
  "quiet",
] as const;
export type Interest = (typeof INTERESTS)[number];

export const PACES = ["relaxed", "balanced", "intensive"] as const;
export type Pace = (typeof PACES)[number];

export const HOTEL_LEVELS = [
  "budget",
  "three",
  "four",
  "five",
  "apartment",
  "resort",
  "any",
] as const;
export type HotelLevel = (typeof HOTEL_LEVELS)[number];

export const TRANSPORT_MODES = [
  "public",
  "rental",
  "taxi",
  "walking",
  "mixed",
] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];

export const SPENDING_LEVELS = ["low", "medium", "high"] as const;
export type SpendingLevel = (typeof SPENDING_LEVELS)[number];

export const PLACE_CATEGORIES = [
  "attraction",
  "restaurant",
  "cafe",
  "activity",
  "shopping",
  "museum",
  "nature",
  "beach",
  "entertainment",
  "landmark",
  "transport",
  "hotel",
] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export const TRIP_STATUSES = ["draft", "upcoming", "ongoing", "past"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const CURRENCIES = [
  "SAR",
  "USD",
  "AED",
  "EUR",
  "GBP",
  "TRY",
  "KWD",
  "QAR",
  "BHD",
  "OMR",
] as const;
export type Currency = (typeof CURRENCIES)[number];

export const BUDGET_CATEGORIES = [
  "flights",
  "hotel",
  "transport",
  "food",
  "activities",
  "shopping",
  "visa",
  "insurance",
  "other",
  "reserve",
] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export const WEATHER_PREFERENCES = ["warm", "mild", "cool", "any"] as const;
export type WeatherPreference = (typeof WEATHER_PREFERENCES)[number];

export const FLIGHT_RECOMMENDATIONS = [
  "cheapest",
  "fastest",
  "bestValue",
  "bestArrival",
  "family",
] as const;
export type FlightRecommendation = (typeof FLIGHT_RECOMMENDATIONS)[number];

export const HOTEL_RECOMMENDATIONS = [
  "overall",
  "budget",
  "family",
  "location",
  "luxury",
] as const;
export type HotelRecommendation = (typeof HOTEL_RECOMMENDATIONS)[number];

/** Helper to use an `as const` tuple with `z.enum`. */
export type NonEmptyTuple<T> = [T, ...T[]];
