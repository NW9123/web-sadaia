import type { Coordinates, Localized } from "@/types";

/** Origin/hub city reference used for flights and map anchoring. */
export interface CityRef {
  key: string;
  name: Localized;
  airport: string;
  coordinates: Coordinates;
}

export const cities: CityRef[] = [
  { key: "riyadh", name: { ar: "الرياض", en: "Riyadh" }, airport: "RUH", coordinates: { lat: 24.7136, lng: 46.6753 } },
  { key: "jeddah", name: { ar: "جدة", en: "Jeddah" }, airport: "JED", coordinates: { lat: 21.4858, lng: 39.1925 } },
  { key: "dammam", name: { ar: "الدمام", en: "Dammam" }, airport: "DMM", coordinates: { lat: 26.4207, lng: 50.0888 } },
  { key: "istanbul", name: { ar: "إسطنبول", en: "Istanbul" }, airport: "IST", coordinates: { lat: 41.2753, lng: 28.7519 } },
  { key: "dubai", name: { ar: "دبي", en: "Dubai" }, airport: "DXB", coordinates: { lat: 25.2532, lng: 55.3657 } },
  { key: "london", name: { ar: "لندن", en: "London" }, airport: "LHR", coordinates: { lat: 51.47, lng: -0.4543 } },
  { key: "cairo", name: { ar: "القاهرة", en: "Cairo" }, airport: "CAI", coordinates: { lat: 30.1219, lng: 31.4056 } },
  { key: "paris", name: { ar: "باريس", en: "Paris" }, airport: "CDG", coordinates: { lat: 49.0097, lng: 2.5479 } },
  { key: "kualalumpur", name: { ar: "كوالالمبور", en: "Kuala Lumpur" }, airport: "KUL", coordinates: { lat: 2.7456, lng: 101.7099 } },
  { key: "bali", name: { ar: "بالي", en: "Bali" }, airport: "DPS", coordinates: { lat: -8.7482, lng: 115.1672 } },
  { key: "tbilisi", name: { ar: "تبليسي", en: "Tbilisi" }, airport: "TBS", coordinates: { lat: 41.6692, lng: 44.9547 } },
  { key: "barcelona", name: { ar: "برشلونة", en: "Barcelona" }, airport: "BCN", coordinates: { lat: 41.2974, lng: 2.0833 } },
  { key: "salalah", name: { ar: "صلالة", en: "Salalah" }, airport: "SLL", coordinates: { lat: 17.0387, lng: 54.0913 } },
  { key: "maldives", name: { ar: "ماليه", en: "Malé" }, airport: "MLE", coordinates: { lat: 4.1918, lng: 73.5291 } },
  { key: "trabzon", name: { ar: "طرابزون", en: "Trabzon" }, airport: "TZX", coordinates: { lat: 40.995, lng: 39.7897 } },
];

const FALLBACK: CityRef = {
  key: "riyadh",
  name: { ar: "الرياض", en: "Riyadh" },
  airport: "RUH",
  coordinates: { lat: 24.7136, lng: 46.6753 },
};

/** Resolve a free-text origin city to a known hub (defaults to Riyadh). */
export function resolveCity(query: string): CityRef {
  const q = query.trim().toLowerCase();
  return (
    cities.find(
      (c) => c.key === q || c.name.en.toLowerCase().includes(q) || c.name.ar.includes(query.trim()),
    ) ?? FALLBACK
  );
}

export function getCityByKey(key: string): CityRef {
  return cities.find((c) => c.key === key) ?? FALLBACK;
}
