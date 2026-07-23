import type { Flight, Hotel, HotelRecommendation, Trip } from "@/types";
import { convertStatic } from "@/data/currencies";
import { computeBudget } from "@/lib/trip/budget";
import { hashString } from "@/lib/utils";
import { logAi } from "@/lib/ai/log";
import { fetchFlightDeals, fetchHotelDeals, type HotelDeal } from "./deals";

/** Generic hotel imagery (real listing photos aren't reliably scrapeable). */
const HOTEL_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=900&q=70",
];

const REC_CYCLE: HotelRecommendation[] = ["overall", "budget", "location", "family", "luxury"];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "الويب";
  }
}

function monthYear(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function dealToHotel(deal: HotelDeal, trip: Trip, i: number): Hotel {
  const seed = hashString(`${deal.url}${deal.nameEn}`);
  const stars = (deal.stars ??
    (deal.guestRating ? Math.min(5, Math.max(1, Math.round(deal.guestRating / 2))) : 4)) as Hotel["stars"];
  const rating = deal.guestRating
    ? Math.min(4.9, Math.round((deal.guestRating / 2) * 10) / 10)
    : Math.min(4.9, 3.9 + stars * 0.15);
  const usd = deal.priceUsd ?? stars * 55;
  const nightly = Math.max(1, Math.round(convertStatic(usd, "USD", trip.currency)));
  const host = hostOf(deal.url);
  const jitter = (n: number) => (((Math.abs(seed >> n) % 60) - 30) / 1000);

  return {
    id: `deal-htl-${Math.abs(seed).toString(36)}`,
    name: { ar: deal.nameAr, en: deal.nameEn },
    stars,
    rating,
    reviewCount: deal.reviewCount ?? 0,
    location: { ar: deal.area ?? trip.destination.city.ar, en: deal.area ?? trip.destination.city.en },
    coordinates: {
      lat: trip.destination.coordinates.lat + jitter(0),
      lng: trip.destination.coordinates.lng + jitter(4),
    },
    distanceFromCenterKm: Math.round((0.3 + (Math.abs(seed) % 45) / 10) * 10) / 10,
    distanceFromAttractionsKm: Math.round((0.2 + (Math.abs(seed >> 2) % 30) / 10) * 10) / 10,
    nightlyPrice: nightly,
    currency: trip.currency,
    breakfastIncluded: Boolean(deal.breakfast),
    freeCancellation: Boolean(deal.freeCancellation),
    amenities: ["wifi", "ac"],
    images: [HOTEL_IMAGES[i % HOTEL_IMAGES.length]!, HOTEL_IMAGES[(i + 1) % HOTEL_IMAGES.length]!],
    bookingUrl: deal.url,
    recommendation: REC_CYCLE[i % REC_CYCLE.length]!,
    reason: {
      ar: `عرض مباشر من ${host} — السعر تقديري وقد يتغيّر عند الحجز.`,
      en: `Live offer from ${host} — price is an estimate and may change at booking.`,
    },
    meta: { source: "provider", isEstimated: true, lastUpdatedISO: trip.updatedAtISO.slice(0, 10) },
  };
}

async function enrichHotels(trip: Trip): Promise<void> {
  const deals = await fetchHotelDeals({
    cityEn: trip.destination.city.en,
    monthYear: monthYear(trip.departureDate),
  });
  if (deals.length === 0) return;

  const real = deals.map((d, i) => dealToHotel(d, trip, i));
  // Use real offers first; if fewer than 3, keep some mock hotels as extra options.
  const filler = real.length >= 3 ? [] : trip.hotels.slice(0, 3);
  trip.hotels = [...real, ...filler].slice(0, 8);
  trip.selectedHotelId = real[0]!.id;
  logAi("enrich:hotels", { applied: real.length });
}

async function enrichFlights(trip: Trip): Promise<void> {
  if (trip.flights.length === 0) return;
  const deals = await fetchFlightDeals({
    originCityEn: trip.originCity.en,
    destCityEn: trip.destination.city.en,
    monthYear: monthYear(trip.departureDate),
  });
  if (deals.length === 0) return;

  const pricesUsd = deals.map((d) => d.priceFromUsd).filter((p): p is number => typeof p === "number");
  const minConverted =
    pricesUsd.length > 0
      ? Math.max(1, Math.round(convertStatic(Math.min(...pricesUsd), "USD", trip.currency)))
      : undefined;

  for (const flight of trip.flights) {
    // Only attach a provider link when it matches THIS flight's airline; otherwise
    // leave it unset so the card falls back to an Almosafer route search (an
    // aggregator covering every airline) instead of mislabeling the carrier.
    const airline = flight.airline.en.toLowerCase();
    const match = deals.find((d) => {
      const a = d.airlineEn.toLowerCase();
      return a.includes(airline.slice(0, 6)) || airline.includes(a.slice(0, 6));
    });
    if (match) flight.bookingUrl = match.url;
    // Surface the real "from" fare as a price signal on the cheapest option per direction.
    if (minConverted && flight.recommendation === "cheapest" && minConverted < flight.price) {
      flight.price = minConverted;
      flight.meta = { ...flight.meta, source: "provider", isEstimated: true };
    }
  }
  logAi("enrich:flights", { applied: deals.length, minConverted: minConverted ?? null });
}

/**
 * Enrich a freshly generated trip with live "best offers" from the web:
 * real hotels (Booking/Almosafer) and real flight booking links + fare signals
 * (Saudia/Almosafer). Fully guarded and time-bounded — any failure leaves the
 * deterministic demo data untouched. Schedules/amenities remain labeled
 * estimates; only booking links and price signals are real.
 */
export async function enrichTripWithDeals(trip: Trip): Promise<void> {
  try {
    await Promise.allSettled([enrichHotels(trip), enrichFlights(trip)]);
    trip.budgetBreakdown = computeBudget(trip);
  } catch (error) {
    logAi("enrich:error", { message: error instanceof Error ? error.message : "unknown" });
  }
}
