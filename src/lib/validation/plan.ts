import { z } from "zod";
import {
  CURRENCIES,
  HOTEL_LEVELS,
  INTERESTS,
  PACES,
  SPENDING_LEVELS,
  TRANSPORT_MODES,
  TRAVEL_STYLES,
} from "@/types/enums";
import { isoDateSchema, zEnum } from "./common";

export const preferencesSchema = z.object({
  styles: z.array(zEnum(TRAVEL_STYLES)).default([]),
  interests: z.array(zEnum(INTERESTS)).default([]),
  pace: zEnum(PACES).default("balanced"),
  hotelLevel: zEnum(HOTEL_LEVELS).default("any"),
  transport: zEnum(TRANSPORT_MODES).default("mixed"),
  spendingLevel: zEnum(SPENDING_LEVELS).default("medium"),
  includeFlights: z.boolean().default(true),
  includeHotels: z.boolean().default(true),
  specialRequirements: z.string().max(1000).default(""),
});

/**
 * Full trip-planning form schema (the wizard output).
 * Cross-field rules: return >= departure, and a destination is required unless
 * the user opted into "recommend a destination for me".
 */
export const planFormSchema = z
  .object({
    title: z.string().max(120).optional(),
    originCity: z.string().min(2, "أدخل مدينة الانطلاق"),
    destinationId: z.string().optional(),
    destinationQuery: z.string().optional(),
    recommendDestination: z.boolean().default(false),
    departureDate: isoDateSchema,
    returnDate: isoDateSchema,
    adults: z.coerce.number().int().min(1).max(20),
    children: z.coerce.number().int().min(0).max(20),
    budget: z.coerce.number().positive("أدخل ميزانية صحيحة").max(10_000_000),
    currency: zEnum(CURRENCIES),
    preferences: preferencesSchema,
  })
  .refine((v) => new Date(v.returnDate) >= new Date(v.departureDate), {
    message: "تاريخ العودة يجب أن يكون بعد الذهاب",
    path: ["returnDate"],
  })
  .refine(
    (v) => v.recommendDestination || Boolean(v.destinationId || v.destinationQuery?.trim()),
    { message: "اختر وجهة أو فعّل الاقتراح التلقائي", path: ["destinationQuery"] },
  );

export type PlanFormValues = z.infer<typeof planFormSchema>;
export type PreferencesValues = z.infer<typeof preferencesSchema>;

/** Lightweight schema for the landing-page quick form (subset). */
export const quickPlanSchema = z.object({
  originCity: z.string().min(2),
  destinationQuery: z.string().optional(),
  recommendDestination: z.boolean().default(false),
  departureDate: isoDateSchema,
  returnDate: isoDateSchema,
  adults: z.coerce.number().int().min(1).max(20),
  children: z.coerce.number().int().min(0).max(20),
  budget: z.coerce.number().positive(),
  currency: zEnum(CURRENCIES),
});
export type QuickPlanValues = z.infer<typeof quickPlanSchema>;
