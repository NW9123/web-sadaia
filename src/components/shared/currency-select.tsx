"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Currency } from "@/types";
import { currencyList } from "@/data/currencies";
import { useI18n } from "@/lib/i18n/provider";

export function CurrencySelect({
  value,
  onChange,
  className,
}: {
  value: Currency;
  onChange: (value: Currency) => void;
  className?: string;
}) {
  const { locale } = useI18n();
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Currency)}>
      <SelectTrigger className={className} aria-label="Currency">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {currencyList.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.code} — {c.name[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
