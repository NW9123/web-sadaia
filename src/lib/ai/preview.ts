import type { Localized, ModificationPreview, Trip } from "@/types";
import type { ValidatedModification } from "@/lib/validation/ai";
import { budgetTotal } from "@/lib/trip/budget";
import { dayBusyMinutes } from "@/lib/trip/itinerary";
import { applyModifications } from "./apply";

interface FlatActivity {
  id: string;
  name: Localized;
  dayId: string;
  startTime: string;
  cost: number;
}

function flatten(trip: Trip): Map<string, FlatActivity> {
  const map = new Map<string, FlatActivity>();
  for (const day of trip.days) {
    for (const a of day.activities) {
      map.set(a.id, { id: a.id, name: a.name, dayId: day.id, startTime: a.startTime, cost: a.estimatedCost });
    }
  }
  return map;
}

function busyTotal(trip: Trip): number {
  return trip.days.reduce((s, d) => s + dayBusyMinutes(d), 0);
}

/**
 * Build a human-readable diff by simulating the modifications on a clone and
 * comparing before/after. Used to preview AI changes before the user confirms.
 */
export function buildPreview(before: Trip, mods: ValidatedModification[]): ModificationPreview {
  const after = applyModifications(before, mods);
  const beforeMap = flatten(before);
  const afterMap = flatten(after);

  const added: ModificationPreview["added"] = [];
  const removed: ModificationPreview["removed"] = [];
  const moved: ModificationPreview["moved"] = [];
  const updated: ModificationPreview["updated"] = [];

  for (const [id, a] of afterMap) {
    const prev = beforeMap.get(id);
    if (!prev) {
      added.push({ dayId: a.dayId, name: a.name });
    } else if (prev.dayId !== a.dayId) {
      moved.push({ name: a.name, fromDayId: prev.dayId, toDayId: a.dayId });
    } else if (prev.startTime !== a.startTime || prev.cost !== a.cost) {
      updated.push({
        name: a.name,
        detail: {
          ar: prev.cost !== a.cost ? "تغيّرت التكلفة/التوقيت" : "تغيّر التوقيت",
          en: prev.cost !== a.cost ? "Cost/timing changed" : "Timing changed",
        },
      });
    }
  }
  for (const [id, a] of beforeMap) {
    if (!afterMap.has(id)) removed.push({ name: a.name, dayId: a.dayId });
  }

  let hotelChange: ModificationPreview["hotelChange"];
  if (before.selectedHotelId !== after.selectedHotelId) {
    const toName = after.hotels.find((h) => h.id === after.selectedHotelId)?.name;
    const fromName = before.hotels.find((h) => h.id === before.selectedHotelId)?.name;
    if (toName) hotelChange = { fromName, toName };
  }

  return {
    added,
    removed,
    moved,
    updated: updated.slice(0, 6),
    hotelChange,
    costDelta: budgetTotal(after.budgetBreakdown) - budgetTotal(before.budgetBreakdown),
    timeDeltaMinutes: busyTotal(after) - busyTotal(before),
    currency: before.currency,
    isDestructive: removed.length > 0,
  };
}
