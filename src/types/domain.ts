import type {
  BudgetCategory,
  Currency,
  FlightRecommendation,
  HotelLevel,
  HotelRecommendation,
  Interest,
  Pace,
  PlaceCategory,
  SpendingLevel,
  TransportMode,
  TravelStyle,
  TripStatus,
  WeatherPreference,
} from "./enums";

/** Bilingual string. Arabic is primary; English is the fallback surface. */
export interface Localized {
  ar: string;
  en: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

/** Provenance + freshness metadata attached to any externally-sourced value. */
export interface DataMeta {
  /** Where this value came from — never claim provider data when it's demo. */
  source: "demo" | "provider" | "ai" | "user";
  /** Whether the numeric values (price/time) are estimates. */
  isEstimated: boolean;
  /** ISO date the value was last refreshed, when known. */
  lastUpdatedISO?: string;
  /** 0–1 confidence, used for AI-generated selections. */
  confidence?: number;
}

export type OpeningStatus = "open" | "closed" | "unknown";

/** A verified point of interest (the only thing the AI may schedule). */
export interface Place {
  id: string;
  name: Localized;
  category: PlaceCategory;
  description: Localized;
  address: Localized;
  coordinates: Coordinates;
  rating?: number;
  reviewCount?: number;
  /** 1 (cheap) – 4 (expensive). */
  priceLevel?: 1 | 2 | 3 | 4;
  imageUrl?: string;
  tags?: Interest[];
  website?: string;
  /** Free-text opening-hours summary (e.g. "09:00–18:00"). */
  openingHours?: Localized;
  destinationId: string;
  meta: DataMeta;
}

export interface TravelLeg {
  minutes: number;
  distanceKm: number;
  method: TransportMode;
}

/** A scheduled itinerary item within a day. */
export interface Activity {
  id: string;
  /** Optional link back to a source Place. */
  placeId?: string;
  name: Localized;
  category: PlaceCategory;
  description: Localized;
  address: Localized;
  coordinates: Coordinates;
  imageUrl?: string;
  /** "HH:mm" 24h local times. */
  startTime: string;
  endTime: string;
  durationMinutes: number;
  /** Cost for the whole party, in the trip currency. */
  estimatedCost: number;
  rating?: number;
  /** Travel from the previous activity/hotel. Absent for the first item. */
  travelFromPrevious?: TravelLeg;
  openingStatus?: OpeningStatus;
  bookingUrl?: string;
  /** Reason the AI/planner selected this place. */
  reason?: Localized;
  tags?: Interest[];
  /** When locked, AI edits must not remove or move it. */
  isLocked: boolean;
  /** Optional activities can be dropped to save time/money. */
  isOptional: boolean;
  meta: DataMeta;
}

export interface WeatherInfo {
  /** Emoji/icon key. */
  condition: "sunny" | "cloudy" | "rain" | "snow" | "storm" | "clear";
  highC: number;
  lowC: number;
  label: Localized;
  isEstimated: boolean;
}

export interface TripDay {
  id: string;
  dayNumber: number;
  dateISO: string;
  title: Localized;
  summary: Localized;
  activities: Activity[];
  weather?: WeatherInfo;
}

export interface Hotel {
  id: string;
  name: Localized;
  stars: 1 | 2 | 3 | 4 | 5;
  rating: number;
  reviewCount: number;
  location: Localized;
  coordinates: Coordinates;
  distanceFromCenterKm: number;
  /** Distance to the nearest major attraction, in km. */
  distanceFromAttractionsKm: number;
  nightlyPrice: number;
  currency: Currency;
  breakfastIncluded: boolean;
  freeCancellation: boolean;
  amenities: string[];
  images: string[];
  bookingUrl?: string;
  recommendation: HotelRecommendation;
  reason: Localized;
  meta: DataMeta;
}

export type FlightDirection = "outbound" | "return";

export interface Flight {
  id: string;
  airline: Localized;
  airlineCode: string;
  originAirport: string;
  destinationAirport: string;
  departISO: string;
  arriveISO: string;
  durationMinutes: number;
  stops: number;
  baggageIncluded: boolean;
  price: number;
  currency: Currency;
  bookingUrl?: string;
  recommendation: FlightRecommendation;
  direction: FlightDirection;
  meta: DataMeta;
}

export interface BudgetItem {
  category: BudgetCategory;
  amount: number;
  isEstimated: boolean;
}

export interface Budget {
  currency: Currency;
  /** The user's declared budget. */
  userBudget: number;
  items: BudgetItem[];
  /** Low/high band around the estimated total. */
  minTotal: number;
  maxTotal: number;
}

export interface TripPreferences {
  styles: TravelStyle[];
  interests: Interest[];
  pace: Pace;
  hotelLevel: HotelLevel;
  transport: TransportMode;
  spendingLevel: SpendingLevel;
  includeFlights: boolean;
  includeHotels: boolean;
  specialRequirements: string;
}

export interface Destination {
  id: string;
  city: Localized;
  country: Localized;
  countryCode: string;
  coordinates: Coordinates;
  imageUrl: string;
  /** Estimated average daily cost per person, in the destination base currency. */
  avgDailyCost: number;
  currency: Currency;
  /** Typical flight time in hours from Gulf hubs. */
  flightTimeHours: number;
  weather: WeatherPreference;
  bestSeasons: Localized;
  tags: (TravelStyle | Interest)[];
  description: Localized;
  /** 0–100 popularity used for default ordering. */
  popularity: number;
  meta: DataMeta;
}

export interface Trip {
  id: string;
  ownerId: string;
  title: string;
  originCity: Localized;
  destination: {
    id: string;
    city: Localized;
    country: Localized;
    coordinates: Coordinates;
  };
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  budget: number;
  currency: Currency;
  preferences: TripPreferences;
  status: TripStatus;
  days: TripDay[];
  hotels: Hotel[];
  selectedHotelId?: string;
  flights: Flight[];
  selectedOutboundId?: string;
  selectedReturnId?: string;
  budgetBreakdown: Budget;
  savedPlaces: Place[];
  notes: string;
  summary: Localized;
  highlights: Localized[];
  tips: Localized[];
  isPublic: boolean;
  shareId: string;
  version: number;
  createdAtISO: string;
  updatedAtISO: string;
}

export type VersionAuthor = "user" | "ai";

export interface TripVersion {
  id: string;
  tripId: string;
  version: number;
  createdAtISO: string;
  author: VersionAuthor;
  /** Compact human-readable change summary. */
  summary: Localized;
  /** Full snapshot to restore from. */
  snapshot: Trip;
}

export type AiMessageRole = "user" | "assistant";

export interface AiMessage {
  id: string;
  role: AiMessageRole;
  content: string;
  createdAtISO: string;
  /** Structured modifications attached to an assistant turn, if any. */
  modificationSummary?: string;
}

/** Helper to read a bilingual field. */
export function loc(value: Localized, locale: "ar" | "en"): string {
  return value[locale] || value.ar || value.en;
}
