"use client";

import { History, RotateCcw, Undo2 } from "lucide-react";
import type { Trip } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/states";
import { useI18n } from "@/lib/i18n/provider";
import { useTrips } from "@/features/trips/store";

export function VersionHistory({ trip }: { trip: Trip }) {
  const { t, locale, fmt } = useI18n();
  const { versionsFor, restoreVersion } = useTrips();
  const versions = versionsFor(trip.id);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5"
        disabled={versions.length === 0}
        onClick={() => versions[0] && restoreVersion(trip.id, versions[0].id)}
      >
        <Undo2 className="size-4" />
        <span className="hidden sm:inline">{t("versions.undo")}</span>
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="size-9" aria-label={t("versions.title")}>
            <History className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="border-b p-3">
            <p className="text-sm font-semibold">{t("versions.title")}</p>
          </div>
          <ScrollArea className="max-h-80">
            {versions.length === 0 ? (
              <EmptyState icon={History} title={t("versions.empty")} className="m-3 border-0 p-6" />
            ) : (
              <ul className="divide-y">
                {versions.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{v.summary[locale]}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.author === "ai" ? t("versions.byAi") : t("versions.byUser")} ·{" "}
                        <span className="tnum">{fmt.date(v.createdAtISO, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1"
                      onClick={() => restoreVersion(trip.id, v.id)}
                    >
                      <RotateCcw className="size-3.5" />
                      {t("versions.restore")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
