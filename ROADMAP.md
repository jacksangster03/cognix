# Cognix Roadmap

## v0.1 — Local MVP (current)

**Goal:** Prove the concept. Scoring engine works. App is useful on day one.

- [x] Dashboard with readiness score, mode, metric tiles
- [x] Daily check-in form (wellbeing, nutrition, caffeine, supplements)
- [x] Training session log with ACWR and muscle coverage
- [x] Workout planner (mock calendar)
- [x] Progress trends (mock data)
- [x] Experiments (6 templates, start/stop)
- [x] Integration catalogue (roadmap documentation)
- [x] Settings (goals, targets, preferences)
- [x] Deterministic scoring + recommendation engine
- [x] Provider-agnostic AI brief layer (Anthropic, deterministic fallback)
- [x] Demo mode with mock biometric data
- [x] localStorage persistence

**Definition of done:** App runs locally. Dashboard shows a real readiness score and actionable protocol based on check-in + training history. AI brief works with or without an API key.

---

## v0.2 — Supabase and auth

**Goal:** Multi-device sync. Data persists beyond one browser.

- [ ] Supabase project with all tables (see DATA_MODEL.md)
- [ ] Row-level security on all tables
- [ ] Supabase Auth (email + password)
- [ ] Replace `src/lib/storage.ts` with Supabase client
- [ ] Login/signup pages
- [ ] Protected routes (redirect unauthenticated users)
- [ ] Vercel deployment with env vars

**Definition of done:** User can sign up, log data from two different devices, and see the same data on both.

---

## v0.3 — Strava integration and Endurance Base

**Goal:** Real activity data. Endurance progression tracking. The app becomes a hybrid athlete operating system, not just a readiness dashboard.

### Supabase additions

- [ ] `provider_connections` table (provider, user_id, access_token, refresh_token, expires_at, scopes)
- [ ] `activities` table (normalised ActivityRecord: provider-agnostic)

### Strava OAuth

- [ ] Register Strava developer app
- [ ] OAuth 2.0 flow: `/api/auth/strava/connect` + `/api/auth/strava/callback`
- [ ] Token storage (encrypted) in Supabase
- [ ] Token refresh logic (before expiry, checked on each sync)
- [ ] Strava webhook subscription: `POST /api/webhooks/strava`

### Activity import

- [ ] Webhook handler: receive activity push, fetch full activity from Strava
- [ ] Activity normaliser: `StravaActivity → ActivityRecord` (provider-agnostic type)
- [ ] Upsert into `activities` table
- [ ] Handle all relevant activity types: `Run`, `Ride`, `MountainBikeRide`, `Walk`, `Hike`
- [ ] Historical import: fetch last 6 months of activities on first connect
- [ ] ACWR updated to include Strava activities (alongside manual session logs)

### Endurance Base page

- [ ] New page at `/endurance`
- [ ] New sidebar nav item: "Endurance"
- [ ] `src/lib/endurance.ts`: pure functions for all endurance metrics
- [ ] `calculateWeeklyRunningKm(activities, weekStart)` → number
- [ ] `calculateWeeklyCyclingKm(activities, weekStart)` → number
- [ ] `calculateWeeklyElevationGain(activities, weekStart)` → number
- [ ] `estimateZone2Minutes(activities, maxHR)` → number
- [ ] `calculateRunningACWR(activities)` → ACWR
- [ ] `calculateCyclingACWR(activities)` → ACWR
- [ ] `calculateMadridSegoviaPreparednesScore(activities)` → number (0-100)
- [ ] `calculateHalfMarathonBaseScore(activities)` → number (0-100)
- [ ] `getLongestRunThisMonth(activities)` → km
- [ ] `getLongestRideThisMonth(activities)` → km
- [ ] `get5KPaceTrend(activities)` → pace[] (last 8 efforts)
- [ ] Endurance Base page UI: weekly load strips, longest run/ride, preparedness scores
- [ ] Activity feed: recent runs/rides with distance, time, elevation, pace

**Definition of done:** Dashboard shows real Strava run and ride data. Endurance Base page shows weekly running km, weekly cycling km, weekly elevation gain, Madrid-Segovia preparedness score, half marathon base score, and longest run/ride this month. ACWR on training page includes Strava activities.

---

## v0.4 — Weather, file upload, and Google Calendar

**Goal:** Heat-adjusted hydration. Manual file import. Real workout slot planning.

### Weather

- [ ] OpenWeatherMap API integration (1 call per morning, 6-hour Supabase cache)
- [ ] Temperature-adjusted hydration target: +0.5L > 28°C, +1.0L > 33°C
- [ ] Humidity adjustment: +0.5L if humidity > 70% and temp > 28°C
- [ ] Outdoor training flag: heat warning if temp > 33°C
- [ ] UV warning: if UV index > 7

### FIT / GPX / TCX file upload

- [ ] Upload UI on activities or integrations page
- [ ] `.fit` file parser (using `fit-file-parser` npm package)
- [ ] `.gpx` file parser (XML, extract track points + metadata)
- [ ] `.tcx` file parser (XML, extract activity data)
- [ ] Normalise all formats to ActivityRecord (same pipeline as Strava)
- [ ] Upsert into `activities` table
- [ ] Duplicate detection (by date + distance + duration)

### Google Calendar

- [ ] Google OAuth 2.0: read-only calendar scope
- [ ] Fetch events for next 7 days: `GET /calendar/v3/calendars/primary/events`
- [ ] Parse into `CalendarBlock[]`
- [ ] Replace mock calendar in planner with real events
- [ ] Meeting density as cognitive load note in daily brief context

**Definition of done:** Hydration recommendation adjusts for Madrid temperature. Planner shows real calendar free slots. Garmin .fit exports import correctly.

---

## v0.5 — Recovery provider (Garmin Fenix 8 + Oura Ring Gen 4)

**Goal:** Replace mock biometric data with real recovery and sleep signals from Garmin and Oura.

### RecoveryProvider abstraction

- [ ] Define `RecoveryProvider` interface in `src/lib/providers/recovery-provider.ts`
- [ ] `RecoveryRecord` type (provider-agnostic: covers Garmin, Oura, WHOOP, Fitbit)
- [ ] `SleepRecord` type

### Oura Ring Gen 4

- [ ] Oura OAuth 2.0 (or Personal Access Token for personal use)
- [ ] `/api/auth/oura/connect` + `/api/auth/oura/callback`
- [ ] Fetch readiness: `GET /v2/usercollection/readiness`
- [ ] Fetch sleep: `GET /v2/usercollection/sleep`
- [ ] Normalise to RecoveryRecord
- [ ] Nightly sync (via Supabase Edge Function or Vercel cron)
- [ ] HRV 30-day baseline calculation from stored Oura records

### Garmin Health / garminconnect bridge

- [ ] Python microservice: `garminconnect` library wrapping Garmin Connect
- [ ] Fetch Body Battery, HRV Status, Training Readiness, sleep data
- [ ] POST to `/api/providers/garmin/ingest` (authenticated)
- [ ] Normalise to RecoveryRecord
- [ ] Daily sync trigger

### Scoring engine update

- [ ] Replace `mock-biometrics.ts` data source with real RecoveryRecord
- [ ] Data state label: "Live personal data" when provider is connected
- [ ] HRV deviation uses stored 30-day Oura baseline
- [ ] Recovery score input uses Garmin Body Battery or Oura Readiness (configurable)

**Definition of done:** Dashboard shows real Oura readiness score, real overnight HRV from Oura, and real Garmin Body Battery. Mock biometric indicator disappears. Data confidence label shows "Live personal data".

---

## v0.6 — Telegram workout logger

**Goal:** Close the loop. Telegram becomes the execution client. No LLM yet; no wearable integrations yet.

- [ ] Private Telegram bot (webhook on coaching service)
- [ ] `/today`, `/workout`, `/status`, `/weight`, `/checkin`, `/stop`, `/help`
- [ ] One-set-at-a-time delivery with inline buttons
- [ ] Rest timer
- [ ] Session state machine (see `TELEGRAM_FLOWS.md`)
- [ ] Set results persisted to `performed_sets`
- [ ] Session completion summary
- [ ] Simple double progression rule
- [ ] Cognix workout history page
- [ ] Telegram user ID allow-list (reject unknown users)

**Definition of done:** Complete a full gym session through Telegram. Every set logged, every session stored, next-session load automatically determined.

---

## v0.7 — Natural-language session input

**Goal:** Replace buttons with natural language. LLM added as parser only.

- [ ] LLM interprets set results: "30 each for 8, about 2 RIR", "failed fifth rep", "right shoulder feels weird"
- [ ] Structured output validated with Pydantic/Zod before persistence
- [ ] Confidence scoring on parsed output; fall back to button prompt when confidence is low
- [ ] Pain and failure classification flows
- [ ] `llm_interactions` audit table populated
- [ ] `/privacy` command showing what was sent to LLM

**Definition of done:** User can type naturally in Telegram and results are parsed correctly into structured set records.

---

## v0.8 — Personalised prescription engine

**Goal:** Cognix prescribes the session, not just tracks it.

- [ ] Exercise performance history and estimated 1RM per movement
- [ ] Double progression, top-set plus back-offs, rep-goal models (see `PROGRESSION_RULES.md`)
- [ ] Progression states stored and updated per exercise
- [ ] Volume tracking per muscle group
- [ ] Automatic exercise substitutions
- [ ] Readiness mode applied as deterministic transformation
- [ ] Coach decisions audit trail

**Definition of done:** Cognix prescribes today's workout with correct loads based on history. Loads adjust automatically when readiness is suppressed.

---

## v0.9 — Strava, calendar and body metrics

**Goal:** Real endurance data and body composition tracking.

- [ ] Strava OAuth and activity import (from v0.3 plan, carried forward)
- [ ] Endurance Base page with real Strava data
- [ ] Calendar-aware workout timing
- [ ] Interference management (no heavy legs before MTB)
- [ ] Manual daily weight via Telegram prompt
- [ ] Renpho CSV import adapter
- [ ] Smoothed weight and body-fat trends

**Definition of done:** Dashboard shows real Strava activities. Weekly endurance load informs the coaching plan. Body weight trend is visible.

---

## v0.10 — Recovery provider

**Goal:** Replace mock biometrics with real signals.

- [ ] Oura Ring: OAuth 2.0 flow, readiness, sleep, HRV
- [ ] Garmin: Health API or garminconnect bridge, Body Battery, HRV status
- [ ] Nightly sync via Supabase Edge Function or worker
- [ ] HRV 30-day baseline from stored records
- [ ] Data confidence label updated to "Live personal data"

**Definition of done:** Dashboard shows real overnight HRV, real readiness and real Body Battery. Mock biometric indicator disappears.

---

## v1.0 — Closed-loop adaptive coaching system

**Goal:** Full production coaching loop. Portfolio-ready.

- [ ] Rolling weekly programme with automated rescheduling
- [ ] Mesocycle progression and deload detection
- [ ] Adherence-aware programme changes
- [ ] Individual response modelling (recovery, performance prediction)
- [ ] Garmin workout publishing (when official API access is available)
- [ ] Public demo instance with pre-populated data
- [ ] Architecture diagram and landing page
- [ ] Demo video (90 seconds)
- [ ] All documentation reviewed

**Definition of done:** Cognix coaches a complete training week autonomously from daily readiness through to next-session prescription, with adaptation on every set. Demonstrable in a live interview.

---

## What was deprioritised and why

| Feature | Original priority | New priority | Reason |
|---|---|---|---|
| WHOOP OAuth | v0.4 (original primary) | v0.5 (optional, not owned) | No GPS, subscription cost, Garmin+Oura is a better stack |
| Strava | v0.6 (original) | v0.3 (now first) | Immediate endurance use case; addresses the post-Madrid priority |
| Spotify | v0.7 | v0.8 | Unchanged; non-core |
| Claude synthesis | v0.3 | v0.1.1 (done) | Implemented ahead of schedule as provider-agnostic LLM layer |

---

## Endurance milestones tracked in the app

These are personal athletic targets that the Cognix Endurance Base scoring is built around:

| Target | Metric used | Preparedness score threshold |
|---|---|---|
| Madrid to Segovia (160km+ MTB) | Longest ride, weekly cycling km, weekly elevation | 75/100 minimum |
| Half marathon | Longest run, weekly running km, frequency, pace trend | 70/100 minimum |
| 5K sub-25 minutes | 5K pace trend from Strava activities | n/a (tracked as trend) |
| Weekly Zone 2 base | Estimated Zone 2 minutes from HR data | 180 min/week target |
