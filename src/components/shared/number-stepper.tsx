"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clamp } from "@/lib/utils";

/** Accessible −/+ stepper for small integer counts. */
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 20,
  label,
  id,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  id?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 rounded-full"
        onClick={() => onChange(clamp(value - 1, min, max))}
        disabled={value <= min}
        aria-label={`- ${label ?? ""}`}
      >
        <Minus className="size-4" />
      </Button>
      <span id={id} className="w-8 text-center text-base font-semibold tnum" aria-live="polite">
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 rounded-full"
        onClick={() => onChange(clamp(value + 1, min, max))}
        disabled={value >= max}
        aria-label={`+ ${label ?? ""}`}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
