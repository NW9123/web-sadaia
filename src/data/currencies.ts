import type { Currency } from "@/types";

/** Currency metadata. `toSAR` are demo static rates clearly labelled as estimates. */
export interface CurrencyMeta {
  code: Currency;
  symbol: string;
  name: { ar: string; en: string };
  /** Approximate value of 1 unit in SAR (demo/static). */
  toSAR: number;
}

export const currencyList: CurrencyMeta[] = [
  { code: "SAR", symbol: "ر.س", name: { ar: "ريال سعودي", en: "Saudi Riyal" }, toSAR: 1 },
  { code: "USD", symbol: "$", name: { ar: "دولار أمريكي", en: "US Dollar" }, toSAR: 3.75 },
  { code: "AED", symbol: "د.إ", name: { ar: "درهم إماراتي", en: "UAE Dirham" }, toSAR: 1.02 },
  { code: "EUR", symbol: "€", name: { ar: "يورو", en: "Euro" }, toSAR: 4.05 },
  { code: "GBP", symbol: "£", name: { ar: "جنيه إسترليني", en: "British Pound" }, toSAR: 4.75 },
  { code: "TRY", symbol: "₺", name: { ar: "ليرة تركية", en: "Turkish Lira" }, toSAR: 0.11 },
  { code: "KWD", symbol: "د.ك", name: { ar: "دينار كويتي", en: "Kuwaiti Dinar" }, toSAR: 12.2 },
  { code: "QAR", symbol: "ر.ق", name: { ar: "ريال قطري", en: "Qatari Riyal" }, toSAR: 1.03 },
  { code: "BHD", symbol: "د.ب", name: { ar: "دينار بحريني", en: "Bahraini Dinar" }, toSAR: 9.95 },
  { code: "OMR", symbol: "ر.ع", name: { ar: "ريال عماني", en: "Omani Rial" }, toSAR: 9.75 },
];

const byCode = new Map(currencyList.map((c) => [c.code, c]));

export function getCurrencyMeta(code: Currency): CurrencyMeta {
  return byCode.get(code) ?? currencyList[0]!;
}

/** Static demo conversion. Real rates come from the CurrencyProvider adapter. */
export function convertStatic(amount: number, from: Currency, to: Currency): number {
  const inSar = amount * getCurrencyMeta(from).toSAR;
  return inSar / getCurrencyMeta(to).toSAR;
}
