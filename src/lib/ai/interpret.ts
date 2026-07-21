import type { Localized, PlaceCategory, Trip, TripModification } from "@/types";
import { getPlacesFor } from "@/data/places";

/**
 * Deterministic natural-language → structured-operations interpreter for the
 * mock AI. Handles Arabic and English variants of the product's example
 * instructions. A real provider would replace this with an LLM call that
 * returns the SAME structured operations (validated by the same Zod schema).
 */

interface Interpretation {
  message: Localized;
  modifications: TripModification[];
  isDestructive: boolean;
}

const AR_TASHKEEL = /[ً-ْٰ]/g;
const AR_DIGITS: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

function normalize(text: string): string {
  return text
    .replace(AR_TASHKEEL, "")
    .replace(/[٠-٩]/g, (d) => AR_DIGITS[d] ?? d)
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase()
    .trim();
}

const has = (t: string, ...words: string[]) => words.some((w) => t.includes(normalize(w)));

function usedPlaceIds(trip: Trip): Set<string> {
  return new Set(trip.days.flatMap((d) => d.activities.map((a) => a.placeId).filter(Boolean) as string[]));
}

function lightestDayId(trip: Trip): string {
  return [...trip.days].sort(
    (a, b) => a.activities.filter((x) => !x.isOptional).length - b.activities.filter((x) => !x.isOptional).length,
  )[0]?.id ?? trip.days[0]!.id;
}

const AR_ORDINALS: Record<string, number> = {
  الاول: 1, الثاني: 2, الثالث: 3, الرابع: 4, الخامس: 5,
  السادس: 6, السابع: 7, الثامن: 8, التاسع: 9, العاشر: 10,
};

function dayRef(trip: Trip, text: string): string | undefined {
  for (const [word, n] of Object.entries(AR_ORDINALS)) {
    if (text.includes(word)) return trip.days[n - 1]?.id;
  }
  const m = /(?:day|اليوم)\s*(\d{1,2})/.exec(text);
  if (m) return trip.days[Number(m[1]) - 1]?.id;
  if (has(text, "first", "اول")) return trip.days[0]?.id;
  if (has(text, "last", "اخير")) return trip.days[trip.days.length - 1]?.id;
  return undefined;
}

function pickUnused(trip: Trip, category: PlaceCategory, tag?: string, count = 1) {
  const used = usedPlaceIds(trip);
  return getPlacesFor(trip.destination.id)
    .filter((p) => p.category === category && !used.has(p.id) && (!tag || (p.tags ?? []).includes(tag as never)))
    .slice(0, count);
}

const CATEGORY_WORDS: { category: PlaceCategory; words: string[] }[] = [
  { category: "museum", words: ["museum", "متاحف", "متحف"] },
  { category: "shopping", words: ["shopping", "تسوق", "اسواق", "مول"] },
  { category: "restaurant", words: ["restaurant", "مطاعم", "مطعم"] },
  { category: "cafe", words: ["cafe", "coffee", "مقاهي", "مقهي", "قهوه"] },
  { category: "beach", words: ["beach", "شواطي", "شاطي"] },
  { category: "nature", words: ["nature", "park", "حديقه", "طبيعه"] },
];

export function interpretInstruction(trip: Trip, instruction: string): Interpretation {
  const t = normalize(instruction);
  const mods: TripModification[] = [];
  const notes: string[] = [];
  const notesEn: string[] = [];
  let destructive = false;

  const isRemove = has(t, "remove", "delete", "without", "no ", "احذف", "ازل", "بدون", "الغ", "شيل");
  const isAdd = has(t, "add", "اضف", "زد", "ضيف", "اريد");

  // --- Regenerate whole trip ---
  if (has(t, "regenerate trip", "regenerate the whole", "اعد توليد الرحله", "ابدا من جديد", "خطه جديده")) {
    return {
      message: { ar: "أعدت توليد الرحلة بالكامل مع الحفاظ على تفضيلاتك.", en: "I regenerated the whole trip while keeping your preferences." },
      modifications: [{ type: "REGENERATE_TRIP" }],
      isDestructive: true,
    };
  }

  // --- Regenerate a specific day ---
  if (has(t, "regenerate", "اعد توليد", "غير اليوم") && has(t, "day", "اليوم")) {
    const dayId = dayRef(trip, t);
    if (dayId) {
      return {
        message: { ar: "أعدت توليد هذا اليوم بأماكن جديدة قريبة.", en: "I regenerated that day with fresh nearby places." },
        modifications: [{ type: "REGENERATE_DAY", dayId }],
        isDestructive: true,
      };
    }
  }

  // --- Reduce cost ---
  if (has(t, "reduce", "cheaper", "lower", "قلل", "خفض", "وفر", "ارخص") && has(t, "cost", "budget", "price", "التكلفه", "الميزانيه", "السعر", "المبلغ", "%")) {
    const pctMatch = /(\d{1,2})\s*%/.exec(t) || /بنسبه\s*(\d{1,2})/.exec(t) || /(\d{1,2})\s*(?:percent|بالمئه|بالمايه)/.exec(t);
    const reducePercent = pctMatch ? Math.min(80, Number(pctMatch[1])) : 15;
    mods.push({ type: "UPDATE_BUDGET", updates: { reducePercent } });
    notes.push(`قلّلت التكلفة التقديرية بنحو ${reducePercent}% عبر فندق ورحلة أوفر وجعل بعض الأنشطة اختيارية.`);
    notesEn.push(`Cut the estimated cost by ~${reducePercent}% via a cheaper hotel/flight and making some activities optional.`);
    destructive = true;
  }

  // --- Hotel changes ---
  if (has(t, "hotel", "فندق")) {
    if (has(t, "5", "five", "خمس", "فاخر", "luxury")) {
      const lux = trip.hotels.find((h) => h.stars === 5) ?? trip.hotels.find((h) => h.recommendation === "luxury");
      if (lux) {
        mods.push({ type: "CHANGE_HOTEL", hotelId: lux.id });
        notes.push("استبدلت الفندق بخيار خمس نجوم.");
        notesEn.push("Switched the hotel to a five-star option.");
      }
    } else if (has(t, "cheap", "budget", "ارخص", "اقتصادي")) {
      const budget = [...trip.hotels].sort((a, b) => a.nightlyPrice - b.nightlyPrice)[0];
      if (budget) {
        mods.push({ type: "CHANGE_HOTEL", hotelId: budget.id });
        notes.push("اخترت فندقًا أوفر للميزانية.");
        notesEn.push("Picked a more budget-friendly hotel.");
      }
    }
  }

  // --- Cheaper flight ---
  if (has(t, "flight", "طيران", "رحله الطيران") && has(t, "cheap", "ارخص", "budget")) {
    const out = [...trip.flights.filter((f) => f.direction === "outbound")].sort((a, b) => a.price - b.price)[0];
    if (out) {
      mods.push({ type: "CHANGE_FLIGHT", flightId: out.id, direction: "outbound" });
      notes.push("اخترت رحلة ذهاب أرخص.");
      notesEn.push("Selected a cheaper outbound flight.");
    }
  }

  // --- Time window: no activities before X ---
  if (has(t, "before", "قبل") && (has(t, "activit", "انشطه", "نشاط", "تبدا", "start") || /\d/.test(t))) {
    const beforeMatch = /(?:before|قبل)\D*(\d{1,2})/.exec(t);
    if (beforeMatch && (has(t, "activit", "start", "انشطه", "نشاط", "تبدا", "صباح", "am"))) {
      let hour = Number(beforeMatch[1]);
      if (has(t, "pm", "مساء") && hour < 12) hour += 12;
      mods.push({ type: "SET_TIME_WINDOW", earliestStartMinutes: hour * 60 });
      notes.push(`جعلت الأنشطة تبدأ بعد الساعة ${hour}.`);
      notesEn.push(`Scheduled activities to start after ${hour}:00.`);
    }
  }
  // --- Time window: return to hotel before X ---
  if (has(t, "return", "back", "ارجع", "العوده", "الرجوع") && has(t, "before", "قبل") && has(t, "hotel", "الفندق")) {
    const m = /(?:before|قبل)\D*(\d{1,2})/.exec(t);
    if (m) {
      let hour = Number(m[1]);
      if ((has(t, "pm", "مساء") || hour <= 11) && hour < 12) hour += 12;
      mods.push({ type: "SET_TIME_WINDOW", latestEndMinutes: hour * 60 });
      notes.push(`جعلت الأنشطة تنتهي قبل الساعة ${hour % 12 || 12} مساءً قدر الإمكان.`);
      notesEn.push(`Aimed to end activities before ${hour}:00.`);
    }
  }

  // --- Less busy day ---
  if (has(t, "less busy", "lighter", "less packed", "اقل ازدحام", "خفف", "اخف")) {
    const dayId = dayRef(trip, t) ?? trip.days[0]!.id;
    const day = trip.days.find((d) => d.id === dayId);
    if (day) {
      const toTrim = day.activities.filter((a) => !a.isLocked && !a.isOptional).slice(-2);
      for (const a of toTrim) mods.push({ type: "MARK_OPTIONAL", activityId: a.id, optional: true });
      notes.push("خفّفت اليوم بجعل آخر نشاطين اختياريين.");
      notesEn.push("Lightened the day by making the last two activities optional.");
    }
  }

  // --- Remove a category ---
  if (isRemove) {
    for (const { category, words } of CATEGORY_WORDS) {
      if (has(t, ...words)) {
        const targets = trip.days.flatMap((d) => d.activities).filter((a) => a.category === category && !a.isLocked);
        for (const a of targets) mods.push({ type: "REMOVE_ACTIVITY", activityId: a.id });
        if (targets.length > 0) {
          destructive = true;
          notes.push(`أزلت ${targets.length} من عناصر «${category}».`);
          notesEn.push(`Removed ${targets.length} "${category}" item(s).`);
        }
      }
    }
  }

  // --- Add shopping (day) ---
  if (isAdd && has(t, "shopping", "تسوق", "اسواق", "مول")) {
    const targetDay = has(t, "day", "يوم") ? lightestDayId(trip) : lightestDayId(trip);
    const places = pickUnused(trip, "shopping", undefined, has(t, "day", "يوم") ? 2 : 1);
    for (const p of places) {
      mods.push({ type: "ADD_ACTIVITY", dayId: targetDay, activity: { placeId: p.id, name: p.name, category: p.category } });
    }
    if (places.length) {
      notes.push("أضفت وقتًا للتسوق إلى اليوم الأخف.");
      notesEn.push("Added shopping time to your lightest day.");
    }
  }

  // --- Add child-friendly ---
  if (isAdd && has(t, "child", "kid", "family", "اطفال", "الاطفال", "عائل")) {
    const places = pickUnused(trip, "entertainment", "kidsFriendly", 1)
      .concat(pickUnused(trip, "attraction", "kidsFriendly", 1))
      .slice(0, 2);
    const target = lightestDayId(trip);
    for (const p of places) {
      mods.push({ type: "ADD_ACTIVITY", dayId: target, activity: { placeId: p.id, name: p.name, category: p.category } });
    }
    if (places.length) {
      notes.push("أضفت أنشطة مناسبة للأطفال.");
      notesEn.push("Added child-friendly activities.");
    }
  }

  // --- Add halal restaurants / restaurants ---
  if (isAdd && has(t, "halal", "restaurant", "حلال", "مطاعم", "مطعم")) {
    const places = pickUnused(trip, "restaurant", undefined, 1);
    const target = lightestDayId(trip);
    for (const p of places) {
      mods.push({ type: "ADD_ACTIVITY", dayId: target, activity: { placeId: p.id, name: p.name, category: p.category } });
    }
    if (places.length) {
      notes.push("أضفت مطعمًا مناسبًا (خيارات حلال متوفرة).");
      notesEn.push("Added a suitable restaurant (halal options available).");
    }
  }

  // --- Add a café ---
  if (isAdd && has(t, "cafe", "coffee", "مقهي", "قهوه") && !has(t, "restaurant", "مطعم")) {
    const places = pickUnused(trip, "cafe", undefined, 1);
    const target = lightestDayId(trip);
    for (const p of places) {
      mods.push({ type: "ADD_ACTIVITY", dayId: target, activity: { placeId: p.id, name: p.name, category: p.category } });
    }
    if (places.length) {
      notes.push("أضفت مقهى لطيفًا لوقت الاستراحة.");
      notesEn.push("Added a nice café for a break.");
    }
  }

  if (mods.length === 0) {
    return {
      message: {
        ar: "لم أتمكن من فهم طلبك بدقة. جرّب مثلًا: «احذف المتاحف»، «أضف يوم تسوق»، «قلّل التكلفة 20%»، أو «استبدل الفندق بخيار خمس نجوم».",
        en: "I couldn't map that to a change. Try: \"remove museums\", \"add a shopping day\", \"reduce cost by 20%\", or \"switch to a five-star hotel\".",
      },
      modifications: [],
      isDestructive: false,
    };
  }

  return {
    message: { ar: notes.join(" ") || "طبّقت طلبك.", en: notesEn.join(" ") || "Applied your request." },
    modifications: mods,
    isDestructive: destructive,
  };
}
