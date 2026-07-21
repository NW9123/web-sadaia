import type {
  Activity,
  Budget,
  Coordinates,
  Destination,
  FlightDirection,
  Localized,
  Trip,
  TripPreferences,
} from "./domain";
import type { BudgetCategory, Currency, PlaceCategory, WeatherPreference } from "./enums";

/** Raw form output that seeds trip generation. */
export interface GenerateTripInput {
  title?: string;
  originCity: string;
  /** Preferred: pick a known destination id. */
  destinationId?: string;
  /** Fallback: free-text destination query. */
  destinationQuery?: string;
  /** When true, the planner recommends a destination for the user. */
  recommendDestination: boolean;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  budget: number;
  currency: Currency;
  preferences: TripPreferences;
}

/** Minimal fields required to insert an activity (ids/meta are filled in). */
export interface ActivityInput {
  /** Reference to a verified place when available (preferred). */
  placeId?: string;
  name: Localized;
  category: PlaceCategory;
  description?: Localized;
  address?: Localized;
  coordinates?: Coordinates;
  startTime?: string;
  durationMinutes?: number;
  estimatedCost?: number;
  imageUrl?: string;
}

export interface BudgetUpdate {
  /** Reduce the estimated total by this percentage (0–100). */
  reducePercent?: number;
  /** Or target an absolute total. */
  targetTotal?: number;
  /** Fine-grained per-category deltas. */
  categoryAdjustments?: { category: BudgetCategory; amount: number }[];
}

/**
 * The structured operations an AI turn may produce. Every operation is
 * validated with Zod before being applied to the trip (see lib/ai/modify).
 */
export type TripModification =
  | { type: "ADD_ACTIVITY"; dayId: string; activity: ActivityInput; index?: number }
  | { type: "REMOVE_ACTIVITY"; activityId: string }
  | { type: "MOVE_ACTIVITY"; activityId: string; targetDayId: string; targetIndex: number }
  | { type: "UPDATE_ACTIVITY"; activityId: string; updates: Partial<ActivityUpdate> }
  | { type: "REORDER_DAY"; dayId: string; orderedActivityIds: string[] }
  | { type: "LOCK_ACTIVITY"; activityId: string; locked: boolean }
  | { type: "MARK_OPTIONAL"; activityId: string; optional: boolean }
  | { type: "CHANGE_HOTEL"; hotelId: string }
  | { type: "CHANGE_FLIGHT"; flightId: string; direction: FlightDirection }
  | { type: "UPDATE_BUDGET"; updates: BudgetUpdate }
  | { type: "SET_TIME_WINDOW"; earliestStartMinutes?: number; latestEndMinutes?: number }
  | { type: "REGENERATE_DAY"; dayId: string }
  | { type: "REGENERATE_TRIP" };

/** Updatable activity fields via AI (subset of Activity). */
export interface ActivityUpdate {
  name: Localized;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  estimatedCost: number;
  category: PlaceCategory;
  isOptional: boolean;
  isLocked: boolean;
}

export interface ModifyTripInput {
  trip: Trip;
  instruction: string;
  locale: "ar" | "en";
}

/** Result of an AI modify turn: a human message + validated operations. */
export interface ModifyTripResult {
  /** Assistant's natural-language reply. */
  message: Localized;
  modifications: TripModification[];
  /** True when at least one operation removes/replaces content. */
  isDestructive: boolean;
}

/** Human-readable diff shown before the user confirms AI changes. */
export interface ModificationPreview {
  added: { dayId: string; name: Localized }[];
  removed: { name: Localized; dayId: string }[];
  moved: { name: Localized; fromDayId: string; toDayId: string }[];
  updated: { name: Localized; detail: Localized }[];
  hotelChange?: { fromName?: Localized; toName: Localized };
  costDelta: number;
  timeDeltaMinutes: number;
  currency: Currency;
  isDestructive: boolean;
}

export interface DestinationRecommendationInput {
  originCity?: string;
  budgetPerDay?: number;
  currency?: Currency;
  durationDays?: number;
  weather?: WeatherPreference;
  maxFlightHours?: number;
  styles?: string[];
  interests?: string[];
}

export interface DestinationRecommendation {
  destination: Destination;
  /** 0–100 match score. */
  matchScore: number;
  reasons: Localized[];
}

/** Full generated trip payload produced by an AIProvider. */
export interface GeneratedTrip {
  trip: Trip;
  /** Optional low-level warnings (e.g. over budget, provider offline). */
  warnings?: Localized[];
}

/** Re-exported for consumers importing these alongside AI types. */
export type { Budget, Activity, Destination, FlightDirection };
