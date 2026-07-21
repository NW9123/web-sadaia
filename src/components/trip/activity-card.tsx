"use client";

import { useState } from "react";
import {
  Clock,
  ExternalLink,
  GripVertical,
  Lock,
  LockOpen,
  MapPin,
  MoreVertical,
  Navigation,
  Pencil,
  Repeat,
  Star,
  Trash2,
} from "lucide-react";
import type { Activity, Trip } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { getPlacesFor } from "@/data/places";
import { placeToActivity, findActivity, minutesToTime, timeToMinutes } from "@/lib/trip/itinerary";
import { convertStatic } from "@/data/currencies";
import { useI18n } from "@/lib/i18n/provider";
import { useTrips } from "@/features/trips/store";
import { cn } from "@/lib/utils";

export function ActivityCard({
  trip,
  activity,
  dayId,
  onFocusMap,
  dragHandleProps,
}: {
  trip: Trip;
  activity: Activity;
  dayId: string;
  onFocusMap?: (activityId: string) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  const { t, locale, fmt } = useI18n();
  const { mutate } = useTrips();
  const [editOpen, setEditOpen] = useState(false);
  const [editStart, setEditStart] = useState(activity.startTime);
  const [editDuration, setEditDuration] = useState(activity.durationMinutes);
  const [editCost, setEditCost] = useState(activity.estimatedCost);

  const toggleLock = () =>
    mutate(trip.id, (t2) => {
      const loc = findActivity(t2, activity.id);
      if (loc) loc.activity.isLocked = !loc.activity.isLocked;
    });

  const toggleOptional = () =>
    mutate(trip.id, (t2) => {
      const loc = findActivity(t2, activity.id);
      if (loc) loc.activity.isOptional = !loc.activity.isOptional;
    });

  const remove = () =>
    mutate(trip.id, (t2) => {
      for (const day of t2.days) {
        const i = day.activities.findIndex((a) => a.id === activity.id);
        if (i >= 0) {
          day.activities.splice(i, 1);
          break;
        }
      }
    });

  const moveTo = (targetDayId: string) =>
    mutate(trip.id, (t2) => {
      let moved: Activity | undefined;
      for (const day of t2.days) {
        const i = day.activities.findIndex((a) => a.id === activity.id);
        if (i >= 0) {
          [moved] = day.activities.splice(i, 1);
          break;
        }
      }
      const target = t2.days.find((d) => d.id === targetDayId);
      if (moved && target) target.activities.push(moved);
    });

  const replace = () =>
    mutate(trip.id, (t2) => {
      const used = new Set(t2.days.flatMap((d) => d.activities.map((a) => a.placeId).filter(Boolean)));
      const candidate = getPlacesFor(t2.destination.id).find(
        (p) => !used.has(p.id) && p.category === activity.category,
      );
      const loc = findActivity(t2, activity.id);
      if (candidate && loc) {
        const fresh = placeToActivity(candidate, {
          estimatedCost: Math.round(convertStatic(70, "SAR", t2.currency)),
        });
        loc.day.activities[loc.activityIndex] = { ...fresh, isLocked: activity.isLocked };
      }
    });

  const saveEdit = () => {
    mutate(trip.id, (t2) => {
      const loc = findActivity(t2, activity.id);
      if (loc) {
        loc.activity.startTime = editStart;
        loc.activity.durationMinutes = editDuration;
        loc.activity.endTime = minutesToTime(timeToMinutes(editStart) + editDuration);
        loc.activity.estimatedCost = editCost;
      }
    });
    setEditOpen(false);
  };

  return (
    <div
      className={cn(
        "group relative flex gap-3 rounded-2xl border bg-card p-3 transition-shadow hover:shadow-sm",
        activity.isOptional && "opacity-70",
      )}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl sm:size-24">
        <ImageWithFallback
          src={activity.imageUrl}
          alt={activity.name[locale]}
          category={activity.category}
          fill
          rounded="rounded-xl"
          sizes="96px"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h4 className="truncate font-semibold">{activity.name[locale]}</h4>
              {activity.isLocked && (
                <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px]">
                  <Lock className="size-2.5" /> {t("itinerary.locked")}
                </Badge>
              )}
              {activity.isOptional && (
                <Badge variant="muted" className="px-1.5 py-0 text-[10px]">
                  {t("itinerary.optionalBadge")}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" /> {activity.address[locale]}
            </p>
          </div>

          <div className="flex shrink-0 items-center">
            <button
              type="button"
              className="cursor-grab touch-none rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
              aria-label={t("itinerary.reorderHint")}
              {...dragHandleProps}
            >
              <GripVertical className="size-4" />
            </button>
            <ActivityMenu
              trip={trip}
              dayId={dayId}
              activity={activity}
              onEdit={() => setEditOpen(true)}
              onLock={toggleLock}
              onOptional={toggleOptional}
              onRemove={remove}
              onReplace={replace}
              onMove={moveTo}
            />
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-medium text-foreground tnum">
            <Clock className="size-3.5 text-secondary" />
            {fmt.time(activity.startTime)} – {fmt.time(activity.endTime)}
          </span>
          <span className="tnum">{fmt.duration(activity.durationMinutes)}</span>
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {t(`enums.category.${activity.category}`)}
          </Badge>
          {activity.rating ? (
            <span className="flex items-center gap-0.5 tnum">
              <Star className="size-3 fill-accent text-accent" /> {activity.rating.toFixed(1)}
            </span>
          ) : null}
          <span className="font-medium text-foreground tnum">
            {activity.estimatedCost > 0
              ? fmt.currency(activity.estimatedCost, trip.currency)
              : t("hotels.breakfastIncluded")}
          </span>
        </div>

        {activity.travelFromPrevious && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Navigation className="size-3" />
            {t("itinerary.travelFromPrev")}: {fmt.duration(activity.travelFromPrevious.minutes)} ·{" "}
            {fmt.distance(activity.travelFromPrevious.distanceKm)}
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => onFocusMap?.(activity.id)}>
            <MapPin className="size-3" /> {t("itinerary.viewOnMap")}
          </Button>
          {activity.bookingUrl && (
            <Button asChild variant="secondary" size="sm" className="h-7 gap-1 px-2 text-xs">
              <a href={activity.bookingUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3" /> {t("itinerary.book")}
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activity.name[locale]}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ed-start">{t("itinerary.startTime")}</Label>
              <Input id="ed-start" type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ed-dur">{t("itinerary.duration")} ({t("common.minutes")})</Label>
              <Input
                id="ed-dur"
                type="number"
                min={15}
                step={15}
                value={editDuration}
                onChange={(e) => setEditDuration(Number(e.target.value) || 15)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ed-cost">{t("itinerary.cost")} ({trip.currency})</Label>
              <Input
                id="ed-cost"
                type="number"
                min={0}
                value={editCost}
                onChange={(e) => setEditCost(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={saveEdit}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActivityMenu({
  trip,
  dayId,
  activity,
  onEdit,
  onLock,
  onOptional,
  onRemove,
  onReplace,
  onMove,
}: {
  trip: Trip;
  dayId: string;
  activity: Activity;
  onEdit: () => void;
  onLock: () => void;
  onOptional: () => void;
  onRemove: () => void;
  onReplace: () => void;
  onMove: (dayId: string) => void;
}) {
  const { t, locale } = useI18n();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={t("common.more")}>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="size-4" /> {t("common.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onReplace}>
          <Repeat className="size-4" /> {t("itinerary.replaceActivity")}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Navigation className="size-4" /> {t("itinerary.moveToDay")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {trip.days
              .filter((d) => d.id !== dayId)
              .map((d) => (
                <DropdownMenuItem key={d.id} onClick={() => onMove(d.id)}>
                  {t("itinerary.dayLabel", { n: d.dayNumber })} — {d.title[locale]}
                </DropdownMenuItem>
              ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={onOptional}>
          <Star className="size-4" />
          {activity.isOptional ? t("itinerary.optionalBadge") : t("itinerary.markOptional")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onLock}>
          {activity.isLocked ? <LockOpen className="size-4" /> : <Lock className="size-4" />}
          {activity.isLocked ? t("itinerary.unlock") : t("itinerary.lock")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={onRemove}>
          <Trash2 className="size-4" /> {t("itinerary.deleteActivity")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
