# TripMind — مخطط رحلات ذكي / AI Travel Planner

> **TripMind** is a production-quality, **Arabic-first** (RTL) travel‑planning web app. It generates a complete personalized itinerary — daily plan, attractions, restaurants, activities, flights, hotels, budget, and a map — from a few inputs, and lets you **edit the itinerary with natural language** ("احذف المتاحف", "reduce cost by 20%", "أضف يوم تسوق") where the AI returns **structured, validated operations** that mutate the real trip data.

The product name is a temporary placeholder and can be changed from a single file — see [Rebranding](#rebranding).

The app runs **fully in demo mode with zero configuration**: every external integration (AI, places, flights, hotels, weather, currency, maps) falls back to a deterministic mock provider with realistic Arabic demo data. Add credentials to switch a provider to a real adapter.

---

## ✨ Features

- **Arabic‑first, bilingual (AR/EN)** with full **RTL**, translation dictionaries (no hardcoded UI strings), logical CSS, and locale‑aware number/date/currency/duration formatting.
- **Landing page** — hero with an in‑hero planning form, suggested destinations, how‑it‑works, example itinerary, features, CTA.
- **Discover** (`/discover`) — destination recommendations with filters (budget, duration, weather, flight time, style, interests), match scoring, and side‑by‑side comparison.
- **Trip wizard** (`/plan`) — 5‑step flow (destination → dates/travelers → budget → preferences → review) with validation, progress, draft persistence, an unsaved‑changes guard, and a polished **generation screen** (real pipeline stages, no fake percentage).
- **Trips dashboard** (`/trips`) — upcoming / drafts / past tabs, search, duplicate, delete.
- **Trip workspace** (`/trips/[tripId]`) — the core screen: sticky summary, 8 tabs (Overview · Itinerary · Map · Flights · Hotels · Budget · Saved · Notes), and an AI assistant side panel (desktop) / floating drawer (mobile).
  - **Itinerary**: per‑day cards with weather + daily cost; rich activity cards (image, time, duration, cost, rating, travel time from previous, transport, category); edit, move between days, replace, delete, **lock** (protect from AI edits), mark **optional**, and **drag‑to‑reorder**.
  - **Map**: provider‑agnostic SVG panel — hotel + activity markers, per‑day colored routes, click‑to‑select (two‑way with the itinerary), day toggles, fit‑all, route distance/time.
  - **Flights / Hotels**: recommendation‑ranked cards (cheapest, fastest, best value, best arrival, family / overall, budget, family, location, luxury) with selectable options.
  - **Budget**: Recharts breakdown + daily‑spending charts, category detail, min/max band, and **actionable over‑budget suggestions** that really change the plan.
- **AI assistant** — natural‑language editing (AR + EN). Returns a **`TripModification[]`** union, **validated with Zod** before anything is applied, with a **preview** (added / removed / moved / cost Δ / time Δ) and a confirm step for destructive changes.
- **Trip versioning** — every AI edit snapshots a version; **undo** and **restore** from history.
- **Share** (`/trips/[tripId]/share`) — read‑only, print‑friendly view with copy‑link / WhatsApp / print and a public toggle.
- **Settings, Auth (`/auth/login`), Admin** (`/admin`, role‑gated) dashboards.
- **Data‑safety UX** — "estimated" / "demo" labels, last‑updated dates, external‑link markers, and disclaimers for visa/entry/availability. The generator **never invents** a place/hotel/flight; it only schedules verified places.
- **States** everywhere — loading, empty, error/retry, offline‑provider, missing‑image fallback, save status.
- **Accessibility** — semantic HTML, keyboard nav, visible focus, labels, status not by color alone.

---

## 🧱 Tech stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v3 · shadcn/ui + Radix · Zod · Recharts · lucide‑react · Supabase (`@supabase/ssr`) · sonner.

> Generation and modification run through **secure API routes** (`/api/generate`, `/api/modify`, `/api/recommend`) so a real AI key never reaches the browser.

---

## 🚀 Getting started

```bash
# 1. Install (Node 18.18+ / 20+ recommended)
npm install

# 2. (optional) configure providers — the app works with NO env vars
cp .env.example .env.local

# 3. Develop
npm run dev            # http://localhost:3000

# 4. Quality gates
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run build          # production build
npm start              # serve the production build
```

No environment variables are required for the demo. Everything works on mock data.

---

## 🔑 Environment variables

See **`.env.example`** for the full list. All are optional; each provider defaults to `mock` when its key is missing.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Base URL for share links & metadata |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Enable Supabase data + auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Server‑only admin key (never exposed) |
| `AI_PROVIDER` (`mock`\|`anthropic`), `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Real AI generation/modification |
| `MAPS_/PLACES_/FLIGHTS_/HOTELS_/WEATHER_/CURRENCY_PROVIDER` | Per‑integration provider selection |

Env values are validated with Zod in `src/config/env.ts` (shape‑only; malformed values are ignored with a warning so the app still boots).

---

## 🗄️ Supabase (optional, production path)

SQL migrations live in **`supabase/`**:

- `migrations/0001_init.sql` — 16 tables (profiles, trips, trip_days, activities, places, hotels, flights, budget_items, saved_places, trip_collaborators, trip_ai_messages, trip_versions, …) with UUID keys, FKs, indexes, check constraints, `updated_at` triggers, and a `handle_new_user()` profile trigger.
- `migrations/0002_rls.sql` — Row Level Security on every table (owner / collaborator / public‑share / admin) via `SECURITY DEFINER` helpers.
- `seed.sql` — demo destinations & places catalog.

Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor. Add the `NEXT_PUBLIC_SUPABASE_*` keys and the app’s repository/auth layers (`src/repositories`, `src/lib/supabase`) take over from the local store.

---

## ✅ What’s implemented vs mocked

**Fully implemented (real logic):**
- End‑to‑end flows: plan → generate → workspace → edit (AI + manual) → version/undo → share.
- Deterministic **trip generator** honoring dates, budget, pace, interests, children, nearby grouping, realistic travel times, meals/rest.
- **AI modification** interpreter (AR/EN) → Zod‑validated `TripModification[]` → applier that respects locks and recomputes times + budget, with preview & versioning.
- Budget engine, itinerary time/leg recomputation, RTL i18n, all pages, charts, SVG map, accessibility & state handling.

**Mocked (clearly isolated, swap‑ready):**
- **AI provider** — `mock-provider` (deterministic). `anthropic-provider` is a wired placeholder (prompt builder + retry + Zod parsing) that falls back to mock; drop in a Messages API call to go live.
- **Integrations** — `src/lib/integrations/mock/*` for places/flights/hotels/weather/currency/maps. All prices/times are labelled **estimates / demo**.
- **Persistence & auth** — the demo uses a client store (localStorage) + mock auth. Supabase repository/auth are structured behind the same interfaces (`src/repositories`, `src/services`, `src/lib/supabase`) and gated by config.
- **Map** — SVG demo renderer behind a provider‑agnostic marker interface (Mapbox/Google can replace it).

---

## 🎨 Rebranding

Everything user‑facing pulls the product name from **`src/config/brand.ts`** (name, tagline, colors, contact). Change it there. The color palette is defined once as HSL CSS variables in `src/app/globals.css` (mirrored in `brand.ts` for JS/chart use).

---

## 🌐 Internationalization

- Dictionaries: `src/messages/ar.ts` (source of truth) and `src/messages/en.ts` (typed as `typeof ar`, so both stay in sync — a missing key is a compile error).
- Runtime: `src/lib/i18n` (`useI18n()` → `t`, `locale`, `dir`, `setLocale`, `fmt.*`). Locale persists in a cookie; the root layout sets `<html lang dir>` server‑side.

---

## 📁 Folder structure

```
src/
  app/            # routes (App Router) + API routes
  components/
    ui/           # shadcn primitives
    layout/ landing/ trip/ maps/ plan/ shared/
  features/       # auth, trips (store), plan, discover, settings, admin
  lib/
    ai/           # provider interface, mock + anthropic adapter, prompt, apply, preview, interpret
    integrations/ # provider interfaces + mock adapters (places/flights/hotels/weather/currency/maps)
    trip/         # generator, budget, itinerary, helpers
    validation/   # Zod schemas (plan form, AI modifications)
    i18n/ supabase/ utils
  services/       # trip-service (AI + persistence orchestration)
  repositories/   # trips-repository (Supabase impl behind an interface)
  data/           # destinations, cities, currencies, airlines, amenities, places/*, demoTrips
  types/          # domain, enums, ai
  config/         # brand, env
  messages/       # ar, en
supabase/         # migrations + seed
```

---

## 🧭 Demo trips

Three seeded, realistic Arabic demo trips (deterministic, no randomness):
1. 7‑day **family** Riyadh → Istanbul
2. 5‑day **luxury** Riyadh → Dubai (draft)
3. 10‑day **balanced** Jeddah → London (past, public)

They’re produced by running the same generator used in production, so they exercise real logic. All prices/availability are labelled estimates.

---

## 🔭 Recommended next steps

1. Implement the Anthropic adapter’s Messages API call (structure & validation are ready).
2. Complete Supabase row↔domain mapping for nested collections and switch the store to the repository when configured.
3. Add real map + places/flights/hotels adapters (Mapbox/Google/Amadeus) behind the existing interfaces.
4. Add server middleware for auth‑gated routes once Supabase Auth is live (RLS already enforces DB access).
5. Tests (unit for generator/budget/apply; e2e for the plan→edit→share flow) and i18n key‑coverage checks.

---

_Prices, times, availability, and visa/entry information shown in the app are estimates for demonstration and are **not** guarantees. Always verify with official sources before booking or travelling._
