import type { Budget, BudgetCategory, BudgetItem, Currency, Trip } from "@/types";
import { convertStatic } from "@/data/currencies";
import { getDestination } from "@/data/destinations";

/** SAR baselines, scaled by spending level, then converted to trip currency. */
const FOOD_PER_PERSON_DAY: Record<Trip["preferences"]["spendingLevel"], number> = {
  low: 55,
  medium: 110,
  high: 210,
};

const TRANSPORT_PER_DAY: Record<Trip["preferences"]["transport"], number> = {
  walking: 10,
  public: 30,
  taxi: 95,
  rental: 140,
  mixed: 65,
};

const INSURANCE_PER_PERSON_DAY = 18;

/** Rough visa cost per adult (SAR), by destination country. Clearly an estimate. */
function visaCostSar(countryCode: string | undefined): number {
  switch (countryCode) {
    case "AE":
    case "OM":
    case "BH":
      return 0; // GCC — typically no visa
    case "TR":
      return 0; // e-visa often not required for many; treat as ~0 estimate
    case "GB":
      return 480;
    case "FR":
    case "ES":
      return 430; // Schengen
    case "EG":
    case "GE":
      return 120;
    default:
      return 200;
  }
}

function nightsBetween(a: string, b: string): number {
  const ms = new Date(b.slice(0, 10)).getTime() - new Date(a.slice(0, 10)).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

const FOOD_CATEGORIES = new Set(["restaurant", "cafe"]);

/** Recompute the full budget breakdown from the current trip state. */
export function computeBudget(trip: Trip): Budget {
  const currency = trip.currency;
  const travelers = trip.adults + trip.children;
  const days = Math.max(trip.days.length, 1);
  const nights = Math.max(nightsBetween(trip.departureDate, trip.returnDate), 1);
  const sar = (n: number) => Math.round(convertStatic(n, "SAR", currency));

  // --- Flights ---
  let flights = 0;
  if (trip.preferences.includeFlights) {
    const out =
      trip.flights.find((f) => f.id === trip.selectedOutboundId) ??
      cheapest(trip.flights.filter((f) => f.direction === "outbound"));
    const ret =
      trip.flights.find((f) => f.id === trip.selectedReturnId) ??
      cheapest(trip.flights.filter((f) => f.direction === "return"));
    flights = (out?.price ?? 0) + (ret?.price ?? 0);
  }

  // --- Hotel ---
  let hotel = 0;
  if (trip.preferences.includeHotels) {
    const selected =
      trip.hotels.find((h) => h.id === trip.selectedHotelId) ?? cheapestHotel(trip.hotels);
    hotel = (selected?.nightlyPrice ?? 0) * nights;
  }

  // --- Activities & food from the itinerary ---
  let activities = 0;
  let foodFromItinerary = 0;
  for (const day of trip.days) {
    for (const act of day.activities) {
      if (act.isOptional) continue;
      if (FOOD_CATEGORIES.has(act.category)) foodFromItinerary += act.estimatedCost;
      else activities += act.estimatedCost;
    }
  }

  // Baseline for meals not explicitly scheduled.
  const foodBaseline = sar(FOOD_PER_PERSON_DAY[trip.preferences.spendingLevel] * travelers * days * 0.5);
  const food = Math.round(foodFromItinerary + foodBaseline);

  // --- Transport (local) ---
  const perDayTransport = TRANSPORT_PER_DAY[trip.preferences.transport];
  const travelerFactor = trip.preferences.transport === "taxi" || trip.preferences.transport === "public"
    ? Math.max(1, travelers * 0.7)
    : 1;
  const transport = sar(perDayTransport * days * travelerFactor);

  // --- Shopping (only if the user signalled interest) ---
  const likesShopping =
    trip.preferences.styles.includes("shopping") || trip.preferences.interests.includes("shopping");
  const shopping = likesShopping
    ? sar(FOOD_PER_PERSON_DAY[trip.preferences.spendingLevel] * travelers * 0.8 * Math.min(days, 4))
    : 0;

  // --- Fixed / regulatory ---
  const country = getDestination(trip.destination.id)?.countryCode;
  const visa = sar(visaCostSar(country) * trip.adults);
  const insurance = sar(INSURANCE_PER_PERSON_DAY * travelers * days);
  const other = sar(40 * days);

  const subtotal =
    flights + hotel + activities + food + transport + shopping + visa + insurance + other;
  const reserve = Math.round(subtotal * 0.08);

  const items: BudgetItem[] = [
    { category: "flights", amount: flights, isEstimated: true },
    { category: "hotel", amount: hotel, isEstimated: true },
    { category: "transport", amount: transport, isEstimated: true },
    { category: "food", amount: food, isEstimated: true },
    { category: "activities", amount: activities, isEstimated: true },
    { category: "shopping", amount: shopping, isEstimated: true },
    { category: "visa", amount: visa, isEstimated: true },
    { category: "insurance", amount: insurance, isEstimated: true },
    { category: "other", amount: other, isEstimated: true },
    { category: "reserve", amount: reserve, isEstimated: true },
  ];

  const total = subtotal + reserve;
  return {
    currency,
    userBudget: trip.budget,
    items,
    minTotal: Math.round(total * 0.9),
    maxTotal: Math.round(total * 1.18),
  };
}

function cheapest<T extends { price: number }>(items: T[]): T | undefined {
  return [...items].sort((a, b) => a.price - b.price)[0];
}
function cheapestHotel<T extends { nightlyPrice: number }>(items: T[]): T | undefined {
  return [...items].sort((a, b) => a.nightlyPrice - b.nightlyPrice)[0];
}

/** Sum of all budget items = estimated total. */
export function budgetTotal(budget: Budget): number {
  return budget.items.reduce((sum, item) => sum + item.amount, 0);
}

export function budgetRemaining(budget: Budget): number {
  return budget.userBudget - budgetTotal(budget);
}

export function isOverBudget(budget: Budget): boolean {
  return budgetTotal(budget) > budget.userBudget;
}

export function averageDailyCost(budget: Budget, days: number): number {
  return Math.round(budgetTotal(budget) / Math.max(days, 1));
}

/** Per-day non-fixed spend, used for the daily-spending chart. */
export function dailyCosts(trip: Trip): { day: number; cost: number }[] {
  return trip.days.map((day) => ({
    day: day.dayNumber,
    cost: Math.round(
      day.activities.filter((a) => !a.isOptional).reduce((s, a) => s + a.estimatedCost, 0),
    ),
  }));
}

export function budgetCategoryLabelKey(category: BudgetCategory): string {
  return `budget.category.${category}`;
}

export type { Currency };
