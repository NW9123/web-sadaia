"use client";

import { Info, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/** Small "estimated" chip with an explanatory tooltip. */
export function EstimatedBadge({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="muted" className={cn("gap-1 font-normal", className)}>
          <Info className="size-3" aria-hidden />
          {t("disclaimers.estimatedData")}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{t("disclaimers.estimatedPrices")}</TooltipContent>
    </Tooltip>
  );
}

/** "Demo data" chip. */
export function DemoBadge({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <Badge variant="outline" className={cn("gap-1 font-normal text-muted-foreground", className)}>
      {t("common.demo")}
    </Badge>
  );
}

/** Inline disclaimer block (visa/availability/etc.). */
export function Disclaimer({
  title,
  children,
  icon = "info",
  className,
}: {
  title?: string;
  children: React.ReactNode;
  icon?: "info" | "warning";
  className?: string;
}) {
  const Icon = icon === "warning" ? ShieldAlert : Info;
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-foreground/80",
        className,
      )}
      role="note"
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <div>
        {title && <p className="font-semibold text-foreground">{title}</p>}
        <p className="leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
