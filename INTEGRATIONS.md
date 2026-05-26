# Cognix Integrations

All integrations are future phases. v0.1 is fully local-first.

---

## WHOOP (v0.4) — Primary biometric source

**What it adds:** Recovery score (0-100), HRV RMSSD, resting HR vs baseline, deep sleep, REM sleep, sleep efficiency, daily strain, kilojoules burned, respiratory rate, SpO2.

**Why it matters:** WHOOP is the cornerstone of the recommendation engine. Without it, readiness is based entirely on subjective check-in data. With it, the confidence score jumps from Moderate to Full.

**API complexity:** Medium. OAuth 2.0 Authorization Code flow. Well-documented developer portal.

**Phase:** v0.4

**Key design decision:** WHOOP cycles are physiological (wake-to-wake), not calendar-based. Tuesday's recovery score reflects Monday night's sleep. Data model must use `cycle_id` not `date` as primary key.

**Risks:** WHOOP API rate limits (100 req/min, 10,000/day). Token refresh management. Score state can be PENDING_SCORE for up to 2 hours after waking.

---

## Google Calendar (v0.5) — Schedule context

**What it adds:** Real free time blocks for workout planner. Meeting density as cognitive load proxy.

**Why it matters:** A day with 6 hours of meetings is functionally different from a free day, even if WHOOP recovery is high. Calendar data makes training slot recommendations context-aware.

**API complexity:** Medium. Google OAuth 2.0. Read-only Calendar scope.

**Phase:** v0.5

**Risks:** Google OAuth credential management. Rate limits. Calendar privacy sensitivity.

---

## OpenWeatherMap (v0.5) — Environmental context

**What it adds:** Temperature-adjusted hydration targets. Outdoor training viability flag.

**Why it matters:** Madrid summer (35°C+) materially changes hydration requirements. One API call per morning.

**API complexity:** Low. Free tier. API key only (no OAuth).

**Phase:** v0.5

**Risks:** Minimal. Free tier is sufficient for personal use.

---

## Strava (v0.6) — Outdoor activity data

**What it adds:** Run and ride activity imports. Strava suffer score as training load contribution. Distance and elevation tracking.

**Why it matters:** Manual training logs miss outdoor activity entirely. Strava completes the ACWR calculation for users who run or cycle.

**API complexity:** Medium. OAuth 2.0. Webhook available for real-time imports.

**Phase:** v0.6

**Risks:** Strava API deprecation history. Rate limits (200 req/15 min). Need to map Strava effort scores to RPE for ACWR.

---

## Withings Smart Scale (v0.6) — Body composition

**What it adds:** Automated weight, body fat %, muscle mass, BMI logging.

**Why it matters:** Removes friction from body metric tracking. Weekly automated data replaces manual entry.

**API complexity:** Medium. OAuth 2.0 (Withings account required).

**Phase:** v0.6

**Risks:** Requires Withings scale hardware. OAuth credential management.

---

## Spotify (v0.7) — Playlist interventions

**What it adds:** Mode-matched playlist recommendations. Pre-workout activation, recovery ambient, wind-down playlists.

**Why it matters:** Music has measurable effects on training performance and mood. Cognix uses mode and energy score to recommend a playlist, not just any playlist.

**API complexity:** Medium. OAuth 2.0. Playback control requires Spotify Premium.

**Phase:** v0.7

**Risks:** Spotify API requires Premium for playback. Audio feature analysis requires rate-limited calls per track. User playlist diversity varies.

---

## Apple Health (v0.6) — Passive health fallback

**What it adds:** Passive HRV estimates, step count, resting HR (if tracked by Apple Watch).

**Why it matters:** Useful for users without WHOOP who use Apple Watch. Falls back to HealthKit data.

**API complexity:** High. HealthKit requires native iOS layer. Web app cannot directly access HealthKit. Options: (a) React Native companion, (b) XML export upload.

**Phase:** v0.6

**Risks:** Requires iOS native component or manual export. HealthKit HRV is less precise than WHOOP (measured during breathing exercises, not continuously).

---

## Polar H10 / HRV strap (v0.6) — Alternative biometric source

**What it adds:** Validated chest-strap HRV measurement for users without WHOOP. Breath-by-breath precision.

**Why it matters:** Better HRV accuracy than wrist-based devices. For users who want precise HRV without WHOOP subscription cost.

**API complexity:** High. Polar Access Link API. Would require DeviceProvider abstraction to support both WHOOP and Polar.

**Phase:** v0.6

**Risks:** Adds significant engineering complexity. Should only build if there is clear demand from non-WHOOP users.
