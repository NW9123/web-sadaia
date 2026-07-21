import { cookies } from "next/headers";
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from "./config";
import { getDictionary } from "./dictionaries";
import { createTranslator } from "./translate";

/** Read the active locale from the request cookie (server components). */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

/** Server-side translator for the active request locale. */
export async function getServerT() {
  const locale = await getServerLocale();
  return { locale, t: createTranslator(getDictionary(locale)) };
}
