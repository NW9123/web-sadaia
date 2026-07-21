export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

/** Cookie key used to persist the chosen locale across requests. */
export const LOCALE_COOKIE = "tripmind.locale";

/** Text direction for a given locale. */
export function dirForLocale(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export const localeLabels: Record<Locale, { native: string; en: string }> = {
  ar: { native: "العربية", en: "Arabic" },
  en: { native: "English", en: "English" },
};
