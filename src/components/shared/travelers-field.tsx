"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NumberStepper } from "./number-stepper";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/** Compact adults/children selector shown in a popover. */
export function TravelersField({
  adults,
  kids,
  onChange,
  className,
}: {
  adults: number;
  kids: number;
  onChange: (next: { adults: number; children: number }) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const total = adults + kids;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("h-11 w-full justify-start gap-2 font-normal", className)}
        >
          <Users className="size-4 text-muted-foreground" />
          <span className="tnum">
            {total} {total === 1 ? t("common.person") : t("common.people")}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-4">
        <div className="flex items-center justify-between">
          <Label>{t("plan.adults")}</Label>
          <NumberStepper
            value={adults}
            min={1}
            max={20}
            label={t("plan.adults")}
            onChange={(v) => onChange({ adults: v, children: kids })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>{t("plan.children")}</Label>
          <NumberStepper
            value={kids}
            min={0}
            max={20}
            label={t("plan.children")}
            onChange={(v) => onChange({ adults, children: v })}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
