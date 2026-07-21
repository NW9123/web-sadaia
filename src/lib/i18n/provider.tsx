"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { LOCALE_COOKIE, type Locale, defaultLocale, dirForLocale } from "./config";
import { getDictionary } from "./dictionaries";
import { createTranslator, type Translator } from "./translate";
import {
  formatCurrency,
  formatDate,
  formatDateRange,
  formatDistance,
  formatDuration,
  formatNumber,
  formatTime,
} from "./format";

interface I18nContextValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: Translator;
  setLocale: (locale: Locale) => void;
  /** Bound formatting helpers for the active locale. */
  fmt: {
    number: (value: number, options?: Intl.NumberFormatOptions) => string;
    currency: (amount: number, currency: string, options?: Intl.NumberFormatOptions) => string;
    date: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
    dateRange: (start: string, end: string) => string;
    time: (time: string) => string;
    duration: (minutes: number) => string;
    distance: (km: number) => string;
  };
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLocale = defaultLocale,
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    // Persist for SSR on next navigation and update <html> immediately.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    const dir = dirForLocale(next);
    document.documentElement.lang = next;
    document.documentElement.dir = dir;
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const t = createTranslator(getDictionary(locale));
    return {
      locale,
      dir: dirForLocale(locale),
      t,
      setLocale,
      fmt: {
        number: (v, o) => formatNumber(v, locale, o),
        currency: (a, c, o) => formatCurrency(a, c, locale, o),
        date: (d, o) => formatDate(d, locale, o),
        dateRange: (s, e) => formatDateRange(s, e, locale),
        time: (time) => formatTime(time, locale),
        duration: (m) => formatDuration(m, locale),
        distance: (km) => formatDistance(km, locale),
      },
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
