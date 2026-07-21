"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Client-only entry point for the real map. Leaflet touches `window`, so it is
 * loaded dynamically with SSR disabled; a skeleton holds the layout meanwhile.
 * The SVG MapPanel remains available as a provider-free fallback.
 */
export const TripMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => <Skeleton className="aspect-[16/11] w-full rounded-2xl" />,
});
