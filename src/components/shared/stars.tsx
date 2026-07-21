import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Accessible star rating (never communicates value by colour alone). */
export function Stars({
  value,
  max = 5,
  size = "size-4",
  className,
  showValue = false,
}: {
  value: number;
  max?: number;
  size?: string;
  className?: string;
  showValue?: boolean;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} / ${max}`}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i + 1 <= rounded;
        const half = !filled && i + 0.5 === rounded;
        return (
          <Star
            key={i}
            aria-hidden
            className={cn(
              size,
              filled || half ? "fill-accent text-accent" : "fill-muted text-muted-foreground/40",
            )}
          />
        );
      })}
      {showValue && <span className="ms-1 text-xs font-medium tnum">{value.toFixed(1)}</span>}
    </span>
  );
}
