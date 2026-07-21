"use client";

import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

interface ChipGroupProps<T extends string> {
  values: readonly T[];
  /** Currently selected value(s). */
  selected: T[];
  onToggle: (value: T) => void;
  /** i18n key prefix, e.g. "enums.style" — label resolved as `${prefix}.${value}`. */
  labelPrefix: string;
  /** Single-select behaviour (radio-like). */
  single?: boolean;
  columns?: boolean;
  className?: string;
}

export function ChipGroup<T extends string>({
  values,
  selected,
  onToggle,
  labelPrefix,
  columns = false,
  className,
}: ChipGroupProps<T>) {
  const { t } = useI18n();
  return (
    <div
      className={cn("flex flex-wrap gap-2", columns && "grid grid-cols-2 sm:grid-cols-3", className)}
      role="group"
    >
      {values.map((value) => {
        const isSelected = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
              isSelected
                ? "border-secondary bg-secondary/10 text-secondary"
                : "border-border bg-card text-foreground/80 hover:border-secondary/50 hover:bg-muted",
            )}
          >
            {isSelected && <Check className="size-3.5" aria-hidden />}
            {t(`${labelPrefix}.${value}`)}
          </button>
        );
      })}
    </div>
  );
}
