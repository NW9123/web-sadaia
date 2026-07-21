import { z } from "zod";

/** Build a Zod enum from an `as const` tuple without fighting readonly types. */
export function zEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z.enum(values as unknown as [T[number], ...T[number][]]);
}

export const localizedSchema = z.object({
  ar: z.string(),
  en: z.string(),
});

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/** "HH:mm" 24-hour time. */
export const timeSchema = z
  .string()
  .regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "Invalid time (HH:mm)");

/** ISO date "YYYY-MM-DD" or full ISO datetime. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}/, "Invalid date");
