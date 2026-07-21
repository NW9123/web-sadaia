-- =============================================================================
-- TripMind — 0002_rls.sql
-- Row Level Security for every table.
--
-- Access model
--   * profiles          : owner-only read/update; admins read all.
--   * destinations/places: public read catalog; admin-only writes.
--   * trips             : owner full access; collaborators read (+ editors write);
--                         anyone reads when is_public (share links); admins read all.
--   * trip child tables : gated by the parent trip via can_read_trip / can_edit_trip.
--   * trip_collaborators: trip owner manages; a user sees their own membership.
--
-- Recursion safety
--   Cross-table checks are wrapped in SECURITY DEFINER helper functions. Because
--   those functions run as their owner (the table owner in Supabase, who bypasses
--   RLS), the predicates never re-enter another table's policies — this avoids
--   "infinite recursion detected in policy" between trips <-> trip_collaborators.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER, stable). search_path pinned for safety.
-- -----------------------------------------------------------------------------

-- True when the current user has an admin profile.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- True when the current user owns the given trip.
create or replace function public.is_trip_owner(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trips t
    where t.id = p_trip_id and t.owner_id = auth.uid()
  );
$$;

-- True when the current user may READ the trip:
-- owner, OR public (share link), OR any collaborator, OR admin.
create or replace function public.can_read_trip(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trips t
    where t.id = p_trip_id
      and (
        t.owner_id = auth.uid()
        or t.is_public
        or exists (
          select 1 from public.trip_collaborators c
          where c.trip_id = t.id and c.user_id = auth.uid()
        )
        or public.is_admin()
      )
  );
$$;

-- True when the current user may WRITE the trip:
-- owner, OR an 'editor' collaborator, OR admin.
create or replace function public.can_edit_trip(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trips t
    where t.id = p_trip_id
      and (
        t.owner_id = auth.uid()
        or exists (
          select 1 from public.trip_collaborators c
          where c.trip_id = t.id
            and c.user_id = auth.uid()
            and c.role = 'editor'
        )
        or public.is_admin()
      )
  );
$$;

-- =============================================================================
-- Enable RLS on ALL tables.
-- =============================================================================
alter table public.profiles           enable row level security;
alter table public.destinations       enable row level security;
alter table public.places             enable row level security;
alter table public.trips              enable row level security;
alter table public.trip_preferences   enable row level security;
alter table public.trip_days          enable row level security;
alter table public.activities         enable row level security;
alter table public.hotels             enable row level security;
alter table public.trip_hotels        enable row level security;
alter table public.flights            enable row level security;
alter table public.trip_flights       enable row level security;
alter table public.budget_items       enable row level security;
alter table public.saved_places       enable row level security;
alter table public.trip_collaborators enable row level security;
alter table public.trip_ai_messages   enable row level security;
alter table public.trip_versions      enable row level security;

-- =============================================================================
-- profiles
-- =============================================================================
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- =============================================================================
-- destinations & places — public read, admin-only write.
-- (A separate SELECT-true policy is OR-combined with the admin ALL policy, so
--  reads stay open to everyone while writes require an admin.)
-- =============================================================================
drop policy if exists destinations_read on public.destinations;
create policy destinations_read on public.destinations
  for select using (true);

drop policy if exists destinations_admin_write on public.destinations;
create policy destinations_admin_write on public.destinations
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists places_read on public.places;
create policy places_read on public.places
  for select using (true);

drop policy if exists places_admin_write on public.places;
create policy places_admin_write on public.places
  for all using (public.is_admin()) with check (public.is_admin());

-- =============================================================================
-- trips
-- =============================================================================
drop policy if exists trips_select on public.trips;
create policy trips_select on public.trips
  for select using (public.can_read_trip(id));

drop policy if exists trips_insert on public.trips;
create policy trips_insert on public.trips
  for insert with check (owner_id = auth.uid());

drop policy if exists trips_update on public.trips;
create policy trips_update on public.trips
  for update using (public.can_edit_trip(id)) with check (public.can_edit_trip(id));

-- Only the owner (or an admin) may delete a trip — editors cannot.
drop policy if exists trips_delete on public.trips;
create policy trips_delete on public.trips
  for delete using (owner_id = auth.uid() or public.is_admin());

-- =============================================================================
-- trip_collaborators — owner manages; a user can see their own membership.
-- =============================================================================
drop policy if exists trip_collaborators_select on public.trip_collaborators;
create policy trip_collaborators_select on public.trip_collaborators
  for select using (
    user_id = auth.uid()
    or public.is_trip_owner(trip_id)
    or public.is_admin()
  );

drop policy if exists trip_collaborators_manage on public.trip_collaborators;
create policy trip_collaborators_manage on public.trip_collaborators
  for all
  using (public.is_trip_owner(trip_id) or public.is_admin())
  with check (public.is_trip_owner(trip_id) or public.is_admin());

-- =============================================================================
-- Trip child tables — uniform, parent-gated policies.
--   SELECT : can_read_trip(trip_id)   (owner / collaborator / public / admin)
--   INSERT : can_edit_trip(trip_id)   (owner / editor / admin)
--   UPDATE : can_edit_trip(trip_id)
--   DELETE : can_edit_trip(trip_id)
-- Generated in a loop so every table gets exactly the same, audited predicate.
-- =============================================================================
do $$
declare
  tbl text;
  child_tables text[] := array[
    'trip_preferences','trip_days','activities','hotels','trip_hotels',
    'flights','trip_flights','budget_items','saved_places',
    'trip_ai_messages','trip_versions'
  ];
begin
  foreach tbl in array child_tables loop
    -- SELECT
    execute format('drop policy if exists %I on public.%I', tbl || '_select', tbl);
    execute format(
      'create policy %I on public.%I for select using (public.can_read_trip(trip_id))',
      tbl || '_select', tbl);

    -- INSERT
    execute format('drop policy if exists %I on public.%I', tbl || '_insert', tbl);
    execute format(
      'create policy %I on public.%I for insert with check (public.can_edit_trip(trip_id))',
      tbl || '_insert', tbl);

    -- UPDATE
    execute format('drop policy if exists %I on public.%I', tbl || '_update', tbl);
    execute format(
      'create policy %I on public.%I for update using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id))',
      tbl || '_update', tbl);

    -- DELETE
    execute format('drop policy if exists %I on public.%I', tbl || '_delete', tbl);
    execute format(
      'create policy %I on public.%I for delete using (public.can_edit_trip(trip_id))',
      tbl || '_delete', tbl);
  end loop;
end $$;

-- =============================================================================
-- Role grants. RLS decides which ROWS are visible; grants decide which VERBS a
-- role may attempt. Supabase exposes anon (unauthenticated) and authenticated.
--   anon          -> read only (public trips + catalog + share links)
--   authenticated -> full DML (still constrained row-by-row by the policies)
-- =============================================================================
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to anon, authenticated;

-- =============================================================================
-- End of 0002_rls.sql
-- =============================================================================
