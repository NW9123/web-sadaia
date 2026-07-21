import type { Localized } from "@/types";

/** Hotel amenity keys → bilingual labels (kept out of the i18n dict for brevity). */
export const AMENITIES: Record<string, Localized> = {
  wifi: { ar: "واي فاي مجاني", en: "Free Wi-Fi" },
  pool: { ar: "مسبح", en: "Pool" },
  gym: { ar: "صالة رياضية", en: "Gym" },
  spa: { ar: "سبا", en: "Spa" },
  parking: { ar: "موقف سيارات", en: "Parking" },
  breakfast: { ar: "إفطار", en: "Breakfast" },
  familyRooms: { ar: "غرف عائلية", en: "Family rooms" },
  kidsClub: { ar: "نادٍ للأطفال", en: "Kids club" },
  beach: { ar: "شاطئ خاص", en: "Beach access" },
  shuttle: { ar: "نقل من المطار", en: "Airport shuttle" },
  restaurant: { ar: "مطعم", en: "Restaurant" },
  ac: { ar: "تكييف", en: "Air conditioning" },
  laundry: { ar: "غسيل ملابس", en: "Laundry" },
  concierge: { ar: "خدمة الكونسيرج", en: "Concierge" },
};

export function amenityLabel(key: string): Localized {
  return AMENITIES[key] ?? { ar: key, en: key };
}

export const AMENITY_KEYS = Object.keys(AMENITIES);
