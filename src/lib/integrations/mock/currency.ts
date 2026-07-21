import { convertStatic, getCurrencyMeta } from "@/data/currencies";
import type { CurrencyProvider } from "../types";

export const mockCurrencyProvider: CurrencyProvider = {
  id: "mock",
  rate(from, to) {
    return getCurrencyMeta(from).toSAR / getCurrencyMeta(to).toSAR;
  },
  async convert(amount, from, to) {
    return Math.round(convertStatic(amount, from, to) * 100) / 100;
  },
};
