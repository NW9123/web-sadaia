"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Localized, Place, Trip, TripVersion, VersionAuthor } from "@/types";
import type { ValidatedModification } from "@/lib/validation/ai";
import { demoTrips } from "@/data/demoTrips";
import { applyModifications } from "@/lib/ai/apply";
import { computeBudget } from "@/lib/trip/budget";
import { localId } from "@/lib/utils";

const STORAGE_KEY = "tripmind.trips.v1";
const VERSIONS_KEY = "tripmind.versions.v1";
const MAX_VERSIONS = 25;

export type SaveStatus = "saved" | "saving" | "unsaved";

interface TripStoreValue {
  trips: Trip[];
  ready: boolean;
  saveStatus: SaveStatus;
  getTrip: (id: string) => Trip | undefined;
  createTrip: (trip: Trip) => void;
  deleteTrip: (id: string) => void;
  duplicateTrip: (id: string) => string | undefined;
  /** Update a trip; optionally snapshot the pre-edit state as a version. */
  updateTrip: (
    id: string,
    updater: (trip: Trip) => Trip,
    version?: { author: VersionAuthor; summary: Localized },
  ) => void;
  applyAi: (
    id: string,
    mods: ValidatedModification[],
    summary: Localized,
  ) => void;
  /** Mutate the itinerary directly (drag/lock/delete) and recompute times+budget. */
  mutate: (id: string, updater: (trip: Trip) => void, version?: { author: VersionAuthor; summary: Localized }) => void;
  toggleSavedPlace: (id: string, place: Place) => void;
  setNotes: (id: string, notes: string) => void;
  selectHotel: (id: string, hotelId: string) => void;
  selectFlight: (id: string, flightId: string, direction: "outbound" | "return") => void;
  setPublic: (id: string, isPublic: boolean) => void;
  versionsFor: (id: string) => TripVersion[];
  restoreVersion: (tripId: string, versionId: string) => void;
}

const TripStoreContext = createContext<TripStoreValue | null>(null);

function seedTrips(): Trip[] {
  return demoTrips.map((t) => structuredClone(t));
}

export function TripStoreProvider({ children }: { children: React.ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [versions, setVersions] = useState<Record<string, TripVersion[]>>({});
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage (falling back to the seeded demo trips).
  useEffect(() => {
    try {
      const rawTrips = localStorage.getItem(STORAGE_KEY);
      const rawVersions = localStorage.getItem(VERSIONS_KEY);
      setTrips(rawTrips ? (JSON.parse(rawTrips) as Trip[]) : seedTrips());
      setVersions(rawVersions ? (JSON.parse(rawVersions) as Record<string, TripVersion[]>) : {});
    } catch {
      setTrips(seedTrips());
    } finally {
      setReady(true);
    }
  }, []);

  // Persist whenever data changes (after hydration).
  useEffect(() => {
    if (!ready) return;
    setSaveStatus("saving");
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
    } catch {
      /* storage may be full/unavailable; keep in-memory state */
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveStatus("saved"), 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [trips, versions, ready]);

  const getTrip = useCallback((id: string) => trips.find((t) => t.id === id), [trips]);

  const pushVersion = useCallback((trip: Trip, author: VersionAuthor, summary: Localized) => {
    setVersions((prev) => {
      const list = prev[trip.id] ?? [];
      const version: TripVersion = {
        id: localId("ver"),
        tripId: trip.id,
        version: trip.version,
        createdAtISO: new Date().toISOString(),
        author,
        summary,
        snapshot: structuredClone(trip),
      };
      return { ...prev, [trip.id]: [version, ...list].slice(0, MAX_VERSIONS) };
    });
  }, []);

  const updateTrip = useCallback<TripStoreValue["updateTrip"]>(
    (id, updater, version) => {
      setTrips((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          if (version) pushVersion(t, version.author, version.summary);
          const next = updater(structuredClone(t));
          next.updatedAtISO = new Date().toISOString();
          if (version) next.version = t.version + 1;
          return next;
        }),
      );
    },
    [pushVersion],
  );

  const applyAi = useCallback<TripStoreValue["applyAi"]>(
    (id, mods, summary) => {
      updateTrip(id, (trip) => applyModifications(trip, mods), { author: "ai", summary });
    },
    [updateTrip],
  );

  const mutate = useCallback<TripStoreValue["mutate"]>(
    (id, updater, version) => {
      updateTrip(
        id,
        (trip) => {
          updater(trip);
          // Recompute derived times/legs/budget after a direct edit.
          return applyModifications(trip, []);
        },
        version,
      );
    },
    [updateTrip],
  );

  const createTrip = useCallback((trip: Trip) => {
    setTrips((prev) => [trip, ...prev.filter((t) => t.id !== trip.id)]);
  }, []);

  const deleteTrip = useCallback((id: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const duplicateTrip = useCallback(
    (id: string): string | undefined => {
      const original = trips.find((t) => t.id === id);
      if (!original) return undefined;
      const newId = localId("trip");
      const copy: Trip = {
        ...structuredClone(original),
        id: newId,
        title: `${original.title} (نسخة)`,
        status: "draft",
        shareId: `shr-${newId}`,
        isPublic: false,
        version: 1,
        createdAtISO: new Date().toISOString(),
        updatedAtISO: new Date().toISOString(),
      };
      setTrips((prev) => [copy, ...prev]);
      return newId;
    },
    [trips],
  );

  const toggleSavedPlace = useCallback<TripStoreValue["toggleSavedPlace"]>(
    (id, place) => {
      updateTrip(id, (trip) => {
        const exists = trip.savedPlaces.some((p) => p.id === place.id);
        return {
          ...trip,
          savedPlaces: exists
            ? trip.savedPlaces.filter((p) => p.id !== place.id)
            : [...trip.savedPlaces, place],
        };
      });
    },
    [updateTrip],
  );

  const setNotes = useCallback<TripStoreValue["setNotes"]>(
    (id, notes) => updateTrip(id, (trip) => ({ ...trip, notes })),
    [updateTrip],
  );

  const selectHotel = useCallback<TripStoreValue["selectHotel"]>(
    (id, hotelId) =>
      updateTrip(id, (trip) => {
        const next = { ...trip, selectedHotelId: hotelId };
        next.budgetBreakdown = computeBudget(next);
        return next;
      }),
    [updateTrip],
  );

  const selectFlight = useCallback<TripStoreValue["selectFlight"]>(
    (id, flightId, direction) =>
      updateTrip(id, (trip) => {
        const next =
          direction === "outbound"
            ? { ...trip, selectedOutboundId: flightId }
            : { ...trip, selectedReturnId: flightId };
        next.budgetBreakdown = computeBudget(next);
        return next;
      }),
    [updateTrip],
  );

  const setPublic = useCallback<TripStoreValue["setPublic"]>(
    (id, isPublic) => updateTrip(id, (trip) => ({ ...trip, isPublic })),
    [updateTrip],
  );

  const versionsFor = useCallback((id: string) => versions[id] ?? [], [versions]);

  const restoreVersion = useCallback<TripStoreValue["restoreVersion"]>(
    (tripId, versionId) => {
      const list = versions[tripId] ?? [];
      const version = list.find((v) => v.id === versionId);
      if (!version) return;
      setTrips((prev) =>
        prev.map((t) =>
          t.id === tripId
            ? { ...structuredClone(version.snapshot), version: t.version + 1, updatedAtISO: new Date().toISOString() }
            : t,
        ),
      );
    },
    [versions],
  );

  const value = useMemo<TripStoreValue>(
    () => ({
      trips,
      ready,
      saveStatus,
      getTrip,
      createTrip,
      deleteTrip,
      duplicateTrip,
      updateTrip,
      applyAi,
      mutate,
      toggleSavedPlace,
      setNotes,
      selectHotel,
      selectFlight,
      setPublic,
      versionsFor,
      restoreVersion,
    }),
    [
      trips,
      ready,
      saveStatus,
      getTrip,
      createTrip,
      deleteTrip,
      duplicateTrip,
      updateTrip,
      applyAi,
      mutate,
      toggleSavedPlace,
      setNotes,
      selectHotel,
      selectFlight,
      setPublic,
      versionsFor,
      restoreVersion,
    ],
  );

  return <TripStoreContext.Provider value={value}>{children}</TripStoreContext.Provider>;
}

export function useTrips(): TripStoreValue {
  const ctx = useContext(TripStoreContext);
  if (!ctx) throw new Error("useTrips must be used within a TripStoreProvider");
  return ctx;
}
