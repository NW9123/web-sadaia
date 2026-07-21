import { z } from "zod";
import { BUDGET_CATEGORIES, PLACE_CATEGORIES } from "@/types/enums";
import { coordinatesSchema, localizedSchema, timeSchema, zEnum } from "./common";

const activityInputSchema = z.object({
  placeId: z.string().optional(),
  name: localizedSchema,
  category: zEnum(PLACE_CATEGORIES),
  description: localizedSchema.optional(),
  address: localizedSchema.optional(),
  coordinates: coordinatesSchema.optional(),
  startTime: timeSchema.optional(),
  durationMinutes: z.number().int().min(15).max(720).optional(),
  estimatedCost: z.number().min(0).max(1_000_000).optional(),
  imageUrl: z.string().optional(),
});

const activityUpdateSchema = z
  .object({
    name: localizedSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    durationMinutes: z.number().int().min(15).max(720),
    estimatedCost: z.number().min(0),
    category: zEnum(PLACE_CATEGORIES),
    isOptional: z.boolean(),
    isLocked: z.boolean(),
  })
  .partial();

const budgetUpdateSchema = z.object({
  reducePercent: z.number().min(0).max(90).optional(),
  targetTotal: z.number().min(0).optional(),
  categoryAdjustments: z
    .array(z.object({ category: zEnum(BUDGET_CATEGORIES), amount: z.number() }))
    .optional(),
});

/**
 * Discriminated union mirroring the TripModification type. Any AI-produced
 * operation MUST pass this before being applied — never trust raw model JSON.
 */
export const tripModificationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("ADD_ACTIVITY"),
    dayId: z.string(),
    activity: activityInputSchema,
    index: z.number().int().min(0).optional(),
  }),
  z.object({ type: z.literal("REMOVE_ACTIVITY"), activityId: z.string() }),
  z.object({
    type: z.literal("MOVE_ACTIVITY"),
    activityId: z.string(),
    targetDayId: z.string(),
    targetIndex: z.number().int().min(0),
  }),
  z.object({
    type: z.literal("UPDATE_ACTIVITY"),
    activityId: z.string(),
    updates: activityUpdateSchema,
  }),
  z.object({
    type: z.literal("REORDER_DAY"),
    dayId: z.string(),
    orderedActivityIds: z.array(z.string()),
  }),
  z.object({
    type: z.literal("LOCK_ACTIVITY"),
    activityId: z.string(),
    locked: z.boolean(),
  }),
  z.object({
    type: z.literal("MARK_OPTIONAL"),
    activityId: z.string(),
    optional: z.boolean(),
  }),
  z.object({ type: z.literal("CHANGE_HOTEL"), hotelId: z.string() }),
  z.object({
    type: z.literal("CHANGE_FLIGHT"),
    flightId: z.string(),
    direction: z.enum(["outbound", "return"]),
  }),
  z.object({ type: z.literal("UPDATE_BUDGET"), updates: budgetUpdateSchema }),
  z.object({
    type: z.literal("SET_TIME_WINDOW"),
    earliestStartMinutes: z.number().int().min(0).max(1439).optional(),
    latestEndMinutes: z.number().int().min(0).max(1439).optional(),
  }),
  z.object({ type: z.literal("REGENERATE_DAY"), dayId: z.string() }),
  z.object({ type: z.literal("REGENERATE_TRIP") }),
]);

export const modifyResultSchema = z.object({
  message: localizedSchema,
  modifications: z.array(tripModificationSchema),
  isDestructive: z.boolean(),
});

export type ValidatedModification = z.infer<typeof tripModificationSchema>;

/** Parse an array of unknown modifications, dropping any that fail validation. */
export function parseModifications(raw: unknown): {
  valid: ValidatedModification[];
  dropped: number;
} {
  if (!Array.isArray(raw)) return { valid: [], dropped: 0 };
  const valid: ValidatedModification[] = [];
  let dropped = 0;
  for (const item of raw) {
    const result = tripModificationSchema.safeParse(item);
    if (result.success) valid.push(result.data);
    else dropped += 1;
  }
  return { valid, dropped };
}
