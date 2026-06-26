# Cognix Architecture

## System overview

Cognix is a closed-loop coaching system. The web app is the analytics and configuration interface. Telegram is the execution client. A coaching backend orchestrates the engines between them.

```
                         ┌────────────────────────┐
                         │      Telegram Bot      │
                         │ messages, buttons, UX  │
                         └───────────┬────────────┘
                                     │ webhook
                                     ▓
┌───────────────────┐     ┌────────────────────────┐
│ Next.js Cognix UI │────▶│   Cognix API Service   │
│ analytics/config  │     │ FastAPI or TypeScript  │
└───────────────────┘     └───────────┬────────────┘
                                      │
              ┌───────────────────────┼────────────────────────┐
              ▓                       ▓                        ▓
      ┌──────────────┐       ┌─────────────────┐      ┌─────────────────┐
      │ Coach Engine │       │ LLM Interpreter │      │ Integration Hub │
      │ deterministic│       │ structured I/O  │      │ provider jobs   │
      └──────┬───────┘       └─────────────────┘      └────────┬────────┘
             │                                                  │
             ▓                                                  ▓
      ┌─────────────────────────────────────────────────────────────────┐
      │                      PostgreSQL / Supabase                      │
      │ athlete, sessions, sets, metrics, plans, decisions, audit logs │
      └─────────────────────────────────────────────────────────────────┘
```

## Recommended coaching backend stack

The Next.js web app stays as-is. A separate coaching service handles Telegram, engines and background jobs.

**Preferred: Python FastAPI**

Reasons:
- Progression algorithms and analytics become increasingly numerical
- Exercise-response modelling is easier in Python
- Background ingestion and scheduled jobs fit naturally
- Demonstrates a stronger full-stack health data architecture

TypeScript (Fastify/NestJS) is an acceptable alternative that maximises shared types with the web app, but Python is recommended for long-term analytical capability.

**Infrastructure**

| Component | Technology |
|---|---|
| Web app | Next.js on Vercel |
| Coaching service | FastAPI on Railway, Render or Fly.io |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Queue / cron | Supabase Edge Functions or worker process |
| Telegram | Webhook (HTTPS endpoint on coaching service) |
| Secrets | Environment variables, encrypted at rest |

---

## The five coaching engines

### Engine 1: Readiness engine

Already exists in `src/lib/scoring.ts`. Inputs: HRV deviation, sleep, subjective check-in, nutrition, training load, pain, illness, weather. Output:

```json
{
  "readiness": 74,
  "mode": "normal",
  "constraints": ["reduce_lower_body_volume_10_percent"],
  "confidence": 0.81
}
```

Readiness applies predefined transformations to the plan. It does not rewrite it. See `SAFETY_RULES.md`.

### Engine 2: Programme engine

Creates a rolling 4–12-week training plan. Decides:

- Weekly split structure
- Muscle-group volume targets
- Strength vs hypertrophy emphasis
- Endurance allocation and interference management
- Exercise selection, rep ranges and progression model
- Deload conditions

Uses constraint-based scheduling, not a fixed weekday template. See `COACHING_SPEC.md` for constraint rules.

### Engine 3: Workout prescription engine

Converts the programme into today's session prescription. Per exercise:

```json
{
  "exercise": "weighted_pull_up",
  "purpose": "vertical_pull_strength",
  "sets": 3,
  "rep_range": [5, 7],
  "target_rir": 2,
  "target_load_kg": 10,
  "rest_seconds": 180,
  "substitutions": ["neutral_grip_pull_up", "lat_pulldown"]
}
```

Considers: previous performance, estimated strength, movement frequency, readiness mode, session time limit, equipment, soreness, pain, exercise preference and priority order.

### Engine 4: Live autoregulation engine

Runs after every set during a Telegram session. Determines: retain load, add load, reduce load, alter rep target, stop exercise, remove or add a set, substitute. See `PROGRESSION_RULES.md` for the full rule set.

### Engine 5: Progression and learning engine

Updates future prescriptions overnight or after session close. Maintains an exercise-level state:

```json
{
  "exercise_id": "incline_dumbbell_press",
  "estimated_1rm_kg_each": 38.4,
  "preferred_rep_range": [7, 10],
  "typical_set_dropoff_pct": 9.2,
  "minimum_recovery_hours": 54,
  "load_increment_kg_each": 2,
  "performance_trend": "improving",
  "confidence": 0.76
}
```

Initially uses simple rules and rolling averages. Statistical modelling is added once several months of data exist.

---

## Frontend architecture

Next.js 15 App Router. All pages are React Server Components by default. Client components use `"use client"` and are minimal: forms, interactive states, localStorage access. No client-side data fetching in v0.1 — everything reads from localStorage or mock data on mount.

### Directory conventions

- `src/app/` — pages only. No logic. Pages import from `src/lib/` and `src/components/`.
- `src/lib/` — pure logic. No React imports. All scoring, recommendation, training, and planner functions are pure TypeScript.
- `src/components/` — presentational. Accept data as props. No direct storage calls (storage is called in pages, passed down as props).
- `src/data/` — static seed data. Default supplements, exercises, demo user.

## Storage: localStorage now, Supabase later

All persistence in v0.1 goes through `src/lib/storage.ts`. This file is the only place that touches `localStorage`.

When migrating to Supabase in v0.2, only `storage.ts` changes. All callers stay the same. This is the deliberate abstraction boundary.

```typescript
// v0.1 (localStorage)
export function saveCheckIn(checkin: DailyCheckIn): void {
  localStorage.setItem("cognix:checkins", ...)
}

// v0.2 (Supabase — same interface)
export async function saveCheckIn(checkin: DailyCheckIn): Promise<void> {
  await supabase.from("daily_checkins").upsert(checkin)
}
```

The only required change in callers is adding `await`. All component code stays the same.

## Scoring engine

`src/lib/scoring.ts` contains only pure functions. No side effects, no API calls, no React.

```
calculateRecoveryScore(whoop) -> number
calculateSleepScore(whoop) -> number
calculateSubjectiveScore(checkin) -> number
calculateNutritionScore(checkin) -> number
calculateHydrationScore(checkin) -> number
calculateCaffeineScore(checkin, cutoffHour) -> number
calculateTrainingScore(sessions) -> number
calculatePainScore(checkin) -> number
calculateReadinessScores(whoop, checkin, sessions, hasSettings) -> ReadinessScores
determineMode(scores, checkin) -> Mode
```

Every function is independently unit-testable. The scoring engine can be run without a browser.

## Recommendation engine

`src/lib/recommendations.ts` contains `buildDailyRecommendation()`. It takes pre-computed scores and returns deterministic text strings for training, nutrition, hydration, caffeine, supplements, sleep, main_risk, and one_priority.

No LLM call. No randomness. Same inputs always produce the same outputs.

In v0.3, Claude receives the output of this function and explains it in natural language. The function itself does not change.

## Data confidence

`src/lib/confidence.ts` calculates a 0-100 score representing how much data is available. Missing WHOOP data reduces confidence. Missing check-in reduces confidence. The scoring engine still runs on partial data — confidence affects how strongly recommendations are weighted, but the app never refuses to show a score.

## Future API boundaries

When integrations are added, they follow this pattern:

```
External API (WHOOP / Strava / Google) 
  -> API route in src/app/api/
  -> Zod validation
  -> Supabase upsert
  -> Same scoring engine (unchanged)
  -> Same components (unchanged)
```

The scoring engine and components are integration-agnostic. They accept typed interfaces (`MockWhoopDay`, `DailyCheckIn`, etc.) regardless of data source.

## Future external integrations

Each integration has a clear data flow:

**WHOOP (v0.4):**
`GET /developer/v1/recovery` + `GET /developer/v1/activity/sleep`
-> parsed into `MockWhoopDay` (or `WhoopCycle` once real)
-> replaces mock data source in dashboard

**Google Calendar (v0.5):**
`GET /calendar/v3/calendars/primary/events`
-> parsed into `CalendarBlock[]`
-> replaces `MOCK_CALENDAR_BLOCKS` in planner

**Claude (v0.3):**
Pre-computed `ReadinessScores` + `DailyRecommendation`
-> formatted into structured prompt
-> `POST https://api.anthropic.com/v1/messages`
-> Zod validation of JSON response
-> rendered as natural language brief alongside deterministic cards

## RLS design (v0.2+)

Every Supabase table has `user_id UUID REFERENCES auth.users(id)`. RLS policies follow one pattern:

```sql
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_isolation" ON daily_checkins
  FOR ALL USING (auth.uid() = user_id);
```

Users can only read and write their own rows. No exceptions.
