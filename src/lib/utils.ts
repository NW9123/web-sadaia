import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Clamp a number into a range. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Stable, dependency-free id generator for client-side entities. */
let counter = 0;
export function localId(prefix = "id") {
  counter += 1;
  return `${prefix}_${counter.toString(36)}${Math.abs(hashString(`${prefix}${counter}`)).toString(36)}`;
}

/** Small deterministic string hash (djb2). Used for stable pseudo-random data. */
export function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return hash | 0;
}

/** Deterministic pick from an array based on a seed string. */
export function seededPick<T>(items: readonly T[], seed: string): T {
  if (items.length === 0) throw new Error("seededPick: empty array");
  const index = Math.abs(hashString(seed)) % items.length;
  return items[index] as T;
}

/** Round to a given number of decimals. */
export function round(value: number, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Truncate text with an ellipsis. */
export function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
