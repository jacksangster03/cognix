# Cognix Architecture

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
