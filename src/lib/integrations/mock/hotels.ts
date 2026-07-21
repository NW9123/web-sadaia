import type { Coordinates, Hotel, HotelRecommendation } from "@/types";
import { getDestination } from "@/data/destinations";
import { convertStatic } from "@/data/currencies";
import { hashString } from "@/lib/utils";
import type { HotelsProvider, SearchHotelsInput } from "../types";

const HOTEL_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=900&q=70",
];

interface HotelTemplate {
  nameAr: string;
  nameEn: string;
  stars: 1 | 2 | 3 | 4 | 5;
  recommendation: HotelRecommendation;
  priceFactor: number;
  amenities: string[];
  reason: { ar: string; en: string };
}

const TEMPLATES: HotelTemplate[] = [
  {
    nameAr: "جراند سنترال",
    nameEn: "Grand Central Hotel",
    stars: 5,
    recommendation: "overall",
    priceFactor: 1.6,
    amenities: ["wifi", "pool", "gym", "spa", "breakfast", "restaurant", "concierge"],
    reason: { ar: "أفضل توازن بين الموقع والخدمة والتقييمات.", en: "Best balance of location, service and reviews." },
  },
  {
    nameAr: "بوتيك سيتي",
    nameEn: "City Boutique Stay",
    stars: 4,
    recommendation: "location",
    priceFactor: 1.15,
    amenities: ["wifi", "breakfast", "ac", "restaurant", "concierge"],
    reason: { ar: "في قلب المدينة على بُعد خطوات من أهم المعالم.", en: "In the heart of the city, steps from top attractions." },
  },
  {
    nameAr: "فاميلي ريزيدنس",
    nameEn: "Family Residence Suites",
    stars: 4,
    recommendation: "family",
    priceFactor: 1.25,
    amenities: ["wifi", "pool", "familyRooms", "kidsClub", "breakfast", "parking", "ac"],
    reason: { ar: "غرف عائلية واسعة ونادٍ للأطفال ومسبح.", en: "Spacious family rooms, a kids club and a pool." },
  },
  {
    nameAr: "سمارت إن",
    nameEn: "Smart Inn",
    stars: 3,
    recommendation: "budget",
    priceFactor: 0.7,
    amenities: ["wifi", "ac", "breakfast"],
    reason: { ar: "سعر مناسب ونظافة وموقع عملي للمواصلات.", en: "Great price, clean and handy for transit." },
  },
  {
    nameAr: "ذا لكجري بالاس",
    nameEn: "The Luxury Palace",
    stars: 5,
    recommendation: "luxury",
    priceFactor: 2.4,
    amenities: ["wifi", "pool", "spa", "gym", "beach", "restaurant", "concierge", "shuttle"],
    reason: { ar: "تجربة فاخرة بخدمة استثنائية ومرافق راقية.", en: "A lavish experience with exceptional service." },
  },
  {
    nameAr: "بارك فيو",
    nameEn: "Park View Hotel",
    stars: 4,
    recommendation: "overall",
    priceFactor: 1.05,
    amenities: ["wifi", "gym", "breakfast", "parking", "ac", "laundry"],
    reason: { ar: "إطلالة هادئة وقيمة ممتازة مقابل السعر.", en: "Quiet views and excellent value for money." },
  },
];

function jitterCoords(base: Coordinates, seed: number): Coordinates {
  const dLat = ((Math.abs(seed) % 60) - 30) / 1000;
  const dLng = ((Math.abs(seed >> 4) % 60) - 30) / 1000;
  return { lat: base.lat + dLat, lng: base.lng + dLng };
}

/** Synchronous core, reused by the trip generator. */
export function generateHotels(input: SearchHotelsInput): Hotel[] {
  const dest = getDestination(input.destinationId);
    const baseCoords = input.near ?? dest?.coordinates ?? { lat: 24.7, lng: 46.7 };
    // Base nightly (SAR) from destination avg daily cost, per room.
    const baseNightlySar = (dest?.avgDailyCost ?? 400) * 0.9;

    const hotels = TEMPLATES.filter(
      (t) => !input.minStars || t.stars >= input.minStars || t.recommendation === "budget",
    ).map((t, i) => {
      const seed = hashString(`${input.destinationId}${t.nameEn}${input.checkIn}`);
      const nightlySar = Math.round((baseNightlySar * t.priceFactor) / 5) * 5;
      const nightlyPrice = Math.round(convertStatic(nightlySar, "SAR", input.currency));
      const rating = Math.round((3.9 + t.stars * 0.15 + ((Math.abs(seed) % 5) / 100)) * 10) / 10;
      return {
        id: `htl-${input.destinationId}-${i}`,
        name: { ar: t.nameAr, en: t.nameEn },
        stars: t.stars,
        rating: Math.min(rating, 4.9),
        reviewCount: 400 + (Math.abs(seed) % 6000),
        location: dest ? dest.city : { ar: "وسط المدينة", en: "City center" },
        coordinates: jitterCoords(baseCoords, seed),
        distanceFromCenterKm: Math.round((0.3 + (Math.abs(seed) % 40) / 10) * 10) / 10,
        distanceFromAttractionsKm: Math.round((0.2 + (Math.abs(seed >> 2) % 25) / 10) * 10) / 10,
        nightlyPrice,
        currency: input.currency,
        breakfastIncluded: t.amenities.includes("breakfast"),
        freeCancellation: t.stars >= 4,
        amenities: t.amenities,
        images: [HOTEL_IMAGES[i % HOTEL_IMAGES.length]!, HOTEL_IMAGES[(i + 1) % HOTEL_IMAGES.length]!],
        recommendation: t.recommendation,
        reason: t.reason,
        meta: { source: "demo", isEstimated: true, lastUpdatedISO: input.checkIn.slice(0, 10) },
      } satisfies Hotel;
    });

    return hotels;
}

export const mockHotelsProvider: HotelsProvider = {
  id: "mock",
  async searchHotels(input: SearchHotelsInput): Promise<Hotel[]> {
    return generateHotels(input);
  },
};
