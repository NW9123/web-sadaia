import { ar, type Messages } from "@/messages/ar";
import { en } from "@/messages/en";
import type { Locale } from "./config";

const dictionaries: Record<Locale, Messages> = { ar, en };

export function getDictionary(locale: Locale): Messages {
  return dictionaries[locale];
}

export type { Messages };
