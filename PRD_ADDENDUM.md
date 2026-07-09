# Cognix Coach PRD: Behavioural Addendum

**Version:** 1.0 (2026-07-09)
**Extends:** `PRD.md` v1.0
**Status:** Implementation-ready addendum. Does not supersede PRD.md; extends it.

---

## Overview

The PRD defines a physiologically adaptive coaching system. This addendum adds the behavioural layer: friction, confidence, motivation prediction, and long-term intelligence. It also contains an honest architectural review.

One central reframe before anything else:

> The biggest limiter for Jack is not knowledge. It is consistency. Therefore every architecture decision must answer: "does this increase or decrease the probability of the next workout happening?"

Every subsystem below is evaluated against that question first.

---

## A1. Friction Engine

### What it is, and why it is separate from the Readiness Engine

The Readiness Engine answers: *what is Jack's physiological capacity today?*

The Friction Engine answers: *how difficult will it be for Jack to actually start and finish a session today?*

These are independent axes. Jack can have readiness 80 (physiologically ready) and friction 90 (uni deadline, gym crowded, 35 minutes free). The output of combining them is not a merged score; it is a **session variant selection**:

```
readiness × friction → session_variant
```

Readiness already determines the programme transformation (Push/Normal/Moderate/Deload/Rest). Friction determines which version of that transformed session to deliver. This keeps the separation clean and prevents the two scores from obscuring each other.

### Friction score

```typescript
interface FrictionEstimate {
  score: number;                        // 0 (no friction) to 100 (blocking)
  level: "low" | "medium" | "high" | "blocking";
  signals: FrictionSignal[];
  recommendedVariant: SessionVariant;
  confidenceInEstimate: number;         // 0-1; low when inputs are missing
}

type SessionVariant =
  | "full"         // 75 min, programme as prescribed
  | "efficient"    // 60 min, one fewer accessory set per muscle group
  | "compressed"   // 45 min, minimum primary work
  | "rescue"       // 30-40 min, priority muscles, machines/DBs only
  | "micro"        // 20 min, 2-3 priority movements
  | "rest";        // blocking friction or readiness Rest
```

### Friction signals and weights

All signals are from check-in inputs, calendar, history, and learned traits. Every signal is optional; missing signals move the confidence down, not the score up (conservative default: unknown friction is not assumed low).

```typescript
interface FrictionSignal {
  kind: FrictionSignalKind;
  raw: number;                          // normalised 0-100 per kind
  weight: number;                       // below
}

const FRICTION_WEIGHTS: Record<FrictionSignalKind, number> = {
  time_available_minutes: 0.30,         // highest weight: hard ceiling on what is possible
  motivation_checkin: 0.20,
  consecutive_missed_sessions: 0.15,
  gym_crowding_reported: 0.10,
  equipment_contested: 0.08,
  university_workload: 0.07,            // from calendar or check-in
  travel_flag: 0.05,
  weather_outdoor_session: 0.03,
  social_commitment: 0.02,
};
```

`score = Σ(raw × weight)` for present signals, renormalised to 0-100.

### Scoring rules per signal

| Signal | Raw = 0 | Raw = 100 |
|---|---|---|
| `time_available_minutes` | ≥ 80 min free | 0 min free |
| `motivation_checkin` | 10/10 eager | 1/10, does not want to go |
| `consecutive_missed_sessions` | 0 missed | 3+ missed (recovery-of-routine mode) |
| `gym_crowding_reported` | "empty" | "packed, can't get equipment" |
| `equipment_contested` | 0 contested exercises in today's plan | all primary exercises contested |
| `university_workload` | holiday / free day | exam / hard deadline today |
| `travel_flag` | training at home gym | travelling, no gym access |

### Friction → session variant (deterministic)

```
friction  0-30  → full (or efficient if readiness is Moderate)
friction 31-55  → efficient
friction 56-74  → compressed
friction 75-89  → rescue
friction 90+    → rescue or micro; if readiness is also ≤ 30, rest
```

`consecutive_missed_sessions ≥ 2` anchors the floor at rescue regardless of score. The priority after missed sessions is habit recovery, not optimal stimulus. One tap to start a rescue session always beats another miss.

### Interaction with programme generation

Friction never alters the programme (what exercises exist, what loads are targeted, what progressions were earned). It only selects a variant at prescription time. This is the same principle as readiness: predefined transformations, not arbitrary rewrites.

The exercise pool for rescue and micro variants is pre-computed nightly (already in PRD.md §10.7). Friction just selects the pre-computed variant; no runtime computation under friction pressure.

### Interaction with Telegram

- Morning message: if friction estimate is medium or above before any check-in, offer the reduced variant proactively, framing it as the smart choice: "You mentioned a deadline today. 35-minute version, or the full 70? [35 min] [Full]"
- Mid-session: TIME_LEFT event (§A7) is the real-time friction signal; the compressor handles it from there.
- 21:00 nudge (Journey B): if no session logged and friction estimate was high, the nudge offers micro, not rescue: "Even 20 minutes of arms counts. [Quick session] [Tomorrow]"
- Never: a friction-based nudge after 22:00 (sleep matters more).

### New check-in fields required

```typescript
interface DailyCheckIn {
  // ... existing fields ...
  time_available_minutes?: number;
  gym_crowding?: 1 | 2 | 3 | 4 | 5;   // 1 empty, 5 packed
  travel_today?: boolean;
  university_load?: 1 | 2 | 3;         // low / medium / high
  motivation?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
}
```

Only `motivation` and `time_available_minutes` are prompted by default (shortest meaningful check-in). Others are prompted when history or calendar suggests they may apply (e.g. travel flag from calendar). Never ask all five every day.

---

## A2. Exercise Confidence Model

### What it is

Confidence is a per-exercise composite trait (stored in `athlete_traits`, key `exercise.{id}.confidence`) that predicts the probability Jack executes this exercise well if prescribed. It is distinct from preference (whether he likes it) and progression (whether he is getting stronger). A confident exercise is one he can do, trusts, and actually shows up for.

```typescript
interface ExerciseConfidence {
  value: number;             // 0-100
  components: {
    enjoyment: number;       // from preference trait
    technique: number;       // self-report + stability of performance
    consistency: number;     // % of prescriptions actually completed
    pain: number;            // inverted: pain_events reduce this
    stability: number;       // low variance in reps/load = higher stability
  };
  confidence: number;        // meta-confidence in the composite (data sufficiency)
}
```

Weights: enjoyment 0.25, technique 0.20, consistency 0.30, pain 0.15, stability 0.10. Consistency is highest-weighted because it is the one that actually determines adherence.

### Seeding before data exists

Seed values from the exercise catalogue at first run:

- `palmLoadRisk = 3` (heavy barbell): start at 50 (conservative)
- `setupCost = 3` (rack exercises): start at 55
- `setupCost = 1` (machine): start at 75
- Profile-preferred exercises (§8 of master profile): start at 80
- Profile-disliked (§9): start at 40
- `pain_associated` from prior profile notes (barbell bench): start at 45

These are seeds, not permanent values. Two weeks of data overrides them.

### Effect on programme generation

```
confidence ≥ 80 → exercise eligible as primary slot
confidence 60-79 → eligible as primary, cues attached, one warm-up set added
confidence 40-59 → eligible as accessory or secondary slot; regression offered
confidence < 40  → not auto-prescribed; available on user request with extra coaching
```

Regression means the catalogue's lower-threshold variant: barbell bench (confidence 47) → machine press or DB bench until confidence rises, not a permanent ban.

"Cues attached" means the pre-set message includes the technique cue from `exercises.cues[]` for that exercise. For back and chest (profile: weak mind-muscle), this is especially valuable: the low confidence in these movements is partly a cueing deficit, not just unfamiliarity.

### How confidence improves

Confidence updates nightly from the observation stream:
- Completed set, no skip, no swap → `consistency` component nudged up.
- User-reported stimulus high → `enjoyment` and `technique` nudged up.
- Pain event → `pain` component drops (magnitude scales with severity and recurrence).
- Low rep variance across sessions → `stability` nudges up.

Confidence recovery after a pain event is time-gated (30 days minimum before `pain` component can fully recover from a severity ≥ 5 event). This mirrors real neuromuscular caution and is the right conservative default.

### Web UI

`/athlete` page: confidence badge on every exercise the system knows about. User can see why confidence is where it is and manually challenge a component ("I'm comfortable with this now"). Manual challenges are recorded as observations with provenance `user_asserted` and decay after 30 days without confirming performance data.

---

## A3. Motivation Prediction

### Framing clarification

"Motivation" check-in is one input. Motivation prediction is a derived output of the Friction Engine, not a separate engine. Keeping them separate creates duplicated logic with no benefit. Binding decision:

**Motivation prediction is the `motivation_checkin` signal in the Friction Engine, extended by a learned baseline from the trait `adherence.motivationBaseline.{weekday}`.**

If Jack has not yet provided a morning check-in, the engine uses the historical base rate for that weekday and time of day (from the `adherence.byWeekday` and `adherence.byTimeOfDay` traits) as a prior. When the check-in arrives, it updates the friction estimate in real time.

Specifically, the Telegram morning message with "How's your energy today? [Low] [OK] [High]" is the lightweight version. Full motivation check-in via `/checkin` gives the full set of friction signals. Neither is mandatory.

### What the system learns

Over time, the Learning Engine discovers:
- Which weekdays Jack has lowest motivation (by session-skip frequency).
- Whether poor sleep correlates more strongly with skips than with low performance (they have different implications).
- Whether the university calendar pattern (deadlines = low adherence) can be predicted from Google Calendar data.
- The cadence of Jack's typical slumps (e.g. week 3 of any programme tends to be the drop-off point for many trainees; learn whether this applies to Jack specifically).

These discoveries become `adherence.*` traits that feed back into friction estimates before Jack even reports his mood.

### When predicted adherence is low

Friction Engine variant selection handles the mechanical response (offer rescue, compress). The Telegram framing handles the psychological response. Two rules:

1. Never name the prediction to Jack ("I think you'll probably skip today"). State the option, not the assessment.
2. Never punish or shame. The only valid frame after a miss is "here is the easiest possible path back."

---

## A4. Personal Coach Memory

### The distinction: facts vs coaching observations

The Athlete Model (PRD §17) already separates profile facts, strength data, and learned traits. This addendum formalises a third category: **coaching observations**, which are the behavioural patterns a human coach would write in their notebook after a few months with an athlete.

```typescript
interface CoachingObservation {
  id: string;
  userId: string;
  statement: string;          // plain English: "performs better after seeing previous PR"
  domain: "motivation" | "technique" | "adherence" | "response" | "preference";
  confidence: number;         // 0-1
  firstObservedAt: string;
  lastConfirmedAt: string;
  confirmingObservationIds: string[];   // ids in the observations table
  influencesProgramming: boolean;       // false = informational; true = affects decisions
  programmingEffect?: string;           // if true: what changes
  active: boolean;            // can be deactivated if contradicted
}
```

Key examples for Jack, pre-seeded from the master profile:

| Statement | Domain | Programming effect |
|---|---|---|
| "Performs better after seeing previous PRs displayed" | motivation | Pre-brief always shows last session's key loads |
| "Skips workouts if the first exercise feels intimidating" | adherence | First exercise on any session is always high-confidence; reserve compound primaries for slot 2+ |
| "Prefers machine pressing over barbell due to palm pain" | preference | Machine press or DB default; barbell bench only on user request |
| "Responds well to arm supersets at session end" | response | Arm accessories may be paired as supersets when time is short |
| "Enjoys visible pump; pump exercises increase perceived session value" | motivation | Every session ends with at least one pump-producing isolation movement if time allows |
| "Struggles to judge RIR accurately (under-reports effort)" | technique | RIR correction applied via rirBias trait; cue active calibration fortnightly |

### Automatic discovery

The Learning Engine adds new coaching observations when:
- A correlation crosses confidence 0.6 across ≥ 8 confirming observations.
- A pattern is novel (not already captured in an existing observation).
- The pattern has a potential programming effect worth acting on.

Examples of discoverable patterns:
- "Performance on Mondays is consistently 8% below other weekdays" → first-Monday-of-mesocycle is always compressed.
- "Sessions completed at 18:00-19:30 have 20% higher RPE-per-set than 20:00-21:30" → prefer earlier evening window in schedule suggestions.
- "Sessions preceded by a run of < 24 hours produce 12% more skipped sets" → hard enforce 24-hour interference window for lower-body.

New observations are proposed in the weekly review ("I noticed something. You seem to perform better in sessions that start with arms. Want me to use this?"). Accept = `influencesProgramming: true`. Decline = logged as declined, not proposed again for 60 days.

### Storage

`coaching_observations` table (new):

```sql
CREATE TABLE coaching_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  statement TEXT NOT NULL,
  domain TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL,
  first_observed_at TIMESTAMPTZ NOT NULL,
  last_confirmed_at TIMESTAMPTZ NOT NULL,
  confirming_observation_ids UUID[] NOT NULL DEFAULT '{}',
  influences_programming BOOLEAN NOT NULL DEFAULT false,
  programming_effect TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

The web's `/athlete` page renders active coaching observations with their supporting evidence links. Jack can deactivate any observation. Deactivation is itself an observation (the system learns that Jack disagreed, which is information).

---

## A5. RIR Calibration Engine

### The full system

The PRD introduced `effort.rirBias` as a trait. This section specifies the complete calibration engine.

### How bias is estimated

Three evidence sources, in descending reliability:

1. **Failure-adjacent forensics**: when Jack reports a set as "completed, 2 RIR" and then fails the next set with no load change and standard rest, the gap between expected and actual reps is a direct bias data point. Each such event contributes a bias estimate with weight 1.0.

2. **AMRAP or max-effort validation sets** (optional, every 4 weeks, one exercise): "Today, take the 8th rep of set 1 as far as you comfortably can. No need to max out; just don't stop early." The difference between where Jack stopped and the prescription is a bias estimate. Weight 0.8.

3. **Push-set escalation**: when Jack reports high RIR (≥ 3) and accepts the "go heavier" suggestion, tracking where the new load lands relative to where true failure occurred gives a triangulation point. Weight 0.6.

### How the bias is stored

```typescript
// athlete_traits key: "effort.rirBias"
// value: {bias: number, method: "forensic" | "amrap" | "escalation", sessions: number}
// interpretation: reportedRir - bias = estimatedTrueRir
// example: bias = 1.8 means when Jack says "2 RIR", true RIR is ~0.2
```

The bias is a rolling median (not mean; resistant to outlier sessions where Jack genuinely did train hard). Confidence gates at 0.5 require ≥ 6 forensic events; 0.7 requires ≥ 15.

### How it affects prescriptions

At confidence ≥ 0.5:

```
targetRirPrescribed = targetRirNominal + rirBias
// example: if nominal is "2 RIR" and bias is 1.8, prescribe "≤ 0.2 RIR"
// but display to Jack as "2 RIR"; do not expose the correction
```

The internal representation uses corrected values; the Telegram message uses the nominal values Jack expects. This is not deceptive: it is the same thing a human coach does when they tell an under-training athlete "I want 2 left in the tank" while knowing the athlete will leave 4.

### How coaching cues close the gap (never silently accept it forever)

The RIR correction silently improves prescriptions. But the goal is also to genuinely improve Jack's calibration so the bias shrinks. Fortnightly (not weekly: education throttle), when bias is active and confidence ≥ 0.5, a brief calibration note appears in the post-session summary:

> "Quick note: your hardest set today had 2 reps left by my estimate, but you reported 4. That gap is common and fine. If you want to test your feel: try stopping one set earlier than you naturally would next time."

This is always framed as skill-building, never as criticism. The bias itself never appears as a number to Jack. Long-term goal: bias shrinks to < 0.5 and correction is no longer needed.

### Evidence entry required

`rir_calibration_skill` added to the evidence registry: why RIR is hard to judge, why chronic under-training is the most common plateau cause for natural trainees, why calibration is a coachable skill.

---

## A6. Rescue Session Framework (expanded)

### Philosophy

Rescue sessions are not a degraded version of real training. They are a **distinct product**: deliberately designed sessions for the situations where full training is not happening. The framing in all Telegram copy must reflect this.

Banned framing: "shortened workout", "quick session", "I know you're tired but..."
Required framing: "Your [Pump] session", "Arms and shoulders, 25 minutes", "This counts."

### Session types

```typescript
type RescueType =
  | "pump"           // 20-25 min, isolation arms/shoulders, machines, no setup cost
  | "med"            // 30-35 min, minimum effective dose, primary muscles only
  | "hotel"          // 20-30 min, dumbbells or cables only, any gym
  | "bodyweight"     // 20 min, no equipment required (push/pull/core variations)
  | "crowded"        // 35-40 min, machines and dumbbells only, no rack/cable dependencies
  | "drained"        // 20 min, 3 exercises, very low cognitive load, explicit low-effort approval
```

Each type is a pre-built template in the exercise catalogue. Templates are parameterised (loads come from progression states, not hard-coded) and updated nightly alongside the full session.

### Confidence-based session-opening

This is the most important architectural addition in the entire addendum and addresses a profile-specific risk:

> "Jack skips workouts if the first exercise feels intimidating."

**Rule: every rescue session type starts with the highest-confidence exercise for the target muscles, never a compound movement, never a contested-equipment exercise.**

For the pump session, this means: first movement is likely DB lateral raises or cable curls (machines, zero setup cost, enjoyment high, confidence high). Not incline press. Not lat pulldown. The easiest, most enjoyable thing first. Momentum is the product.

This rule also applies to the full session's first slot when Jack's friction estimate is high (medium+ friction → swap the first exercise to the highest-confidence option in that slot, even if a compound would be "better").

### Adherence accounting

Rescue sessions count as 1.0 in the north-star metric. No asterisk, no discount. The system makes this explicit once:

> "This counts as a full training day. Every week you show up for the short version, you're ahead of the you who didn't go."

This is said exactly once during the first rescue session completed. Never again. It should not become a repeated affirmation loop.

### Streak framing

No explicit streak counter in the UI. Streaks create "all or nothing" psychology: one miss shatters the streak, which is exactly the binary dropout pattern Jack has. Instead: the weekly review shows a completion bar that stays green even after a miss if the week still hit minimum sessions. The bar is "sessions this week vs plan" not "consecutive days".

---

## A7. Session Compression Engine (formalised)

### Time buckets and their rules

Pre-computed at session construction time; also applicable on-the-fly via TIME_LEFT event.

| Budget | Name | Rules |
|---|---|---|
| 75 min | Full | Programme as prescribed, standard rest |
| 60 min | Efficient | Rest compressed to 120s primaries / 60s accessories; drop 1 accessory set per muscle group |
| 45 min | Compressed | Rest 90s all exercises; drop to 2 sets on all accessories; remove 1 lowest-priority exercise entirely |
| 35 min | Rescue | Pre-built rescue/med template (§A6); progression states still apply |
| 20 min | Micro | 2-3 exercises, priority muscle only, machines/DBs, 2 sets each, 60s rest |

### What is never removed

Regardless of compression level, these survive:

- Warm-up for the first compound of the session.
- The top-1 exercise for today's priority muscle (e.g. if today is "arms and shoulders", one compound pressing movement stays at every compression level except micro).
- Pain and safety protocols.

### What is removed, in order

1. Lowest-priority muscle group's accessory sets (legs/abs first).
2. Duplicate-pattern accessories (second back exercise if two are scheduled).
3. Rest time on isolation movements.
4. Whole isolation exercises for non-priority muscles.
5. Back-off sets on primaries (keep the top-set).
6. (Micro only) Second exercise of a superset.

### On-the-fly compression via TIME_LEFT

When the TIME_LEFT event fires mid-session, the engine computes remaining sets × estimated time and selects the appropriate compression tier. It applies only to remaining exercises; completed sets are not affected. The reply is one line: "Compressing to [X] min: [what changed in one clause]."

---

## A8. Future Athlete Intelligence Layer

### What this is

Over 12-24 months of consistent logging, Cognix accumulates enough data to answer questions that are genuinely novel: Jack-specific truths no study has measured and no generic app can know.

This is not a separate engine to build now. It is a **design constraint on the data model**: every observation must be stored in a form that makes future cross-sectional queries possible. The implementation is good schema discipline. The intelligence emerges from the data.

### Query types and their data requirements

| Future question | Requires |
|---|---|
| Which exercises grow chest best? | `muscle_group_load` per exercise + measurement deltas, same mesocycle |
| How much weekly arm volume gives best growth? | effective sets per week vs measurement 28d delta |
| Does late caffeine reduce sleep? | supplement logs (time + dose) + wearable sleep quality |
| Which split gives highest adherence? | session completion rate per split type, over full blocks |
| Which coaching messages increase effort? | `llm_interactions` message variant + avg RIR that session |
| Which exercises consistently produce pain? | `pain_events` joined to exercise and load |
| When is Jack most likely to skip? | skip observations + weekday + readiness + friction signals |
| How long after travel does performance recover? | travel_flag observations + e1RM trend |
| Which supplements genuinely help? | supplement logs + readiness/performance pairs (N will be small; interpret cautiously) |

### Data model constraint

Every observation must carry: `subject`, `at`, `source_session_id`, and a `payload` that includes all relevant contextual numerics at the time of observation (readiness score, friction score, supplements taken that day, sleep hours). This context freezes the state at observation time so future queries can control for confounders.

The `supplement logs` table already exists in `DATA_MODEL.md`. Add: `taken_at_time` (not just date) to enable the caffeine-sleep query.

### When to surface these insights

Not in Phase 1-4. The data is too thin and the correlations are noise. Start surfacing in Phase 6+ monthly reviews, with explicit confidence disclosure: "Over the last 6 months, your arm measurements grew 0.4 cm more in blocks where you averaged 14+ sets/week than in blocks with 10-12 sets. This is based on your data, not a study."

Every such insight has provenance (time range, session count, effect size). No generic claims dressed as personal insights.

---

## A9. Behaviour-First principle: binding implementation rules

The following rules override any feature decision in the PRD or this addendum where they conflict.

1. **Default to the lazier recommendation.** When the system is uncertain whether to offer the full session or the rescue, offer rescue. The cost of a rescue session is minor. The cost of another miss is high (binary dropout pattern).

2. **One positive action per motivational message.** Every Telegram message where Jack is at risk of not going contains exactly one clear action he can take that is easier than what he was originally asked to do. Never a wall of options.

3. **Never let perfect be the enemy of minimum effective.** The programme is the ideal; the minimum effective dose is the floor; anything between them is a win. The UI and copy must never imply otherwise.

4. **No visible streak counters.** Streaks create brittle commitment and catastrophic failure modes. Weekly completion bars only.

5. **The skip itself is valuable data.** A logged skip with context is worth more than a missed log. The Telegram skip flow asks one optional question: "Anything specific got in the way?" (free text, optional, no pressure). The answer becomes an adherence observation. Never shame; always harvest.

6. **Complexity gates.** Before adding any new feature, the test is: "Does this increase or decrease the probability of the next workout happening?" If neutral or negative, defer until adherence is consistently ≥ 90%.

---

## A10. Architecture Review: honest technical co-founder assessment

### Issue 1: progression_states table vs athlete_traits (resolved, binding)

The PRD (§15) says `progression_states` is "re-derived as traits" but keeps the table. This creates two places for exercise state and they will drift. Binding decision:

**Abolish `progression_states` as a separate table. Materialise progression data as `athlete_traits` with key `exercise.{id}.progression`.** The nightly learner writes it; the prescription engine reads it from `athlete_traits`. One source of truth. The existing `progression_states` SQL from `DATA_MODEL.md` is replaced by a view for backwards-compatible querying if needed.

### Issue 2: pg_cron timer resolution is genuinely too coarse for rest timers

pg_cron runs at 1-minute intervals. Rest periods are 60-180 seconds. The "target time in message" pattern (PRD §13.2) works because the user sees "rest until 19:12" and manages their own timer. This is acceptable for Phase 1 but is an acknowledged UX limitation, not an architectural decision.

**Real fix:** Telegram's own timer button. Grammy/telegraf supports delayed auto-replies via a scheduled message (Telegram Bot API `sendMessage` with a future timestamp on Telegram's servers). This is sub-minute-accurate and requires no server-side job. Use this from Phase 1 instead of the pg_cron sweep. The interface does not change; only the implementation of the "send next set message" effect changes.

Downside: dependent on Telegram's API reliability. Acceptable for personal use; revisit if ever going multi-user at scale.

### Issue 3: Athlete Model nightly materialisation latency

If the Athlete Model is wrong (a bad trait update, a bug in the learner), the error persists for up to 24 hours. For slow-moving traits (preferred exercises, recovery windows) this is fine. For safety-adjacent data (new pain event), it is not.

**Fix:** add `invalidate_athlete_model(userId, reason)` function that triggers immediate regeneration (or at minimum marks the cached model stale so the next request regenerates it). Trigger this on: pain ≥ 5 event, new body measurement, user challenge to any observation. Cost: one extra Postgres Edge Function invocation per event. Negligible.

### Issue 4: observation store will not perform at 5 years of continuous use without indexes

Append-only is correct. But at 3 sets × 4 exercises × 4 sessions/week × 52 weeks × 5 years = ~12,500 `set_performed` observations, plus check-in and technique observations, the table will have ~50,000 rows per user. This is trivially small for PostgreSQL; no concern. However, trait derivation queries must use index-range scans, not table scans.

Required indexes (add to migrations from Phase 1):

```sql
CREATE INDEX obs_user_kind_subject ON observations(user_id, kind, subject);
CREATE INDEX obs_user_at ON observations(user_id, at DESC);
CREATE INDEX obs_session ON observations(source_session_id) WHERE source_session_id IS NOT NULL;
```

At 5 years and single user, these are all the indexes needed. If multi-user: also `obs_kind_at` for admin analytics.

### Issue 5: LLM Gateway needs a token budget, not just provider routing

The current design routes to providers but has no per-call token ceiling. A freetext message from Jack like "so I did the incline press, 30 each hand, managed 9 reps on set 1 and it felt about 2 reps left, then 8 on set 2 a bit harder, maybe 1 left, and 7 on set 3, struggled a bit, grip was slipping slightly, wondering if I should go heavier next time or maybe try 32?" is a single parse call that could cost 2000 tokens if the context is assembled naively.

**Fix:** hard token caps per call type in `LlmRouterPolicy`:

```typescript
interface LlmRouterPolicy {
  parse:   { providers: ProviderPref[]; maxContextTokens: 800;  maxOutputTokens: 200 };
  explain: { providers: ProviderPref[]; maxContextTokens: 3000; maxOutputTokens: 600 };
  review:  { providers: ProviderPref[]; maxContextTokens: 6000; maxOutputTokens: 2000 };
  fallbackTimeoutMs: number;
}
```

Parse is cheap and fast. If context assembly would exceed 800 tokens, truncate to: current set prescription + last set result + session cursor. Nothing else. The parse task does not need athlete history.

### Issue 6: Friction Engine and Readiness Engine must not be merged (re-affirmed)

Several implementations of dual-score systems merge them into a single "daily score". Do not do this. The two scores answer different questions, have different update cadences (readiness is computed from overnight data; friction updates as check-in inputs arrive), and must be independently explainable in the Telegram brief. A merged score loses this transparency.

Keep them as separate engine calls that both feed into `session_variant` selection. The combination logic is:

```typescript
function selectSessionVariant(readiness: ReadinessOutput, friction: FrictionEstimate): SessionVariant {
  if (readiness.mode === "rest") return "rest";
  if (friction.level === "blocking") return friction.score >= 90 ? "rest" : "micro";
  // readiness transforms the prescription quality; friction transforms the variant
  const base = frictionToVariant(friction.score);
  if (readiness.mode === "deload" && base === "full") return "efficient";
  return base;
}
```

### Issue 7: Evidence registry staleness is a real risk at 3+ years

The `lastReviewed` field exists. Who sets it? The answer must be: a logged task, not a hope. Add to the nightly learner: entries not reviewed in > 365 days are flagged in the monthly review as "stale: consider reviewing". The entry still functions; the flag is informational. At personal-project scale, Jack can review them manually. If this ever scales, the review becomes a task queue.

### Issue 8: Coaching observation discovery needs a guard against spurious correlations

The Learning Engine will find correlations. At < 50 observations, spurious correlations are common (correlation over 6 events in a small sample tells you nothing). The discovery guard:

```
New coaching observation requires:
  - ≥ 8 confirming observations (not 6, not 4)
  - effect size > 10% (not 2%, not 5%)
  - not already explained by a known confound (readiness, weekday, fatigue)
  - only proposed in weekly review, never mid-session
```

The 8-observation floor prevents the system from making claims after one bad Monday or one enthusiastic Tuesday.

### Issue 9: the first-exercise intimidation effect (coaching observation) must gate programme generation from day one

This is seeded as a coaching observation (§A4) but it is important enough to be a hard rule from Phase 1, before there is any learned data:

**Programme generation rule:** The first exercise of every session must have exercise confidence ≥ 60 (or seed value ≥ 60 for new exercises). If the planned first exercise is below that, swap it with the highest-confidence exercise of the same slot. Write a `coach_decisions` row.

This is not a preference. It is a direct countermeasure to a known, documented adherence risk.

### Issue 10: the 5-year architecture question: what becomes painful?

Genuinely the most important long-term question. Honest assessment:

**Things that will not become painful:**
- Append-only observations + nightly trait derivation. Simple, replayable, debuggable. This design gets better at scale, not worse.
- The state machine (pure reducer). Testable forever. Never needs rewriting.
- The provider abstraction in the LLM gateway. Adding providers is a new file, not a refactor.

**Things that will become painful:**
- The `athlete_traits` table with a single `value JSONB` column. As trait types proliferate, querying specific trait types requires `WHERE key LIKE 'exercise.%'` pattern scans. At 5 years and 200+ exercises, this will be slow without the index from Issue 4. Consider: a typed `trait_values` table per trait type (exercise traits, adherence traits, physiology traits) if query complexity grows beyond what indexes handle. Add this only if pg_explain shows it is needed; not before.
- Nightly learner as a single Edge Function. At 2+ users, the learner will timeout if it processes everyone sequentially. Solution: per-user invocations, already trivially parallelisable because the learner is stateless per user.
- The Athlete Model as a single JSONB document. At 5+ years, the document will grow. The solution is already in the design: materialise it nightly, version it, and query specific sections. Do not load the full document into every LLM context; assemble slices. This design already handles it correctly; just do not accidentally start passing the full model to the LLM.

**Things that are missing now but will be needed at scale:**
- A `coach_decisions` index on `(user_id, rule_id)` for audit and pattern queries.
- A rate-limit + cost-tracking layer on the LLM gateway (token spend per day, alert at threshold). Fine to skip in Phase 1; add in Phase 3 before real LLM usage scales.
- Schema migration management (Supabase migrations already planned; just ensure every table change is a numbered migration from day one, never a manual ALTER in production).

---

## A11. New database additions

```sql
-- Friction estimates (stored per day, not per session; friction can change before session starts)
CREATE TABLE friction_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  level TEXT NOT NULL,
  signals JSONB NOT NULL,
  recommended_variant TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Coaching observations (§A4)
CREATE TABLE coaching_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  statement TEXT NOT NULL,
  domain TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0,
  first_observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirming_observation_ids UUID[] NOT NULL DEFAULT '{}',
  influences_programming BOOLEAN NOT NULL DEFAULT false,
  programming_effect TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  provenance TEXT NOT NULL DEFAULT 'learned'  -- or 'seeded' or 'user_asserted'
);

-- Required index additions
CREATE INDEX obs_user_kind_subject ON observations(user_id, kind, subject);
CREATE INDEX obs_user_at ON observations(user_id, at DESC);
CREATE INDEX obs_session ON observations(source_session_id) WHERE source_session_id IS NOT NULL;
CREATE INDEX coach_decisions_rule ON coach_decisions(user_id, rule_id);
CREATE INDEX traits_user_key ON athlete_traits(user_id, key);
```

---

## A12. New TypeScript additions

```typescript
// Addendum types (extend src/lib/types.ts)

type SessionVariant = "full" | "efficient" | "compressed" | "rescue" | "micro" | "rest";
type RescueType = "pump" | "med" | "hotel" | "bodyweight" | "crowded" | "drained";

interface FrictionEstimate {
  score: number;
  level: "low" | "medium" | "high" | "blocking";
  signals: { kind: string; raw: number; weight: number }[];
  recommendedVariant: SessionVariant;
  confidenceInEstimate: number;
}

interface ExerciseConfidence {
  exerciseId: string;
  value: number;                         // 0-100
  components: {
    enjoyment: number;
    technique: number;
    consistency: number;
    pain: number;
    stability: number;
  };
  confidence: number;
}

interface CoachingObservation {
  id: string;
  userId: string;
  statement: string;
  domain: "motivation" | "technique" | "adherence" | "response" | "preference";
  confidence: number;
  firstObservedAt: string;
  lastConfirmedAt: string;
  confirmingObservationIds: string[];
  influencesProgramming: boolean;
  programmingEffect?: string;
  active: boolean;
  provenance: "learned" | "seeded" | "user_asserted";
}

interface RirCalibration {
  bias: number;                          // reportedRir - bias = estimatedTrueRir
  method: "forensic" | "amrap" | "escalation";
  sessions: number;                      // observations contributing
  confidence: number;
}

// Session variant selection (pure function, deterministic)
function selectSessionVariant(
  readiness: { mode: Mode },
  friction: FrictionEstimate,
): SessionVariant;
```

---

## A13. Phase additions (addendum scope)

These additions slot into the existing phase plan (PRD §20) without reordering anything.

**Phase 1 additions:**
- `friction_estimates` table + daily friction computation from check-in inputs.
- First-exercise confidence gate (from seed values; learned confidence arrives in Phase 6).
- Rescue session types (pump, med, crowded) pre-computed nightly.
- Session variant selection wired into morning message.
- Telegram timer via `sendMessage` scheduled send (replaces pg_cron sweep).
- Weekly completion bar (no streak counter).
- `invalidate_athlete_model` trigger on pain ≥ 5 events.

**Phase 2 additions:**
- LLM gateway token caps per call type.
- `coaching_observations` table, seeded from profile.
- `/athlete` page shows exercise confidence badges and coaching observations.

**Phase 3 additions:**
- RIR calibration engine: forensic evidence from set logs; bias trait; internal correction applied; fortnightly calibration coaching note.
- Motivation baseline traits from 8+ weeks of history; feeds friction estimate prior.

**Phase 6 additions (Learning Engine):**
- Exercise confidence learned from observations (overrides seed values).
- Coaching observation discovery with 8-observation floor.
- Motivation prediction from historical adherence patterns.
- Future athlete intelligence queries (internal; not surfaced yet).

**Phase 7 additions:**
- Future athlete intelligence surfaced in monthly/mesocycle reviews with provenance and effect sizes.

*End of addendum.*