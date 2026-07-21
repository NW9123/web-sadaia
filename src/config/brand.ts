/**
 * Centralized branding configuration.
 * Rename the product, swap colors, or change contact details from this single
 * file — nothing user-facing should hardcode the product name.
 */
export const brand = {
  /** Temporary product name. Change here to rebrand everywhere. */
  name: "TripMind",
  nameAr: "تريب مايند",
  /** Short tagline used in metadata. */
  tagline: {
    ar: "خطط رحلتك كاملة خلال دقائق",
    en: "Plan your entire trip in minutes",
  },
  description: {
    ar: "مخطط رحلات ذكي ينشئ لك جدولًا سياحيًا متكاملًا يشمل الطيران والفندق والأنشطة والتكاليف.",
    en: "An AI travel planner that builds a complete itinerary — flights, hotels, activities and costs.",
  },
  /** Emoji/logo mark used as a lightweight brand token. */
  logoMark: "✈",
  /** Primary support / contact email. */
  supportEmail: "hello@tripmind.app",
  /** Social + legal placeholders. */
  social: {
    twitter: "@tripmind",
    instagram: "@tripmind",
  },
  /** Default locale + supported locales. */
  defaultLocale: "ar",
  /** Palette mirror (HSL) — kept in sync with globals.css for JS consumers
   *  such as chart colors and the map abstraction. */
  colors: {
    primary: "216 64% 19%",
    secondary: "190 82% 40%",
    accent: "26 92% 54%",
    success: "152 54% 38%",
    warning: "38 92% 48%",
    destructive: "0 72% 51%",
  },
} as const;

/** Convenience: resolve an HSL token into a CSS color string. */
export function hsl(token: string, alpha = 1): string {
  return alpha === 1 ? `hsl(${token})` : `hsl(${token} / ${alpha})`;
}

/** Ordered chart palette derived from the brand colors. */
export const chartPalette = [
  hsl(brand.colors.secondary),
  hsl(brand.colors.accent),
  hsl(brand.colors.primary),
  hsl(brand.colors.success),
  hsl("280 60% 55%"),
  hsl("340 70% 55%"),
  hsl("48 90% 50%"),
  hsl("200 70% 45%"),
  hsl("12 75% 55%"),
  hsl("165 55% 40%"),
] as const;
