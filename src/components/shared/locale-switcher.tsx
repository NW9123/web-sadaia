"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { locales, localeLabels } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";

/** Toggles between the supported locales (Arabic ⇄ English). */
export function LocaleSwitcher({ variant = "ghost" }: { variant?: "ghost" | "outline" }) {
  const { locale, setLocale } = useI18n();
  const next = locales.find((l) => l !== locale) ?? "en";

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={() => setLocale(next)}
      aria-label={`Switch language to ${localeLabels[next].en}`}
      className="gap-2"
    >
      <Languages className="size-4" aria-hidden />
      <span>{localeLabels[next].native}</span>
    </Button>
  );
}
