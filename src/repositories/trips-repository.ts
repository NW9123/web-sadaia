import type { Trip } from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/config/env";

/**
 * Trip persistence contract. The demo app uses the client-side store
 * (localStorage) as its data layer; this repository is the production path that
 * reads/writes Supabase behind the SAME interface. Selected via a factory so
 * services never depend on a concrete backend.
 */
export interface TripsRepository {
  readonly id: string;
  listByOwner(ownerId: string): Promise<Trip[]>;
  get(tripId: string): Promise<Trip | null>;
  getByShareId(shareId: string): Promise<Trip | null>;
  create(trip: Trip): Promise<Trip>;
  update(trip: Trip): Promise<Trip>;
  remove(tripId: string): Promise<void>;
  setPublic(tripId: string, isPublic: boolean): Promise<void>;
}

/**
 * Supabase-backed repository.
 *
 * The full row<->domain mapping for the normalized schema (trips + trip_days +
 * activities + hotels + flights + budget_items…) is intentionally left as a
 * documented extension point — persisting the top-level trip is shown here; the
 * nested collections follow the same pattern against the tables created in
 * supabase/migrations. RLS (supabase/migrations/0002_rls.sql) enforces access
 * server-side, so this never relies on client checks.
 */
class SupabaseTripsRepository implements TripsRepository {
  readonly id = "supabase";

  private async client() {
    const client = await createSupabaseServerClient();
    if (!client) throw new Error("Supabase not configured");
    return client;
  }

  async listByOwner(ownerId: string): Promise<Trip[]> {
    const supabase = await this.client();
    const { data, error } = await supabase.from("trips").select("*").eq("owner_id", ownerId);
    if (error) throw error;
    // TODO: hydrate nested days/activities/hotels/flights from their tables.
    return (data ?? []) as unknown as Trip[];
  }

  async get(tripId: string): Promise<Trip | null> {
    const supabase = await this.client();
    const { data } = await supabase.from("trips").select("*").eq("id", tripId).maybeSingle();
    return (data as unknown as Trip) ?? null;
  }

  async getByShareId(shareId: string): Promise<Trip | null> {
    const supabase = await this.client();
    const { data } = await supabase
      .from("trips")
      .select("*")
      .eq("share_id", shareId)
      .eq("is_public", true)
      .maybeSingle();
    return (data as unknown as Trip) ?? null;
  }

  async create(trip: Trip): Promise<Trip> {
    const supabase = await this.client();
    const { error } = await supabase.from("trips").insert({ id: trip.id, owner_id: trip.ownerId, title: trip.title });
    if (error) throw error;
    return trip;
  }

  async update(trip: Trip): Promise<Trip> {
    const supabase = await this.client();
    await supabase.from("trips").update({ title: trip.title, is_public: trip.isPublic, version: trip.version }).eq("id", trip.id);
    return trip;
  }

  async remove(tripId: string): Promise<void> {
    const supabase = await this.client();
    await supabase.from("trips").delete().eq("id", tripId);
  }

  async setPublic(tripId: string, isPublic: boolean): Promise<void> {
    const supabase = await this.client();
    await supabase.from("trips").update({ is_public: isPublic }).eq("id", tripId);
  }
}

/**
 * Returns the Supabase repository when configured, otherwise null — signalling
 * callers to fall back to the local (client store) data layer.
 */
export function getTripsRepository(): TripsRepository | null {
  return isSupabaseConfigured ? new SupabaseTripsRepository() : null;
}
