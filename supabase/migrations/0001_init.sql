-- =============================================================================
-- TripMind — 0001_init.sql
-- Core schema for the AI travel-planning app.
--
-- Design notes
--   * Column names mirror the TypeScript domain model in src/types/*.ts.
--     Bilingual fields are split into `<field>_ar` / `<field>_en` (see the
--     `Localized` interface). Coordinates are stored as `lat` / `lng`.
--   * Domain enums from src/types/enums.ts are enforced with CHECK constraints
--     (or reusable DOMAINs when a value type is shared across several tables).
--   * Everything is idempotent: `create table if not exists`, guarded domains,
--     `create or replace function`, and `drop trigger if exists` before create.
--   * Targets Supabase Postgres: uses auth.users, auth.uid() (in RLS) and
--     gen_random_uuid().
-- =============================================================================

-- gen_random_uuid() lives in pgcrypto on older engines; harmless if already core.
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Reusable enum-style DOMAINs (used by more than one table)
--   currency_code  -> CURRENCIES
--   place_category -> PLACE_CATEGORIES
-- Single-use enums are enforced inline with CHECK constraints on their table.
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'currency_code') then
    create domain public.currency_code as text
      check (value in ('SAR','USD','AED','EUR','GBP','TRY','KWD','QAR','BHD','OMR'));
  end if;

  if not exists (select 1 from pg_type where typname = 'place_category') then
    create domain public.place_category as text
      check (value in (
        'attraction','restaurant','cafe','activity','shopping','museum',
        'nature','beach','entertainment','landmark','transport','hotel'
      ));
  end if;
end $$;

-- =============================================================================
-- TABLES (declared in dependency order)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles — one row per auth user; app-level preferences & defaults.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text,
  full_name         text,
  avatar_url        text,
  role              text not null default 'user' check (role in ('user','admin')),
  locale            text not null default 'ar'  check (locale in ('ar','en')),
  currency          public.currency_code not null default 'SAR',
  home_city         text,
  default_adults    int  not null default 2,
  default_children  int  not null default 0,
  -- default_style -> TRAVEL_STYLES, default_pace -> PACES (both optional hints)
  default_style     text check (default_style in (
                       'family','honeymoon','relaxation','adventure','shopping',
                       'nature','culture','entertainment','budget','luxury','friends')),
  default_pace      text check (default_pace in ('relaxed','balanced','intensive')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- destinations — public catalog of cities (Destination).
-- -----------------------------------------------------------------------------
create table if not exists public.destinations (
  id                text primary key,
  city_ar           text,
  city_en           text,
  country_ar        text,
  country_en        text,
  country_code      text,
  lat               double precision,
  lng               double precision,
  image_url         text,
  avg_daily_cost    numeric,               -- per-person estimate, in `currency`
  currency          public.currency_code default 'SAR',
  flight_time_hours numeric,
  weather           text check (weather in ('warm','mild','cool','any')), -- WEATHER_PREFERENCES
  best_seasons_ar   text,
  best_seasons_en   text,
  description_ar    text,
  description_en    text,
  popularity        int not null default 0, -- 0–100 default ordering
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- places — public catalog of points of interest (Place). The only entities the
-- AI may schedule. FK to destinations; cascades when a destination is removed.
-- -----------------------------------------------------------------------------
create table if not exists public.places (
  id                text primary key,
  destination_id    text not null references public.destinations(id) on delete cascade,
  name_ar           text,
  name_en           text,
  category          public.place_category, -- PLACE_CATEGORIES
  description_ar    text,
  description_en    text,
  address_ar        text,
  address_en        text,
  lat               double precision,
  lng               double precision,
  rating            numeric,
  review_count      int,
  price_level       int check (price_level between 1 and 4), -- 1 cheap – 4 pricey
  image_url         text,
  tags              text[],                 -- INTERESTS[]
  website           text,
  opening_hours_ar  text,
  opening_hours_en  text,
  is_active         boolean not null default true,
  source            text not null default 'demo', -- DataMeta.source
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- trips — the aggregate root. Owned by an auth user; may be shared publicly.
-- Denormalised destination snapshot so a trip survives catalog changes.
-- -----------------------------------------------------------------------------
create table if not exists public.trips (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null references auth.users(id) on delete cascade,
  title                 text,
  origin_city_ar        text,
  origin_city_en        text,
  destination_id        text references public.destinations(id) on delete set null,
  dest_city_ar          text,
  dest_city_en          text,
  dest_country_ar       text,
  dest_country_en       text,
  dest_lat              double precision,
  dest_lng              double precision,
  departure_date        date,
  return_date           date,
  adults                int not null default 2,
  children              int not null default 0,
  budget                numeric,
  currency              public.currency_code not null default 'SAR',
  status                text not null default 'draft'
                          check (status in ('draft','upcoming','ongoing','past')), -- TRIP_STATUSES
  summary_ar            text,
  summary_en            text,
  notes                 text not null default '',
  selected_hotel_id     text,
  selected_outbound_id  text,
  selected_return_id    text,
  is_public             boolean not null default false,
  share_id              text unique,        -- share-link token (unique index provided by constraint)
  version               int not null default 1,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint trips_dates_chk
    check (return_date is null or departure_date is null or return_date >= departure_date)
);

-- -----------------------------------------------------------------------------
-- trip_preferences — 1:1 with trips (TripPreferences).
-- -----------------------------------------------------------------------------
create table if not exists public.trip_preferences (
  trip_id              uuid primary key references public.trips(id) on delete cascade,
  styles               text[] not null default '{}', -- TRAVEL_STYLES[]
  interests            text[] not null default '{}', -- INTERESTS[]
  pace                 text check (pace in ('relaxed','balanced','intensive')),           -- PACES
  hotel_level          text check (hotel_level in
                         ('budget','three','four','five','apartment','resort','any')),    -- HOTEL_LEVELS
  transport            text check (transport in
                         ('public','rental','taxi','walking','mixed')),                   -- TRANSPORT_MODES
  spending_level       text check (spending_level in ('low','medium','high')),            -- SPENDING_LEVELS
  include_flights      boolean not null default true,
  include_hotels       boolean not null default true,
  special_requirements text
);

-- -----------------------------------------------------------------------------
-- trip_days — ordered days within a trip (TripDay). weather stored as JSON.
-- -----------------------------------------------------------------------------
create table if not exists public.trip_days (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  day_number  int not null,
  date        date,
  title_ar    text,
  title_en    text,
  summary_ar  text,
  summary_en  text,
  weather     jsonb,          -- WeatherInfo
  created_at  timestamptz not null default now(),
  unique (trip_id, day_number)
);

-- -----------------------------------------------------------------------------
-- activities — scheduled itinerary items (Activity). Belong to a day and,
-- denormalised, to a trip (for trip-scoped RLS and queries).
-- -----------------------------------------------------------------------------
create table if not exists public.activities (
  id                uuid primary key default gen_random_uuid(),
  day_id            uuid not null references public.trip_days(id) on delete cascade,
  trip_id           uuid not null references public.trips(id) on delete cascade,
  place_id          text,               -- optional link back to a catalog Place
  name_ar           text,
  name_en           text,
  category          public.place_category,
  description_ar    text,
  description_en    text,
  address_ar        text,
  address_en        text,
  lat               double precision,
  lng               double precision,
  image_url         text,
  start_time        time,               -- "HH:mm" local
  end_time          time,
  duration_minutes  int,
  estimated_cost    numeric,            -- whole-party cost in trip currency
  rating            numeric,
  travel_from_prev  jsonb,              -- TravelLeg (minutes/distanceKm/method)
  opening_status    text check (opening_status in ('open','closed','unknown')), -- OpeningStatus
  booking_url       text,
  reason_ar         text,
  reason_en         text,
  tags              text[],
  is_locked         boolean not null default false,
  is_optional       boolean not null default false,
  sort_order        int not null default 0,
  source            text not null default 'demo',
  created_at        timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- hotels — candidate hotels attached to a trip (Hotel).
-- -----------------------------------------------------------------------------
create table if not exists public.hotels (
  id                      text primary key,
  trip_id                 uuid not null references public.trips(id) on delete cascade,
  name_ar                 text,
  name_en                 text,
  stars                   int check (stars between 1 and 5),
  rating                  numeric,
  review_count            int,
  location_ar             text,
  location_en             text,
  lat                     double precision,
  lng                     double precision,
  distance_center_km      numeric,
  distance_attractions_km numeric,
  nightly_price           numeric,
  currency                public.currency_code default 'SAR',
  breakfast_included      boolean,
  free_cancellation       boolean,
  amenities               text[],
  images                  text[],
  booking_url             text,
  recommendation          text check (recommendation in
                            ('overall','budget','family','location','luxury')), -- HOTEL_RECOMMENDATIONS
  reason_ar               text,
  reason_en               text,
  created_at              timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- trip_hotels — selection join table (which hotels are shortlisted/selected).
-- -----------------------------------------------------------------------------
create table if not exists public.trip_hotels (
  trip_id     uuid not null references public.trips(id) on delete cascade,
  hotel_id    text not null references public.hotels(id) on delete cascade,
  is_selected boolean not null default false,
  primary key (trip_id, hotel_id)
);

-- -----------------------------------------------------------------------------
-- flights — candidate flights attached to a trip (Flight).
-- -----------------------------------------------------------------------------
create table if not exists public.flights (
  id                  text primary key,
  trip_id             uuid not null references public.trips(id) on delete cascade,
  airline_ar          text,
  airline_en          text,
  airline_code        text,
  origin_airport      text,
  destination_airport text,
  depart_at           timestamptz,
  arrive_at           timestamptz,
  duration_minutes    int,
  stops               int,
  baggage_included    boolean,
  price               numeric,
  currency            public.currency_code default 'SAR',
  booking_url         text,
  recommendation      text check (recommendation in
                        ('cheapest','fastest','bestValue','bestArrival','family')), -- FLIGHT_RECOMMENDATIONS
  direction           text check (direction in ('outbound','return')),              -- FlightDirection
  created_at          timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- trip_flights — selection join table (outbound/return chosen flights).
-- -----------------------------------------------------------------------------
create table if not exists public.trip_flights (
  trip_id     uuid not null references public.trips(id) on delete cascade,
  flight_id   text not null references public.flights(id) on delete cascade,
  direction   text check (direction in ('outbound','return')),
  is_selected boolean not null default false,
  primary key (trip_id, flight_id)
);

-- -----------------------------------------------------------------------------
-- budget_items — per-category budget lines (BudgetItem). One row per category.
-- -----------------------------------------------------------------------------
create table if not exists public.budget_items (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references public.trips(id) on delete cascade,
  category     text not null check (category in
                 ('flights','hotel','transport','food','activities',
                  'shopping','visa','insurance','other','reserve')), -- BUDGET_CATEGORIES
  amount       numeric not null default 0,
  is_estimated boolean not null default true,
  unique (trip_id, category)
);

-- -----------------------------------------------------------------------------
-- saved_places — places a user bookmarked on a trip (Trip.savedPlaces).
-- -----------------------------------------------------------------------------
create table if not exists public.saved_places (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips(id) on delete cascade,
  place_id   text not null,
  created_at timestamptz not null default now(),
  unique (trip_id, place_id)
);

-- -----------------------------------------------------------------------------
-- trip_collaborators — shared editing/viewing access to a trip.
-- -----------------------------------------------------------------------------
create table if not exists public.trip_collaborators (
  trip_id    uuid not null references public.trips(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'viewer' check (role in ('viewer','editor')),
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

-- -----------------------------------------------------------------------------
-- trip_ai_messages — chat log of the AI itinerary assistant (AiMessage).
-- -----------------------------------------------------------------------------
create table if not exists public.trip_ai_messages (
  id                   uuid primary key default gen_random_uuid(),
  trip_id              uuid not null references public.trips(id) on delete cascade,
  user_id              uuid references auth.users(id) on delete set null,
  role                 text check (role in ('user','assistant')), -- AiMessageRole
  content              text,
  modification_summary text,
  created_at           timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- trip_versions — immutable snapshots for undo/restore (TripVersion).
-- -----------------------------------------------------------------------------
create table if not exists public.trip_versions (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  version     int not null,
  author      text check (author in ('user','ai')), -- VersionAuthor
  summary_ar  text,
  summary_en  text,
  snapshot    jsonb,          -- full Trip snapshot to restore from
  created_at  timestamptz not null default now()
);

-- =============================================================================
-- INDEXES — targeted at the app's hot query paths.
-- =============================================================================
create index if not exists idx_trips_owner             on public.trips(owner_id);
create index if not exists idx_trips_status            on public.trips(status);
-- trips(share_id): the UNIQUE constraint above already creates a unique index,
-- which serves share-link lookups, so no separate index is needed here.
create index if not exists idx_trip_days_trip          on public.trip_days(trip_id);
create index if not exists idx_activities_day          on public.activities(day_id);
create index if not exists idx_activities_trip         on public.activities(trip_id);
create index if not exists idx_places_destination      on public.places(destination_id);
create index if not exists idx_budget_items_trip       on public.budget_items(trip_id);
create index if not exists idx_trip_collaborators_user on public.trip_collaborators(user_id);
create index if not exists idx_saved_places_trip       on public.saved_places(trip_id);
create index if not exists idx_trip_ai_messages_trip   on public.trip_ai_messages(trip_id);
-- A few extra parent->child lookups the UI relies on:
create index if not exists idx_hotels_trip             on public.hotels(trip_id);
create index if not exists idx_flights_trip            on public.flights(trip_id);
create index if not exists idx_trip_versions_trip      on public.trip_versions(trip_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Reusable BEFORE UPDATE trigger to keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Attach set_updated_at to every table that carries an updated_at column.
drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.destinations;
create trigger set_updated_at before update on public.destinations
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.places;
create trigger set_updated_at before update on public.places
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.trips;
create trigger set_updated_at before update on public.trips
  for each row execute function public.set_updated_at();

-- Auto-provision a profile row when a new auth user signs up.
-- SECURITY DEFINER so the insert runs regardless of the caller's RLS context.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- End of 0001_init.sql
-- =============================================================================
