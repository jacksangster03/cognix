# Cognix Coaching Specification

## The shift: dashboard to closed-loop coaching system

Cognix observes your body, training history, schedule and goals, then decides what training stimulus is appropriate today, coaches you through it in Telegram, and learns from the result.

The existing architecture has the correct foundation: deterministic calculation, provider-normalised data, readiness scoring, ACWR, planning and an optional LLM explanation layer. The next step is to turn it from a dashboard you inspect into a closed-loop coaching system.

---

## The complete product loop

```
Measure
  Renpho, Garmin, Oura, Strava, weather, calendar, manual check-in
        ↓
Understand
  Readiness, fatigue, training load, muscle recovery, progression status
        ↓
Plan
  Choose workout, exercises, sets, reps, loads and targets
        ↓
Coach
  Deliver one instruction at a time through Telegram
        ↓
Observe
  Record weight, reps, RIR, pain, technique and subjective difficulty
        ↓
Adapt
  Modify the current session and future programme
        ↓
Learn
  Update exercise-specific strength estimates and response patterns
```

---

## Three timescales

The coaching system operates on three distinct timescales. These are separate engines. An LLM alone must not control all three.

| Timescale | Engine | Horizon |
|---|---|---|
| Long-term programming | Programme engine | 8–12 weeks |
| Daily planning | Readiness + prescription engine | Today |
| Live session adaptation | Autoregulation engine | Current set |

---

## Athlete profile

### Stable profile

Changes infrequently. Set during onboarding, updated manually.

```yaml
athlete:
  goals:
    primary:
      - retain_or_build_muscle
      - improve_mtb_endurance
      - build_toward_half_marathon
    secondary:
      - reduce_body_fat_gradually
      - improve_boxing_conditioning
  constraints:
    available_days: 5
    typical_session_minutes: 60
    preferred_training_time: evening
    gym: Basic-Fit
    weekly_mtb_preference: weekend
  preferences:
    likes:
      - weighted_pullups
      - dumbbell_press
      - cable_lateral_raise
      - mountain_biking
      - running_outdoors
    dislikes:
      - very_high_rep_leg_training
      - excessively_long_gym_sessions
    exercise_substitutions:
      barbell_back_squat:
        - hack_squat
        - leg_press
  experience:
    strength_training_years: 3
    running_level: beginner
    cycling_level: intermediate
    boxing_level: beginner
  equipment:
    - full_commercial_gym
    - pullup_bar
    - mountain_bike
    - running_shoes
  schedule_rules:
    avoid_heavy_legs_before_mtb: true
    minimum_hours_between_hard_leg_sessions: 48
```

### Dynamic state

Updated daily from wearables, check-ins and manual input.

- Body weight and rolling weight trend
- Body-fat estimate (treated as noisy; use trend not point value)
- Sleep duration and quality
- HRV deviation from personal baseline
- Resting heart rate
- Soreness by muscle group
- Pain flags
- Stress and motivation
- Previous training load (ACWR)
- Recent exercise performance per movement
- Endurance volume (running, cycling)
- Calorie and protein band
- Current schedule and available time windows
- Local weather
- Illness flags

### Learned profile

Derived from accumulated data, not asserted by the user or LLM.

- Which exercises you progress on quickly
- Estimated reps at different RIR values per exercise
- Intra-set fatigue dropoff per movement
- Recovery time by muscle group
- Sensitivity to poor sleep
- Sensitivity to training time of day
- Caffeine effect on performance vs. sleep quality
- Ideal frequency per movement pattern
- Exercises associated with recurring discomfort
- Adherence by workout length and weekday
- Whether morning readiness actually predicts performance

This must be learned from data, not asserted by the LLM.

---

## Priority hierarchy

Without explicit priorities every subsystem will try to maximise itself. The system must respect this order:

1. Remain healthy and consistent
2. Build MTB endurance
3. Preserve or gain muscle
4. Build running base
5. Improve boxing conditioning
6. Reduce body fat gradually

---

## Managing concurrent strength and endurance

Training stress is multidimensional. The system must track separate load dimensions:

- `global_load`
- `strength_lower_load`
- `strength_upper_load`
- `running_load`
- `cycling_load`
- `high_intensity_cardio_load`
- `muscle_group_load` (per group)
- `connective_tissue_load_proxy`

A hard upper-body session does not create the same constraints as hill sprints. A 100 km ride should not prevent a moderate upper-body workout solely because global ACWR is elevated.

### Interference rules

```
Hard MTB tomorrow:
  avoid heavy lower-body eccentric work today

Heavy lower session today:
  next run should be easy or postponed

Long ride completed:
  upper body remains available
  lower body high-intensity is restricted

Beginner running load rising:
  increase frequency or volume gradually
  do not simultaneously increase distance, pace and elevation
```

### Weekly template (constraint-based, not fixed)

```
Required in every rolling 8 days:
  - 2 upper-body strength exposures
  - 2 lower-body strength exposures
  - 1 long aerobic session
  - 1 easy aerobic session

Constraints:
  - No hard lower session within 36 hours before long MTB
  - No two high-fatigue sessions consecutively when readiness is suppressed
  - Minimum 48 hours between high-volume exposures for same muscle group
  - Maximum 3 high-load days in any 5-day window
```

---

## Memory layers

Do not send full history to the LLM on every message. Use four layers:

| Layer | Content | Scope |
|---|---|---|
| Immediate | Current exercise, set, prescription, previous set result | Current set |
| Session | Exercises completed, accumulated fatigue, time elapsed, live feedback | Current session |
| Recent | Last 3–6 exposures for current exercise, relevant recovery data | Past 2–3 weeks |
| Long-term summary | Structured athlete profile: working loads, rep ranges, trends, technique notes | Periodically regenerated |

The database is the memory. The LLM receives a retrieved slice.

Example long-term summary entry:

```json
{
  "incline_dumbbell_press": {
    "current_working_load_each_kg": 30,
    "typical_rep_range": [7, 9],
    "usual_target_rir": 2,
    "recent_trend": "improving",
    "notes": [
      "prefers_30_degree_bench",
      "right_shoulder_discomfort_at_45_degrees"
    ]
  }
}
```

---

## Body metrics

### Renpho integration

No documented public Renpho API exists. Available routes:

1. Unofficial reverse-engineered client (fragile; breaks on Renpho endpoint changes)
2. Third-party aggregator (Terra advertises a Renpho connector)
3. Sync Renpho into another health platform and pull from there
4. Periodic CSV export or manual entry

**Recommended sequence:**

Phase 1: Manual Telegram weight logging (`Weight today? → 76.4`). Sufficient for all downstream features.

Phase 2: Renpho CSV import or health platform intermediary.

Phase 3: Terra only if you want production-grade provider aggregation.

**Do not make an unofficial Renpho endpoint a critical dependency.** Use a provider adapter:

```python
class BodyMetricsProvider(Protocol):
    async def fetch_measurements(
        self,
        start: datetime,
        end: datetime
    ) -> list[BodyMeasurement]:
        ...
```

Implementations: `ManualBodyMetricsProvider`, `CsvBodyMetricsProvider`, `RenphoUnofficialProvider`, `TerraRenphoProvider`, `AppleHealthImportProvider`.

### Interpreting body composition data

Daily bioelectrical impedance readings vary with hydration, food intake, glycogen, exercise, skin temperature and time of day. Store all measurements but base decisions on:

- 7-day median weight
- 14–28-day weight trend
- Smoothed body-fat trend
- Waist measurement
- Gym performance and adherence

Body composition informs long-term energy strategy, not today's workout load.

---

## Supplements and nutrition

Safe to manage:

- Reminders and timing
- User-defined dosages
- Adherence tracking
- Caffeine total and cutoff
- Broad nutrition bands
- Hydration planning
- Carbohydrate planning around long endurance sessions

Must not do: autonomously generate a pharmacological stack or alter supplement schedules without explicit user instruction.

```json
{
  "name": "creatine_monohydrate",
  "user_defined_dose": "5 g",
  "schedule": "daily",
  "preferred_time": "with_meal",
  "source": "user_configured",
  "active": true
}
```

Distinguish: `user_configured_routine` | `evidence_summary` | `system_reminder` | `clinician_directed`.

For anything medication-related: log and remind only according to user's own instructions or a clinician's prescription.

---

## Privacy and security

This dataset contains unusually sensitive personal health data.

Required:

- Row-level security on all tables
- Encrypted provider tokens at rest
- No provider token in any frontend code
- Telegram user ID allow-list (reject all unknown users)
- One Cognix account linked to exactly one authorised Telegram identity
- Webhook secret verification
- Audit trail for every automated coaching decision
- Deletion and export mechanisms
- Minimal LLM payloads (aggregated values, not raw health history)
- Configurable retention of raw provider JSON
- Separation of production and demo data

The Telegram bot must reject unknown users:

> This bot is private and this Telegram account is not authorised.

Add `/privacy` command showing which data sources are active and what has recently been sent to an LLM.

---

## What is deterministic vs adaptive

| Decision | Approach |
|---|---|
| Readiness score | Deterministic |
| Safety stop | Deterministic, hard rules |
| Exercise progression | Deterministic rules initially |
| Session volume adjustment | Deterministic |
| Natural-language parsing | LLM |
| Daily explanation | LLM |
| Clarifying questions | LLM |
| Workout selection | Constraint solver + deterministic ranking |
| Exercise substitution | Ranked rules, LLM explains |
| Long-term response patterns | Statistical model |
| Motivational tone | LLM |
| Programme architecture | Templates and constraints, not unconstrained LLM |

---

## Build sequence

### Phase 0: Resolve the coaching specification (pre-code)

Before adding APIs, define and document:

- Goals and priority order
- Preferred training split
- Exercise catalogue with starting weights
- Rep ranges and progression rules per exercise
- Pain and safety rules
- Telegram conversation design
- Units and load conventions
- What "easy", "right", "hard" and "failed" mean numerically

Deliverables: `COACHING_SPEC.md`, `EXERCISE_CATALOGUE.yaml`, `PROGRESSION_RULES.md`, `TELEGRAM_FLOWS.md`, `SAFETY_RULES.md`

### Phase 1: Telegram workout logger (no LLM, no wearables)

- Private Telegram bot
- `/today`, `/start`, one-set-at-a-time delivery
- Buttons for set results (Completed / Easy / Hard / Failed / Pain / Skip / Swap)
- Rest timer
- Session completion summary
- PostgreSQL persistence
- Simple double progression
- Cognix workout history page

This alone is immediately useful as a daily training tool.

### Phase 2: Natural-language session input

Add LLM only as a parser. Support:

- "30 each for 8, about 2 RIR"
- "failed fifth rep"
- "easy, go heavier"
- "right shoulder feels weird"
- "machine is occupied"
- "I only have 30 minutes"

Every parsed action requires Zod/Pydantic schema validation and confidence scoring before persistence.

### Phase 3: Personalised prescription engine

- Exercise performance histories and estimated strength
- Target loads, top-set and back-off logic
- Volume tracking by muscle group
- Exercise-specific progression
- Automatic substitutions
- Daily readiness modifications

### Phase 4: Strava and calendar

- Running and cycling ingestion
- Weekly endurance load
- MTB scheduling
- Calendar-aware workout timing
- Interference management
- Event preparedness scoring

### Phase 5: Body metrics

- Manual daily weight first (Telegram prompt)
- CSV import
- Smoothed trends and waist measurements
- Renpho adapter or aggregator
- Body-weight-aware load interpretation

### Phase 6: Recovery provider

- Oura or Garmin recovery data
- Retire mock biometrics
- Calculate data confidence from live inputs

### Phase 7: Closed-loop programming

- Rolling weekly plan with automated rescheduling
- Mesocycle progression and deload detection
- Adherence-aware programme changes
- Individual response modelling
- Post-block evaluation

### Phase 8: Garmin workout publishing

- Publish structured sessions to Garmin watch
- Reconcile Garmin completion data
- Retain Telegram as the conversational control layer

---

## Primary validation question

After four weeks, is Cognix more convenient and more accurate than opening a spreadsheet or workout app?

---

## Core product principle

> Deterministic systems prescribe and record. Statistical models learn. The LLM communicates and interprets.
