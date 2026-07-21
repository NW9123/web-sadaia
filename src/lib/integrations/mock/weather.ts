import type { Coordinates, WeatherInfo } from "@/types";
import { hashString } from "@/lib/utils";
import type { WeatherProvider } from "../types";

const CONDITIONS: WeatherInfo["condition"][] = [
  "sunny",
  "clear",
  "cloudy",
  "rain",
];

const LABELS: Record<WeatherInfo["condition"], WeatherInfo["label"]> = {
  sunny: { ar: "مشمس", en: "Sunny" },
  clear: { ar: "صحو", en: "Clear" },
  cloudy: { ar: "غائم جزئيًا", en: "Partly cloudy" },
  rain: { ar: "أمطار خفيفة", en: "Light rain" },
  snow: { ar: "ثلوج", en: "Snow" },
  storm: { ar: "عواصف", en: "Storm" },
};

/**
 * Deterministic demo forecast: a plausible temperature derived from latitude
 * and a stable per-day hash. Clearly flagged as an estimate.
 */
/** Synchronous core, reused by the trip generator. */
export function forecast(coordinates: Coordinates, dateISO: string): WeatherInfo {
  const seed = hashString(`${coordinates.lat.toFixed(1)}:${dateISO}`);
  const condition = CONDITIONS[Math.abs(seed) % CONDITIONS.length]!;
  // Warmer near the equator, cooler toward the poles.
  const base = 30 - Math.abs(coordinates.lat) * 0.35;
  const variance = (Math.abs(seed >> 3) % 8) - 4;
  const high = Math.round(base + variance + 4);
  const low = Math.round(base + variance - 5);
  return {
    condition,
    highC: high,
    lowC: low,
    label: LABELS[condition],
    isEstimated: true,
  };
}

export const mockWeatherProvider: WeatherProvider = {
  id: "mock",
  async getForecast(coordinates: Coordinates, dateISO: string): Promise<WeatherInfo> {
    return forecast(coordinates, dateISO);
  },
};
