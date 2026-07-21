import type { Localized } from "@/types";

export interface AirlineRef {
  code: string;
  name: Localized;
  /** Relative price multiplier (premium carriers cost more). */
  priceFactor: number;
  /** true for full-service (baggage included by default). */
  fullService: boolean;
}

export const airlines: AirlineRef[] = [
  { code: "SV", name: { ar: "الخطوط السعودية", en: "Saudia" }, priceFactor: 1.05, fullService: true },
  { code: "XY", name: { ar: "طيران ناس", en: "flynas" }, priceFactor: 0.82, fullService: false },
  { code: "F3", name: { ar: "طيران أديل", en: "flyadeal" }, priceFactor: 0.78, fullService: false },
  { code: "TK", name: { ar: "الخطوط التركية", en: "Turkish Airlines" }, priceFactor: 1.1, fullService: true },
  { code: "EK", name: { ar: "طيران الإمارات", en: "Emirates" }, priceFactor: 1.2, fullService: true },
  { code: "QR", name: { ar: "الخطوط القطرية", en: "Qatar Airways" }, priceFactor: 1.18, fullService: true },
  { code: "BA", name: { ar: "الخطوط البريطانية", en: "British Airways" }, priceFactor: 1.12, fullService: true },
  { code: "PC", name: { ar: "طيران بيغاسوس", en: "Pegasus" }, priceFactor: 0.8, fullService: false },
  { code: "MS", name: { ar: "مصر للطيران", en: "EgyptAir" }, priceFactor: 0.95, fullService: true },
];
