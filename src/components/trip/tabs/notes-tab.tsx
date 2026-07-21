"use client";

import { useEffect, useState } from "react";
import { Check, Save } from "lucide-react";
import type { Trip } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n/provider";
import { useTrips } from "@/features/trips/store";

export function NotesTab({ trip }: { trip: Trip }) {
  const { t } = useI18n();
  const { setNotes } = useTrips();
  const [value, setValue] = useState(trip.notes);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    setValue(trip.notes);
  }, [trip.id, trip.notes]);

  const save = () => {
    setNotes(trip.id, value);
    setSaved(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t("notes.title")}</h2>
        <Button size="sm" onClick={save} disabled={saved} className="gap-1.5">
          {saved ? <Check className="size-4" /> : <Save className="size-4" />}
          {saved ? t("common.saved") : t("notes.saveNote")}
        </Button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        placeholder={t("notes.placeholder")}
        rows={12}
        className="resize-y"
      />
    </div>
  );
}
