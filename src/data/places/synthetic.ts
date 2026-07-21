import type { Place, PlaceCategory } from "@/types";
import { getDestination } from "@/data/destinations";
import { hashString } from "@/lib/utils";

/**
 * Fallback place generator for destinations without a hand-curated dataset.
 * Produces plausible, clearly-demo places anchored around the destination so
 * the itinerary generator and map still work for any destination.
 */
const TEMPLATES: { category: PlaceCategory; ar: string; en: string; tags: Place["tags"] }[] = [
  { category: "landmark", ar: "الميدان الرئيسي", en: "Main Square", tags: ["photography", "history"] },
  { category: "museum", ar: "المتحف الوطني", en: "National Museum", tags: ["museums", "history"] },
  { category: "attraction", ar: "البلدة القديمة", en: "Old Town", tags: ["history", "photography"] },
  { category: "nature", ar: "الحديقة الكبرى", en: "Grand Park", tags: ["nature", "quiet", "kidsFriendly"] },
  { category: "restaurant", ar: "مطعم البلد", en: "Local Kitchen", tags: ["restaurants"] },
  { category: "cafe", ar: "مقهى الزاوية", en: "Corner Café", tags: ["cafes", "quiet"] },
  { category: "shopping", ar: "السوق المركزي", en: "Central Market", tags: ["shopping"] },
  { category: "attraction", ar: "برج المشاهدة", en: "Observation Tower", tags: ["photography"] },
  { category: "entertainment", ar: "منطقة الترفيه", en: "Entertainment District", tags: ["events", "kidsFriendly"] },
  { category: "restaurant", ar: "مطعم بإطلالة", en: "Rooftop Restaurant", tags: ["restaurants"] },
  { category: "attraction", ar: "المعبد التاريخي", en: "Historic Temple", tags: ["history", "hiddenGems"] },
  { category: "nature", ar: "الواجهة المائية", en: "Waterfront Promenade", tags: ["nature", "photography"] },
  { category: "cafe", ar: "مقهى الحديقة", en: "Garden Café", tags: ["cafes"] },
  { category: "shopping", ar: "المول الكبير", en: "Grand Mall", tags: ["shopping", "kidsFriendly"] },
  { category: "museum", ar: "متحف الفنون", en: "Museum of Art", tags: ["museums"] },
  { category: "attraction", ar: "المنتزه الترفيهي", en: "Theme Park", tags: ["themeparks", "kidsFriendly", "adventure"] },
];

export function generateSyntheticPlaces(destinationId: string): Place[] {
  const dest = getDestination(destinationId);
  const base = dest?.coordinates ?? { lat: 24.7, lng: 46.7 };
  const cityAr = dest?.city.ar ?? "المدينة";
  const cityEn = dest?.city.en ?? "the city";

  return TEMPLATES.map((tpl, i) => {
    const seed = hashString(`${destinationId}${tpl.en}${i}`);
    const priceLevel = ((Math.abs(seed) % 4) + 1) as 1 | 2 | 3 | 4;
    return {
      id: `${destinationId}-syn-${i}`,
      name: { ar: `${tpl.ar}`, en: `${tpl.en}` },
      category: tpl.category,
      description: {
        ar: `${tpl.ar} من أبرز أماكن ${cityAr} — بيانات تجريبية للعرض.`,
        en: `${tpl.en} — a highlight of ${cityEn}. Demo data for display.`,
      },
      address: { ar: `${cityAr}`, en: `${cityEn}` },
      coordinates: {
        lat: base.lat + (((Math.abs(seed) % 80) - 40) / 1000),
        lng: base.lng + (((Math.abs(seed >> 5) % 80) - 40) / 1000),
      },
      rating: Math.round((3.9 + (Math.abs(seed) % 9) / 10) * 10) / 10,
      reviewCount: 200 + (Math.abs(seed) % 9000),
      priceLevel,
      tags: tpl.tags,
      openingHours: { ar: "09:00 – 21:00", en: "09:00 – 21:00" },
      destinationId,
      meta: { source: "demo", isEstimated: true, lastUpdatedISO: "2026-01-15" },
    } satisfies Place;
  });
}
