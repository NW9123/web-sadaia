import type { Destination } from "@/types";

/**
 * Curated demo destinations. `avgDailyCost` is a per-person estimate expressed
 * in SAR so the Discover filters can compare like-for-like. All figures are
 * clearly-labelled estimates (meta.isEstimated = true).
 * Images use Unsplash with a graceful gradient fallback in the UI.
 */
const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

export const destinations: Destination[] = [
  {
    id: "istanbul",
    city: { ar: "إسطنبول", en: "Istanbul" },
    country: { ar: "تركيا", en: "Türkiye" },
    countryCode: "TR",
    coordinates: { lat: 41.0082, lng: 28.9784 },
    imageUrl: img("photo-1541432901042-2d8bd64b4a9b"),
    avgDailyCost: 420,
    currency: "SAR",
    flightTimeHours: 3.5,
    weather: "mild",
    bestSeasons: { ar: "أبريل – يونيو، سبتمبر – نوفمبر", en: "Apr–Jun, Sep–Nov" },
    tags: ["family", "culture", "history", "shopping", "restaurants"],
    description: {
      ar: "مدينة تجمع بين قارتين وتاريخ عريق وأسواق نابضة ومطبخ لا يُقاوم.",
      en: "A city spanning two continents with deep history, lively bazaars and irresistible food.",
    },
    popularity: 98,
    meta: { source: "demo", isEstimated: true, lastUpdatedISO: "2026-01-15" },
  },
  {
    id: "dubai",
    city: { ar: "دبي", en: "Dubai" },
    country: { ar: "الإمارات", en: "UAE" },
    countryCode: "AE",
    coordinates: { lat: 25.2048, lng: 55.2708 },
    imageUrl: img("photo-1512453979798-5ea266f8880c"),
    avgDailyCost: 650,
    currency: "SAR",
    flightTimeHours: 2,
    weather: "warm",
    bestSeasons: { ar: "نوفمبر – مارس", en: "Nov–Mar" },
    tags: ["luxury", "family", "shopping", "entertainment", "beaches"],
    description: {
      ar: "وجهة عصرية فاخرة بأطول مبنى في العالم وتسوق عالمي وشواطئ وترفيه للعائلة.",
      en: "A modern luxury destination with the world's tallest tower, world-class shopping and family fun.",
    },
    popularity: 96,
    meta: { source: "demo", isEstimated: true, lastUpdatedISO: "2026-01-15" },
  },
  {
    id: "london",
    city: { ar: "لندن", en: "London" },
    country: { ar: "المملكة المتحدة", en: "United Kingdom" },
    countryCode: "GB",
    coordinates: { lat: 51.5074, lng: -0.1278 },
    imageUrl: img("photo-1513635269975-59663e0ac1ad"),
    avgDailyCost: 780,
    currency: "SAR",
    flightTimeHours: 6.5,
    weather: "cool",
    bestSeasons: { ar: "مايو – سبتمبر", en: "May–Sep" },
    tags: ["culture", "shopping", "museums", "history", "family"],
    description: {
      ar: "عاصمة عالمية بمتاحف مجانية ومسارح ومعالم أيقونية وحدائق واسعة.",
      en: "A global capital of free museums, theatre, iconic landmarks and sprawling parks.",
    },
    popularity: 94,
    meta: { source: "demo", isEstimated: true, lastUpdatedISO: "2026-01-15" },
  },
  {
    id: "cairo",
    city: { ar: "القاهرة", en: "Cairo" },
    country: { ar: "مصر", en: "Egypt" },
    countryCode: "EG",
    coordinates: { lat: 30.0444, lng: 31.2357 },
    imageUrl: img("photo-1539650116574-75c0c6d73f6e"),
    avgDailyCost: 280,
    currency: "SAR",
    flightTimeHours: 2.5,
    weather: "warm",
    bestSeasons: { ar: "أكتوبر – أبريل", en: "Oct–Apr" },
    tags: ["history", "culture", "budget", "family"],
    description: {
      ar: "موطن الأهرامات والمتحف المصري وتاريخ يمتد آلاف السنين.",
      en: "Home of the Pyramids, the Egyptian Museum and millennia of history.",
    },
    popularity: 88,
    meta: { source: "demo", isEstimated: true, lastUpdatedISO: "2026-01-15" },
  },
  {
    id: "bali",
    city: { ar: "بالي", en: "Bali" },
    country: { ar: "إندونيسيا", en: "Indonesia" },
    countryCode: "ID",
    coordinates: { lat: -8.4095, lng: 115.1889 },
    imageUrl: img("photo-1537996194471-e657df975ab4"),
    avgDailyCost: 350,
    currency: "SAR",
    flightTimeHours: 9,
    weather: "warm",
    bestSeasons: { ar: "أبريل – أكتوبر", en: "Apr–Oct" },
    tags: ["nature", "honeymoon", "relaxation", "beaches", "adventure"],
    description: {
      ar: "جزيرة استوائية بشواطئ وحقول أرز خضراء ومعابد ساحرة.",
      en: "A tropical island of beaches, emerald rice terraces and enchanting temples.",
    },
    popularity: 90,
    meta: { source: "demo", isEstimated: true, lastUpdatedISO: "2026-01-15" },
  },
  {
    id: "maldives",
    city: { ar: "المالديف", en: "Maldives" },
    country: { ar: "المالديف", en: "Maldives" },
    countryCode: "MV",
    coordinates: { lat: 3.2028, lng: 73.2207 },
    imageUrl: img("photo-1514282401047-d79a71a590e8"),
    avgDailyCost: 1600,
    currency: "SAR",
    flightTimeHours: 5,
    weather: "warm",
    bestSeasons: { ar: "نوفمبر – أبريل", en: "Nov–Apr" },
    tags: ["honeymoon", "luxury", "relaxation", "beaches"],
    description: {
      ar: "منتجعات فوق المياه ومياه فيروزية صافية لأجواء رومانسية.",
      en: "Overwater villas and crystal-clear turquoise waters for a romantic escape.",
    },
    popularity: 85,
    meta: { source: "demo", isEstimated: true, lastUpdatedISO: "2026-01-15" },
  },
  {
    id: "tbilisi",
    city: { ar: "تبليسي", en: "Tbilisi" },
    country: { ar: "جورجيا", en: "Georgia" },
    countryCode: "GE",
    coordinates: { lat: 41.7151, lng: 44.8271 },
    imageUrl: img("photo-1565008576549-57569a49371d"),
    avgDailyCost: 300,
    currency: "SAR",
    flightTimeHours: 3,
    weather: "mild",
    bestSeasons: { ar: "مايو – أكتوبر", en: "May–Oct" },
    tags: ["nature", "budget", "adventure", "culture"],
    description: {
      ar: "طبيعة خلابة وجبال وأسعار مناسبة وأجواء لطيفة صيفًا.",
      en: "Stunning nature, mountains, friendly prices and pleasant summers.",
    },
    popularity: 82,
    meta: { source: "demo", isEstimated: true, lastUpdatedISO: "2026-01-15" },
  },
  {
    id: "kualalumpur",
    city: { ar: "كوالالمبور", en: "Kuala Lumpur" },
    country: { ar: "ماليزيا", en: "Malaysia" },
    countryCode: "MY",
    coordinates: { lat: 3.139, lng: 101.6869 },
    imageUrl: img("photo-1596422846543-75c6fc197f07"),
    avgDailyCost: 330,
    currency: "SAR",
    flightTimeHours: 8,
    weather: "warm",
    bestSeasons: { ar: "مايو – يوليو", en: "May–Jul" },
    tags: ["family", "shopping", "nature", "budget"],
    description: {
      ar: "أبراج بتروناس وطبيعة استوائية وتسوق ومطبخ متنوع.",
      en: "The Petronas Towers, tropical nature, shopping and diverse cuisine.",
    },
    popularity: 84,
    meta: { source: "demo", isEstimated: true, lastUpdatedISO: "2026-01-15" },
  },
  {
    id: "paris",
    city: { ar: "باريس", en: "Paris" },
    country: { ar: "فرنسا", en: "France" },
    countryCode: "FR",
    coordinates: { lat: 48.8566, lng: 2.3522 },
    imageUrl: img("photo-1502602898657-3e91760cbb34"),
    avgDailyCost: 760,
    currency: "SAR",
    flightTimeHours: 6,
    weather: "cool",
    bestSeasons: { ar: "أبريل – يونيو، سبتمبر", en: "Apr–Jun, Sep" },
    tags: ["honeymoon", "culture", "shopping", "luxury"],
    description: {
      ar: "مدينة النور برج إيفل والمتاحف والمقاهي والأناقة الفرنسية.",
      en: "The City of Light — the Eiffel Tower, museums, cafés and French elegance.",
    },
    popularity: 92,
    meta: { source: "demo", isEstimated: true, lastUpdatedISO: "2026-01-15" },
  },
  {
    id: "trabzon",
    city: { ar: "طرابزون", en: "Trabzon" },
    country: { ar: "تركيا", en: "Türkiye" },
    countryCode: "TR",
    coordinates: { lat: 41.0027, lng: 39.7168 },
    imageUrl: img("photo-1600002423562-8b5b1a1c1a1a"),
    avgDailyCost: 320,
    currency: "SAR",
    flightTimeHours: 4,
    weather: "cool",
    bestSeasons: { ar: "يونيو – سبتمبر", en: "Jun–Sep" },
    tags: ["nature", "family", "relaxation", "budget"],
    description: {
      ar: "خضرة وبحيرات وضباب الجبال ووجهة صيفية مفضلة للعائلات الخليجية.",
      en: "Greenery, lakes and misty mountains — a Gulf-family summer favourite.",
    },
    popularity: 80,
    meta: { source: "demo", isEstimated: true, lastUpdatedISO: "2026-01-15" },
  },
  {
    id: "barcelona",
    city: { ar: "برشلونة", en: "Barcelona" },
    country: { ar: "إسبانيا", en: "Spain" },
    countryCode: "ES",
    coordinates: { lat: 41.3874, lng: 2.1686 },
    imageUrl: img("photo-1583422409516-2895a77efded"),
    avgDailyCost: 560,
    currency: "SAR",
    flightTimeHours: 6.5,
    weather: "mild",
    bestSeasons: { ar: "مايو – يونيو، سبتمبر", en: "May–Jun, Sep" },
    tags: ["culture", "beaches", "friends", "entertainment"],
    description: {
      ar: "عمارة غاودي وشواطئ متوسطية وحياة نابضة ومطبخ إسباني شهي.",
      en: "Gaudí architecture, Mediterranean beaches, buzzing life and great food.",
    },
    popularity: 87,
    meta: { source: "demo", isEstimated: true, lastUpdatedISO: "2026-01-15" },
  },
  {
    id: "salalah",
    city: { ar: "صلالة", en: "Salalah" },
    country: { ar: "عُمان", en: "Oman" },
    countryCode: "OM",
    coordinates: { lat: 17.0151, lng: 54.0924 },
    imageUrl: img("photo-1518684079-3c830dcef090"),
    avgDailyCost: 340,
    currency: "SAR",
    flightTimeHours: 2.5,
    weather: "mild",
    bestSeasons: { ar: "يوليو – سبتمبر (الخريف)", en: "Jul–Sep (Khareef)" },
    tags: ["nature", "family", "relaxation", "beaches"],
    description: {
      ar: "خريف صلالة والضباب والشلالات وخضرة نادرة في الجزيرة العربية.",
      en: "Salalah's monsoon season — mist, waterfalls and rare Arabian greenery.",
    },
    popularity: 78,
    meta: { source: "demo", isEstimated: true, lastUpdatedISO: "2026-01-15" },
  },
];

export function getDestination(id: string): Destination | undefined {
  return destinations.find((d) => d.id === id);
}

/** Best-effort resolve a free-text destination query to a known destination. */
export function resolveDestination(query: string): Destination | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return destinations.find(
    (d) =>
      d.id === q ||
      d.city.en.toLowerCase().includes(q) ||
      d.city.ar.includes(query.trim()) ||
      d.country.en.toLowerCase().includes(q) ||
      d.country.ar.includes(query.trim()),
  );
}
