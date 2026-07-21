import type { Locale } from "./config";

/**
 * Locale-aware formatting helpers.
 * We force the Latin numbering system even in Arabic so prices, times and
 * counts stay easy to scan for GCC users (a common regional preference),
 * while month/day names still localize.
 */
const NUMBERING = "latn";

function intlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-SA" : "en-US";
}

export function formatNumber(
  value: number,
  locale: Locale,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(`${intlLocale(locale)}-u-nu-${NUMBERING}`, options).format(value);
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale: Locale,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(`${intlLocale(locale)}-u-nu-${NUMBERING}`, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount);
}

export function formatDate(
  date: Date | string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(`${intlLocale(locale)}-u-nu-${NUMBERING}`, options).format(d);
}

export function formatDateRange(start: string, end: string, locale: Locale): string {
  const s = formatDate(start, locale, { day: "numeric", month: "short" });
  const e = formatDate(end, locale, { day: "numeric", month: "short", year: "numeric" });
  // Direction-neutral separator; RTL/LTR handled by container dir.
  return `${s} – ${e}`;
}

/** Format an ISO time or "HH:mm" string as a short local time. */
export function formatTime(time: string, locale: Locale): string {
  // Accept "HH:mm" or full ISO.
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  const d = new Date();
  if (match) {
    d.setHours(Number(match[1]), Number(match[2]), 0, 0);
  } else {
    const parsed = new Date(time);
    if (!Number.isNaN(parsed.getTime())) d.setTime(parsed.getTime());
  }
  return new Intl.DateTimeFormat(`${intlLocale(locale)}-u-nu-${NUMBERING}`, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/** Human-readable duration from minutes, e.g. "٢ ساعة ٣٠ دقيقة" / "2h 30m". */
export function formatDuration(minutes: number, locale: Locale): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  const num = (n: number) => formatNumber(n, locale);
  if (locale === "ar") {
    const parts: string[] = [];
    if (h > 0) parts.push(`${num(h)} ساعة`);
    if (m > 0) parts.push(`${num(m)} دقيقة`);
    return parts.join(" ") || `${num(0)} دقيقة`;
  }
  const parts: string[] = [];
  if (h > 0) parts.push(`${num(h)}h`);
  if (m > 0) parts.push(`${num(m)}m`);
  return parts.join(" ") || "0m";
}

/** Distance in km, one decimal under 10km. */
export function formatDistance(km: number, locale: Locale): string {
  const value = km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
  return locale === "ar"
    ? `${formatNumber(value, locale)} كم`
    : `${formatNumber(value, locale)} km`;
}
