# Cognix Coach: Product Requirements Document

**Version:** 1.0 (2026-07-09)
**Author:** Fable, acting as Head of Product / co-founder
**Status:** Approved for phased implementation. No code in this document has been implemented; every schema and algorithm here is a specification.

---

## 0. Document purpose and canonical sources

This PRD defines the next major evolution of Cognix: from a readiness dashboard (v0.1) into a **closed-loop AI coaching platform**. It is the single implementation-ready product specification. It unifies and supersedes the product-level content of the existing spec documents where they conflict, and delegates to them where they are already correct.

### 0.1 Relationship to existing documents

| Document | Status after this PRD |
|---|---|
| `ARCHITECTURE.md` | Kept. Amended by §14 (backend language decision) and §21 (repo structure). |
| `COACHING_SPEC.md` | Kept for engine philosophy. **Its athlete profile block and priority hierarchy are stale and superseded** (see §0.2). |
| `PROGRESSION_RULES.md` | Kept in full. Referenced, not duplicated. Extended by §9. |
| `SAFETY_RULES.md` | Kept in full. Non-negotiable. Extended by §18. |
| `TELEGRAM_FLOWS.md` | Kept. Extended by §13 (command set, timers, low-motivation flow). |
| `AI_STRATEGY.md` | Kept. Extended by §14 (provider abstraction, tool registry). |
| `DATA_MODEL.md` | Kept. Extended by §15 (new tables). |
| `ROADMAP.md` | Superseded for coaching scope by §20. Non-coaching items (Strava page, weather) fold into phases here. |

### 0.2 Canonical athlete truth

The canonical source of truth for who Jack is as a trainee is:

- `~/Documents/Obsidian/Claude/Domains/jack_gym_training_profile_master.md` (markdown master)
- `Jack_Gym_Training_Profile_Master.docx` (mirror in this repo)

**Known conflicts with `COACHING_SPEC.md`, resolved in favour of the master profile:**

| Topic | COACHING_SPEC (stale) | Master profile (canonical) |
|---|---|---|
| Available days | 5 | 3 standard, 4 good week, 2 minimum |
| Session length | 60 min | ~75 min, plus 30-40 min fallback |
| Priority #2 | MTB endurance above muscle | Hypertrophy/aesthetics above endurance |
| Signature lifts | Weighted pull-ups | DB/machine pressing, rows, arms, laterals |
| Pressing constraint | Not mentioned | Palm pain 6-7/10 on heavy barbell bench |
| Cable access | Assumed | Single unreliable station; never programme-critical |

`COACHING_SPEC.md` §"Athlete profile" and §"Priority hierarchy" must be updated to match during Phase 0 of implementation.

### 0.3 Revised priority hierarchy (canonical)

1. Remain healthy and consistent (adherence is the product).
2. Hypertrophy: arms, shoulders, chest, upper back (aesthetic recomp, V-taper).
3. Reduce belly fat gradually (recomp, never aggressive cut).
4. Build running base (5K → 10K → half-marathon foundation).
5. Build MTB endurance toward Madrid-Segovia 2027.
6. Boxing conditioning.
7. Legs: minimum effective volume for balance and athleticism.
8. Strength PRs: motivational tool only, never a programming target.

---

## 1. Product vision

### 1.1 What Cognix Coach is

Cognix Coach is a **closed-loop adaptive coaching platform**. It is not a workout generator (generates once, never learns), not a fitness tracker (records but never decides), and not a chatbot (talks but has no state, no memory discipline and no safety floor).

The experience target: **an elite personal coach who knows Jack extremely well and gets measurably better every week.** A great human coach observes the athlete walk in, knows what happened last session, adjusts today's plan before the first set, watches every set, adapts between sets, and quietly updates their mental model of the athlete on the way home. Cognix Coach replicates that loop in software:

```
Observe → Understand → Plan → Coach → Log → Adapt → Learn → repeat
```

Mapped to system components:

| Loop stage | Component | Timescale |
|---|---|---|
| Observe | Integration Hub + check-ins + set logs | Continuous |
| Understand | Readiness Engine + Athlete Model | Daily |
| Plan | Programme Engine + Prescription Engine | Weekly / daily |
| Coach | Live Workout Engine via Telegram | Per set |
| Log | Session state machine → database | Per set |
| Adapt | Autoregulation Engine | Per set / per session |
| Learn | Learning Engine | Nightly |

Every workout must leave the system knowing more about Jack than before it. If a session produces logs but no updated beliefs, the loop is broken.

### 1.2 Product goals

Cognix becomes, in order of maturity:

1. **Jack's primary gym coach**: prescribes, coaches and adapts every strength session.
2. **Jack's endurance coach**: schedules and protects runs and rides, manages interference with lifting, builds toward Madrid-Segovia 2027.
3. **Jack's recovery coach**: readiness, sleep, caffeine cut-off, deload timing.
4. **Jack's exercise science teacher**: every recommendation carries a one-tap "why" backed by an evidence registry.
5. **Jack's long-term athletic database**: the richest, most personal training record he owns, exportable, queryable, and better than any commercial platform's model of him.

### 1.3 North-star metric

**4-week rolling adherence to the minimum plan** (sessions completed ÷ minimum sessions planned, capped at 1.0 per week). Everything else (strength trend, volume, readiness accuracy) is secondary. A theoretically perfect programme with 60% adherence loses to a decent programme with 95% adherence, always.

Guardrail metrics: pain-event rate, time-in-session vs budget, measurement trend (waist, arms), user-reported coach trust (weekly 1-question pulse).

---

## 2. Core philosophy → binding design rules

The seven principles, each turned into a rule an implementer can apply without judgement:

1. **Consistency before optimisation.** Any feature that adds friction to starting or finishing a workout is rejected regardless of theoretical benefit. The 2-day week is a first-class programme variant with its own progression logic, not a degraded state.
2. **Hypertrophy before strength.** Default progression is double progression in 6-15 rep ranges. e1RM exists for trend detection and returning-from-break estimates only. The UI never celebrates 1RM; it celebrates rep PRs, volume PRs and measurement changes.
3. **Long-term adherence over perfect programming.** The Learning Engine's adherence traits (§11) outrank stimulus traits when they conflict. If Jack completes 95% of sessions containing machine press but 70% of sessions containing barbell bench, machine press wins even if barbell is marginally "better".
4. **Minimal friction.** Logging a set must take ≤ 2 taps or one short natural-language message. Anything the system can pre-fill, it pre-fills. No mandatory fields beyond reps.
5. **Scientific evidence.** Every deterministic rule in the engines traces to an entry in the Knowledge Engine's evidence registry (§12). No rule without a registry entry.
6. **Personalisation.** Defaults come from evidence; overrides come from Jack's observed data. Observed data wins once confidence exceeds threshold (§11.4).
7. **Progressive learning.** Every engine writes observations; the nightly learner turns observations into beliefs with confidence scores; beliefs feed back into prescriptions. No belief without observations; no observation discarded.

Corollary, inherited from the repo and kept as the core engineering principle:

> **Deterministic systems prescribe and record. Statistical models learn. The LLM communicates and interprets.**

---

## 3. Co-founder review: pushbacks and improvements

You asked me not to follow the spec blindly. Here is where I disagree or extend, with reasons. Each decision is binding for the PRD unless you overturn it.

### 3.1 Backend language: stay TypeScript, do not build the FastAPI service yet

`ARCHITECTURE.md` prefers a Python FastAPI coaching service. I recommend against it for the next 3-4 phases.

Reasons:

- Every engine that exists today (`scoring.ts`, `recommendations.ts`, `planner.ts`, `confidence.ts`, `training.ts`) is already pure TypeScript with no React imports. A Python service means rewriting working, tested logic in a second language, which directly violates this PRD's own "no future rewrites" constraint.
- One language means one set of types. Zod schemas validate LLM output, Telegram payloads, API routes and database rows with the same definitions. A Python split forces schema duplication (Zod + Pydantic) that will drift.
- The claimed Python advantage (numerical modelling) is not needed until several months of data exist (`PROGRESSION_RULES.md` says exactly this). Rolling averages, medians and simple regressions are trivial in TypeScript.
- Solo developer, student schedule. Two deploy targets, two dependency trees and two CI pipelines is a tax paid every week for a benefit that arrives in a year, if ever.

Decision: **coaching service is a TypeScript worker** (long-running Node process or Next.js route handlers + a small always-on webhook host for Telegram; see §13.2). Revisit Python only at the statistical-modelling phase (Phase 6+), and even then as a narrow analytics sidecar reading from Postgres, never in the live coaching path.

### 3.2 Priority hierarchy correction

`COACHING_SPEC.md` ranks MTB endurance above muscle. The master profile is unambiguous: aesthetics and hypertrophy first, endurance rank 7 of 8. §0.3 is the corrected hierarchy. This changes real behaviour: interference rules now protect **upper-body hypertrophy** as the primary asset (e.g. a long ride must not cause the system to strip pressing volume; it restricts lower-body work instead).

### 3.3 "Observe" belongs at the top of the loop, and "Understand" needs a noun

Your loop is right. One refinement: **Understand must produce a persistent artefact, not just a score.** The Readiness Engine's output is ephemeral; what accumulates is the **Athlete Model** (§17), a versioned document of beliefs with confidence. Every stage reads from and writes to it. Without this, "the app learns" degenerates into "the app has logs".

### 3.4 Feature you did not ask for but need: the Rescue Session

The profile's single biggest risk is binary adherence collapse ("when busy, stops going entirely"). Readiness modes handle physiology; nothing in the spec handles **motivation failure**. I am adding a first-class session type:

- **Rescue Session**: 30-40 min, 4-5 movements, priority muscles only, pre-computed for every training day, one tap from the morning message ("Short on time/energy? → 35-min version").
- Triggered proactively: if no session logged by a configurable hour on a planned day, Telegram offers the Rescue Session, never a guilt message.
- Completing a Rescue Session counts as full adherence in the north-star metric. This is deliberate: the metric must reward the behaviour we want (showing up), not punish the accommodation.

### 3.5 Feature you did not ask for: coach trust dial (autonomy levels)

An elite coach earns autonomy gradually. So should Cognix. Three levels, user-controlled:

- **Level 1 (Propose):** every adaptation is a suggestion with Accept/Decline buttons.
- **Level 2 (Act and report):** intra-session adaptations apply automatically with a one-line reason; programme-level changes still propose.
- **Level 3 (Full auto):** everything applies automatically; weekly review lists all decisions for retroactive challenge.

Default Level 1 for the first two weeks, then prompt to upgrade. This converts "do I trust the algorithm?" from a binary abandonment risk into a progression mechanic.

### 3.6 Feature you did not ask for: session pre-brief with delta

The morning message must always answer "what changed since last time and why" in ≤ 3 lines (e.g. "Incline press: 28 kg today, up from 26. You hit 3×12 on Tuesday."). Change-blindness is why people distrust adaptive apps. Every delta is traceable to a `coach_decisions` row.

### 3.7 Pushback: photos need a consent-and-storage design, not a feature checkbox

The Long-term Athlete Model brief includes photos. Storing progress photos raises the sensitivity ceiling of the whole database (Supabase storage bucket, separate RLS, no LLM access ever, excluded from any export shared externally). Photos are Phase 5+, opt-in, local-encrypted-first. Do not bolt them on early.

### 3.8 Pushback: "approximately 15,000-25,000 words" is the wrong target

Ruthlessly: word count is not a quality metric, and padded PRDs rot. This document optimises for **zero ambiguity per section**, not length. Where an existing repo doc already specifies something correctly (e.g. the full autoregulation rule set in `PROGRESSION_RULES.md`), this PRD references it instead of restating it, because duplicated specs drift and drifting specs cause bugs. Everything you listed as a deliverable is here; nothing is here twice.

### 3.9 Missing from your spec, added here

- **Plateau detection and stimulus rotation** (§9.6): double progression stalls silently; the engine must detect 3+ exposures without progress and act.
- **Time-boxing compressor** (§10.6): "I only have 45 minutes" must deterministically shrink a 75-minute session, not improvise.
- **Measurement cadence engine** (§17.3): 4-weekly waist/arm prompts; profile says measurements are currently unknown, so the system must actively acquire them.
- **Heat and fuelling protocol for endurance** (§16.6): Navacerrada failure was heat + fuelling, not fitness alone. Weather integration exists in the roadmap; it must gate long-ride recommendations.
- **Offline gym resilience** (§13.7): Basic-Fit basements have bad signal. The state machine must tolerate delayed, out-of-order messages.
- **Data export** (§17.5): the "best athletic database" claim is empty if data cannot leave.

---

## 4. Users and personas

### 4.1 Primary persona (now): Jack

See canonical profile (§0.2). Compressed for design reference:

- 85 kg, recomp goal, hypertrophy-first, aesthetics-driven (arms > shoulders > chest > back > fat loss > abs > endurance > legs).
- 3-4 evening sessions/week, ~75 min, 2-day floor, 30-40 min rescue threshold.
- Basic-Fit Madrid: dumbbells to ~50 kg, machines, benches reliable; one contested cable station; racks queue.
- Palm pain 6-7/10 on heavy barbell bench (palmar hyperhidrosis history): neutral-grip DB and machine pressing are defaults.
- Weak mind-muscle connection in chest and back: cue-heavy coaching needed.
- Chronic under-effort (trains to mild discomfort): RIR calibration is a coaching feature, not an assumption.
- Motivation volatile; binary adherence failure mode; prefers shorter over easier when low.
- Creatine daily; occasional caffeine/beta-alanine/citrulline/salt pre-workout; late caffeine is a known sleep risk.
- Endurance: 1-2 runs, 1 weekend ride, boxing conditioning-first, Madrid-Segovia 2027.

### 4.2 Design-time persona (later): commercial user

Every schema carries `user_id` and RLS from day one (already the repo pattern). Nothing in the engines may hard-code Jack: his profile is **data** (rows in `athlete_profiles`, `athlete_traits`), never constants. The exercise catalogue, evidence registry and rule engine are user-agnostic; Jack is the first row. This costs almost nothing now and is the difference between a personal script and a product later.

What we deliberately do NOT build for the commercial persona yet: multi-tenancy admin, billing, coach marketplaces, social features. Single-tenant discipline, multi-tenant schema.

---

## 5. System overview

```
                    ┌──────────────────────────────┐
                    │        Telegram Bot           │
                    │  thin client: buttons, text   │
                    └──────────────┬───────────────┘
                                   │ webhook (secret-verified)
                                   ▼
┌───────────────┐        ┌──────────────────────────────┐
│ Next.js web   │  HTTP  │   Coach API (TypeScript)      │
│ analytics,    │───────▶│  route handlers + worker      │
│ config, review│        └──┬──────┬──────┬──────┬──────┘
└───────────────┘           │      │      │      │
        ┌───────────────────┘      │      │      └────────────────┐
        ▼                          ▼      ▼                       ▼
┌───────────────┐   ┌──────────────────┐ ┌────────────┐  ┌───────────────┐
│ Readiness     │   │ Programme +      │ │ Live       │  │ LLM Gateway    │
│ Engine        │   │ Prescription     │ │ Workout    │  │ parse/explain  │
│ (exists,      │   │ Engine           │ │ Engine     │  │ only           │
│ scoring.ts)   │   │                  │ │ (state     │  └───────────────┘
└───────────────┘   └──────────────────┘ │ machine)   │
        │                    │           └────────────┘
        │                    │                  │
        ▼                    ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL (RLS)                     │
│  athlete model · programmes · sessions · sets · observations ·   │
│  traits · decisions · evidence registry · integrations · audit   │
└───────────────────────────────┬─────────────────────────────────┘
                                │ nightly
                                ▼
                    ┌──────────────────────────┐
                    │     Learning Engine       │
                    │ observations → traits     │
                    └──────────────────────────┘
```

Five engines (matching `ARCHITECTURE.md`), one new subsystem (Knowledge Engine), one persistent artefact (Athlete Model). The web app remains analytics and configuration; Telegram remains execution; the database remains the memory.

---

## 6. User journeys

Format: trigger → system behaviour → user action → data written. Every journey ends with what the Learning Engine gets out of it.

### 6.1 Journey A: "I feel tired today" → workout complete

**07:45, morning readiness.** Overnight job has already ingested wearable data (when available) and computed provisional readiness. Telegram:

> Morning. Today: Upper A (push focus), ~70 min.
> Readiness 64 (Normal): sleep 6h 40m, slightly under your baseline.
> Change from plan: one fewer lateral-raise set.
> [Start when ready] [35-min version] [Move to tomorrow] [Check in first]

**08:10, Jack types:** "feel pretty tired tbh, rough night"

LLM Gateway parses to `{subjective_energy: low, sleep_quality: poor, source: freetext}`. This is a check-in observation, not a command. Readiness Engine re-runs deterministically: 64 → 51, mode Moderate. Moderate transformation applied per `SAFETY_RULES.md` (sets −20%, no prescribed failure, no load progression). Coach replies:

> Logged. Readiness now 51 (Moderate).
> Adjusted: 14 working sets instead of 17, no load increases today, same key movements. ~55 min.
> Tired days still count. Want the 35-minute version instead?
> [Full adjusted session] [35-min version] [Rest today]

Note what did NOT happen: the LLM did not choose the numbers. It parsed text; the engine transformed the plan by rule; the LLM phrased the reply.

**18:30, Jack taps [Full adjusted session].** Live Workout Engine instantiates the session state machine (§10). Warm-up → working sets, one instruction at a time, rest timers between. After set 1 of machine chest press comes in below target, next-set target adjusts per `PROGRESSION_RULES.md` live rules, with a one-line reason.

**19:40, session complete.**

> Done: 52 min, 13/14 sets, ~6,900 kg volume.
> Machine press held at 55 kg (readiness-adjusted day, no progression intended).
> Estimated upper-body recovery: ~48 h.
> How do you feel? [Better than expected] [As expected] [More fatigued] [Something hurts]
> Anything worth remembering?

Jack: "shoulder press machine felt better with seat one notch higher"

Stored as a technique observation on `machine_shoulder_press`, surfaced in the next pre-brief for that exercise.

**Learning Engine (overnight):** writes observations: completed-despite-low-readiness (+adherence resilience when offered adjusted session), per-set performance vs prediction at readiness 51 (calibrates his personal readiness-performance sensitivity), seat-height note (technique memory), zero pain events.

### 6.2 Journey B: skipped day (the one that matters most)

**Planned training day, 21:00, no session started, no message from Jack.**

> No pressure. If today's gone, tomorrow's session is ready.
> If you've got 30 minutes, here's the rescue version: 4 movements, arms and shoulders forward.
> [35-min rescue now] [Move to tomorrow] [Skip this one]

Rules: exactly one nudge, never two. Tone template is fixed (no LLM improvisation on motivational messaging without review; see §14.5). [Skip this one] is a valid, guilt-free answer and is recorded as an adherence observation with its context (weekday, readiness, session type), because *why* he skips is the single most valuable thing the Learning Engine can learn.

### 6.3 Journey C: pain mid-set

Set feedback [Pain] or freetext ("wrist felt weird on that"). Deterministic pain flow (`SAFETY_RULES.md`, unchanged): location + severity 0-10 prompt → ≥4 stops the exercise and offers non-provocative substitution from the catalogue's substitution graph filtered by `pain_region` tags → ≥7 terminates the session and requires explicit user confirmation before any future session includes that region. LLM may rephrase questions; thresholds live in code constants.

Learning Engine: pain event linked to exercise, load, set number, readiness. Three events on the same exercise in 90 days → exercise flagged `pain_associated`, prescription engine demotes it and the weekly review raises it explicitly.

### 6.4 Journey D: weekly review (Sunday evening, web app + Telegram summary)

Telegram gets the 6-line version; the web app gets the full page:

- Adherence vs plan (north star), with the rescue-session distinction shown honestly.
- Per-muscle-group effective sets vs target band.
- Progressions earned (rep PRs, load PRs), plateaus flagged.
- Readiness trend and its correlation with performance (once ≥ 4 weeks of data).
- Endurance load (runs/rides) and interference events.
- Every coach decision of the week, with reasons (the audit log rendered for humans).
- One question: "How was the coaching this week, 1-5?" (coach-trust pulse metric).

### 6.5 Journey E: monthly review

Adds: measurement prompt (waist, arms; §17.3), photo prompt (if enabled), volume-tolerance assessment (did he recover from the prescribed weekly sets?), exercise ranking shifts (favourite/effective/stalled), programme-level proposals for the next month (e.g. "swap DB lateral raise → cable when free: your logged stimulus ratings are higher").

### 6.6 Journey F: mesocycle review (every 8-12 weeks)

Block post-mortem per `PROGRESSION_RULES.md` §programme response comparison: strength trend per movement, volume tolerance, adherence by session type, pain frequency, measurement deltas, endurance progression. Output: next block's parameters (volume targets, exercise pool changes, deload spacing) as **proposals** requiring approval at trust Level 1-2.

### 6.7 Journey G: endurance day

Morning message for a planned ride: route-aware duration, **weather-gated** (>30°C forecast on a >90 min ride triggers the heat protocol: start-time suggestion, fluid/electrolyte/carb checklist, and a hard prompt if the ride exceeds his heat-adjusted load ceiling). Post-ride (manual log or Strava later): lower-body interference window applied to the next 36 h of strength prescriptions; upper body explicitly kept available per §3.2.

---

## 7. UX flows and state diagrams

### 7.1 Daily flow (top level)

```
                 ┌────────────┐
   overnight ───▶│ INGEST      │ wearables, weather, calendar
                 └─────┬──────┘
                       ▼
                 ┌────────────┐
                 │ READINESS   │ score + mode + constraints
                 └─────┬──────┘
                       ▼
                 ┌────────────┐   [Rest today]──▶ REST_LOGGED
   07:45 msg ───▶│ PROPOSED    │───[Move]───────▶ RESCHEDULED
                 └─────┬──────┘   [35-min]──────▶ RESCUE_VARIANT
                       ▼ [Start]
                 ┌────────────┐
                 │ LIVE SESSION│  (state machine, §10)
                 └─────┬──────┘
                       ▼
                 ┌────────────┐
                 │ DEBRIEF     │ feel + notes
                 └─────┬──────┘
                       ▼
                 ┌────────────┐
   nightly ─────▶│ LEARN       │ observations → traits → tomorrow's plan
                 └────────────┘
```

### 7.2 Message design rules (Telegram)

- One decision per message. Never two questions in one bubble.
- Buttons for the expected path, freetext always accepted in parallel.
- Every number the coach changes carries a ≤ 1-line reason.
- No message requires scrolling on a phone (≤ 8 lines).
- Exactly one unprompted nudge per day, ever (§6.2).
- All timestamps Europe/Madrid; all loads kg; per-hand loads always say "each".

### 7.3 Web app information architecture (additions to existing pages)

```
/dashboard      readiness + today (exists, gains "today's session" card)
/coach          NEW: programme view, block timeline, trust dial, decision log
/session/[id]   NEW: session detail, set-by-set, decisions inline
/reviews        NEW: weekly / monthly / mesocycle review archive
/athlete        NEW: Athlete Model browser: traits + confidence + evidence links
/knowledge      NEW: evidence registry browser, searchable
/measurements   NEW: tracker + charts (waist, arms, chest, shoulders, thighs, weight)
/integrations   exists, gains provider status + last-sync + data provenance
```

The Athlete Model browser (§17) is deliberately user-visible: Jack can see every belief the system holds about him, its confidence and its evidence. Transparency is a feature and a debugging tool.

---

## 8. Exercise catalogue (foundation for everything below)

The catalogue is the shared vocabulary of the Programme, Prescription, Live and Learning engines. It is seed data plus per-user extensions, not code.

```typescript
interface Exercise {
  id: string;                          // "incline_dumbbell_press"
  name: string;
  patterns: MovementPattern[];         // ["horizontal_press"]
  primaryMuscles: MuscleGroup[];       // ["upper_chest", "front_delt"]
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment[];              // ["dumbbell", "adjustable_bench"]
  equipmentReliability: "reliable" | "contested" | "unreliable"; // per user override
  gripStyle: "neutral" | "pronated" | "supinated" | "bar" | "rope" | "none";
  palmLoadRisk: 0 | 1 | 2 | 3;         // 3 = heavy barbell in palms; user-specific weighting
  repRangeDefault: [number, number];
  loadIncrementKg: number;             // smallest sensible jump (2 for DBs, 2.5-5 plates, ~5 machine)
  isUnilateral: boolean;
  fatigueCost: 1 | 2 | 3;              // systemic fatigue class (isolation=1, compound=2, heavy hinge=3)
  setupCost: 1 | 2 | 3;                // time/queue friction (machine=1, bench setup=2, rack=3)
  substitutions: SubstitutionEdge[];
  cues: string[];                      // mind-muscle cues, per §16 of profile
  contraindications: PainRegion[];     // demote when pain flagged in these regions
}

interface SubstitutionEdge {
  exerciseId: string;
  reason: "equipment_taken" | "pain" | "preference" | "time";
  fidelity: number;                    // 0-1: how well it preserves the training purpose
}
```

Seed rules derived from the master profile:

- Every `contested`/`unreliable`-equipment exercise MUST have ≥1 `reliable` substitution edge with fidelity ≥ 0.8 (cable flye → machine/DB flye; cable lateral → DB lateral; cable row → chest-supported DB/machine row).
- `palmLoadRisk = 3` exercises (barbell bench, heavy barbell rows) are never auto-prescribed as primary movements while the `palm_pain` trait is active; they remain available for user-initiated PR days.
- Leg exercises exclude heavy barbell back squat from the default pool (leg press, hack squat if available, split squat, machine work, calf work).

---

## 9. Adaptive Programming Engine

Owns the 8-12 week horizon. Deterministic, constraint-based, template-seeded.

### 9.1 Initial programme construction

Inputs: canonical athlete profile, catalogue, trait store (empty at first run → profile defaults apply).

Algorithm (deterministic, ordered):

1. **Choose split family** from available days: 2 days → full-upper-biased full-body ×2; 3 days → Upper A / Lower+Arms / Upper B; 4 days → Upper push-bias / Lower / Upper pull-bias / Arms+shoulders. All variants of ONE programme, not separate programmes: same exercise pool, same progression states, so switching week-shape never resets learning.
2. **Assign weekly set targets per muscle group** from priority ranking: priority muscles start at 10-14 effective sets/week (arms count direct sets; shoulders = lateral/rear focus), maintenance muscles (legs) at 4-6, within an evidence-registry-cited total-volume ceiling.
3. **Select exercises** by scoring the catalogue: `score = preference(trait or profile) + stimulusRating(trait, default 0.5) + reliability bonus − setupCost penalty − palmRisk penalty`. Top-N per pattern fills the split. Ties break toward machines/DBs (profile preference).
4. **Assign progression model per exercise** (`PROGRESSION_RULES.md`): double progression for nearly everything; top-set+back-off only for the optional deadlift motivation slot; rep-goal for bodyweight.
5. **Set starting loads**: from logged history where present; else from profile anchors (e.g. DB incline 26 kg each) at the LOW end minus one increment, because under-shooting week 1 costs nothing and over-shooting costs trust and joints.
6. **Emit block structure**: weeks 1-4 accumulate (sets +1 per priority group per week if recovery holds), week 5 assessment, deload when triggered (§9.3), 8-12 week horizon with a mesocycle review at the end.

Output: `training_programmes` row + `planned_sessions` skeletons. Every choice writes a `coach_decisions` row citing rule + evidence entry.

### 9.2 Progression (weekly)

Delegated to `PROGRESSION_RULES.md` (double progression, thresholds, e1RM smoothing). PRD additions:

- Progression decisions run nightly, never mid-session (live rules handle mid-session).
- A progression is only "earned" at readiness ≥ Normal; performance during Moderate/Deload days neither earns nor loses progression (already implied by the spec's context-awareness example, now explicit).

### 9.3 Deloads: triggered, not scheduled

No fixed week-7 deload. Trigger when ANY of:

- Rolling 14-day performance trend negative on ≥ 2 primary exercises despite Normal+ readiness.
- Readiness mode ≤ Moderate on ≥ 4 of last 7 days.
- Subjective fatigue ≥ 7/10 twice in a week, or user asks.
- 6 accumulation weeks elapsed without one (backstop).

Deload = one week: loads −15%, sets −50%, all movements kept (groove maintenance), endurance easy-only. Framed in coaching copy as "supercompensation week", never "rest week" (motivation framing for an adherence-fragile user).

### 9.4 Substitutions

Three tiers, all resolved from the substitution graph: live (equipment taken → highest-fidelity available edge, instant), session-level (pain → non-provocative edge), programme-level (3 consecutive substitutions of the same exercise → the substitute becomes the default and the original demotes; logged as decision).

### 9.5 Autoregulation summary

Readiness modes apply the fixed transformations in `SAFETY_RULES.md`. Live set-to-set rules are `PROGRESSION_RULES.md` §live autoregulation, unchanged. Nothing else may modify a prescription.

### 9.6 Plateau detection and stimulus rotation (new)

Per exercise: if 4 consecutive exposures at Normal+ readiness produce no rep or load progress, flag `plateaued`. Ordered response (one step per week): 1) check effort calibration (is average reported RIR ≥ 3? → coach the RIR gap instead of changing the plan); 2) micro-deload that exercise (−10% for one exposure); 3) swap rep range (8-12 → 6-9 or 12-15); 4) rotate to a high-fidelity substitute for 4 weeks. Each step is a logged decision with its evidence entry.

### 9.7 Volume and intensity changes

Volume moves in ±1 set/muscle-group/week steps, bounded [MEV floor from evidence registry, recovery ceiling from traits]. Intensity (target RIR) is fixed by slot: primaries 1-2 RIR, isolation 0-2 RIR, never prescribed failure on compounds. The Learning Engine may adjust a muscle group's ceiling with confidence ≥ 0.7 (§11).

### 9.8 Fatigue management across modalities

Separate load ledgers per `COACHING_SPEC.md` (global, upper, lower, running, cycling, HIIT, per-muscle) with the corrected priority: when ledgers conflict, upper-body hypertrophy capacity is protected first (§3.2). Interference rules from the spec stand, with one addition: boxing sessions log as `high_intensity_cardio_load` + light `upper_load` and may not precede an upper priority session by < 24 h at trust levels ≥ 2 (auto-reschedules; proposes at level 1).

---

## 10. Live Workout Engine (deterministic state machine)

Extends the `TELEGRAM_FLOWS.md` state machine into a full specification.

### 10.1 States

```
IDLE → PROPOSED → ACCEPTED → WARMUP(i) → SET_PENDING(e,s) → SET_AWAITING_RESULT(e,s)
     → SET_RECORDED(e,s) → RESTING(e,s) → [next set | EXERCISE_COMPLETE(e)]
     → [next exercise | SESSION_DEBRIEF] → SESSION_COMPLETE
Interrupts (from any in-session state): PAUSED, PAIN_FLOW, SWAP_FLOW, TIME_COMPRESS_FLOW, ABORTED
```

### 10.2 Session context (the machine's full knowledge)

```typescript
interface LiveSessionState {
  sessionId: string;
  status: SessionStatus;
  planned: PlannedExercise[];          // ordered prescription
  cursor: { exerciseIdx: number; setIdx: number; phase: "warmup" | "working" };
  completedSets: PerformedSet[];
  currentPrescription: SetPrescription; // load, repMin, repMax, targetRir, restSeconds
  adaptations: CoachDecision[];         // every live change, with reason
  fatigueState: {
    sessionRpeRunning: number;          // rolling estimate from set feedback
    repDropoffPct: number;              // observed vs first set
  };
  painFlags: PainEvent[];
  readinessMode: Mode;                  // frozen at session start
  timeBudgetMinutes: number;            // 75 default, 40 rescue, user-set
  startedAt: string;
  lastEventAt: string;                  // for timeout handling
}
```

`readinessMode` freezes at start: mid-session readiness recomputation is banned (surprise mid-workout plan changes destroy trust; live adaptation comes only from set results and pain).

### 10.3 Events and transitions

| Event | Source | Effect |
|---|---|---|
| `SET_RESULT {reps, rir?, quality?, loadDelta?}` | button or parsed freetext | record → run live rules → next prescription → RESTING |
| `REST_ELAPSED` | timer | send next set message → SET_PENDING |
| `PAIN {region, severity}` | button/freetext | PAIN_FLOW per SAFETY_RULES |
| `SWAP {reason}` | /swap or freetext | substitution graph lookup → re-prescribe remaining sets |
| `TIME_LEFT {minutes}` | freetext ("only got 30 min") | TIME_COMPRESS (§10.6) |
| `PAUSE` / `RESUME` | /pause /resume | freeze timers; > 45 min paused → offer save-and-close |
| `SKIP_SET` / `SKIP_EXERCISE` | button | record skip observation, advance cursor |
| `ABORT` | /done early | save completed work as valid partial session (counts toward adherence at ≥ 60% of sets) |

Determinism rule: identical `LiveSessionState` + identical event = identical transition, always. The LLM converts freetext into ONE of these typed events (with Zod validation and a confidence threshold; low confidence → clarifying button prompt) and does nothing else.

### 10.4 Warm-up generation

Deterministic ramp from working load: isolation → 1 feel set at 50%; compounds → 2-3 sets (bar/light × 8, 60% × 5, 80% × 2), collapsing to 1 ramp set when the previous exercise hit the same muscle group. First exercise of a session always gets the full ramp.

### 10.5 Per-set adaptation

Exactly the rule table in `PROGRESSION_RULES.md` §live autoregulation. The engine additionally tracks `repDropoffPct`; when set-to-set dropoff exceeds the exercise's learned `typical_set_dropoff_pct` by > 50%, the remaining prescription drops one set (fatigue spike guard) with reason messaged.

### 10.6 Time compressor (new)

Given `TIME_LEFT < remaining estimate`, apply in order until it fits (estimates: sets × (avg set time + rest)):

1. Cut rest on isolation work to 60-90 s.
2. Convert isolation pairs to supersets (antagonist or distal pairing only).
3. Drop the last set of each isolation exercise.
4. Drop whole exercises in reverse priority order (legs/abs accessories first, priority-muscle primaries last).

Never compress: warm-ups for the first compound, pain protocols, the top priority movement of the day. Output messaged as one summary line ("Compressed to 32 min: supersetting curls/pushdowns, dropped one lateral set").

### 10.7 Rescue Session construction (new)

Pre-computed nightly alongside the full session: top 4-5 movements by (priority muscle × setupCost ascending), 2-3 sets each, rest 90 s, machines/DBs only, zero contested equipment, target 30-40 min. Progression states shared with the full programme, so rescue sessions still feed learning and can still earn progressions.

---

## 11. Learning Engine

Turns raw observations into a versioned, confidence-scored trait store. Runs nightly plus after session close. No neural networks; transparent statistics only (repo philosophy, correct at N=1).

### 11.1 Observations (immutable event stream)

```typescript
interface Observation {
  id: string;
  userId: string;
  at: string;                      // ISO timestamp
  kind: ObservationKind;
  subject: string;                 // exerciseId | muscleGroup | "session" | "sleep" ...
  payload: Record<string, unknown>;
  sourceSessionId?: string;
  source: "set_log" | "checkin" | "wearable" | "debrief" | "freetext" | "review_answer";
}

type ObservationKind =
  | "set_performed" | "session_completed" | "session_skipped" | "session_rescued"
  | "exercise_swapped" | "pain_event" | "technique_note" | "stimulus_rating"
  | "readiness_vs_performance" | "recovery_gap_outcome" | "measurement" | "adherence_context";
```

Observations are never edited or deleted (append-only). Traits are derived and always recomputable from scratch: this makes every belief auditable and every learner bug fixable retroactively.

### 11.2 Traits (derived beliefs)

```typescript
interface AthleteTrait {
  id: string;
  userId: string;
  key: string;                     // e.g. "exercise.machine_press.stimulus"
  subject: string;
  value: number | string | boolean | Json;
  confidence: number;              // 0-1
  evidenceCount: number;
  lastUpdated: string;
  provenance: "profile_default" | "learned" | "user_asserted";
  history: { at: string; value: unknown; confidence: number }[];
}
```

Trait namespaces and what discovers them:

| Namespace | Examples | Learned from |
|---|---|---|
| `exercise.{id}.preference` | favourite / disliked | swap frequency, skip rate, debrief sentiment, stimulus ratings |
| `exercise.{id}.stimulus` | perceived stimulus 0-1 | post-exercise ratings, progression velocity |
| `exercise.{id}.pain` | pain-associated flag | pain events (3 in 90 days → active) |
| `exercise.{id}.progression` | e1RM, dropoff, increment | set logs (the existing progression state, absorbed here) |
| `muscle.{group}.strengthRank` | strongest/weakest | volume-adjusted progression velocity across exercises |
| `muscle.{group}.recoveryHours` | 48 → learned 62 | performance on re-exposure vs gap length |
| `muscle.{group}.volumeCeiling` | sets/week tolerated | performance + soreness at each volume step |
| `adherence.byWeekday` | Mon 0.9, Fri 0.4 | completion vs plan per weekday |
| `adherence.bySessionLength` | ≤ 60 min 0.95, > 80 min 0.6 | completion vs planned duration |
| `adherence.rescueUptake` | accepts rescue 70% | Journey B outcomes |
| `motivation.lowSignal` | short-reply pattern precedes skips | message metadata + skip correlation (≥ 0.6 confidence before ever used) |
| `recovery.sleepSensitivity` | perf delta per hour sleep lost | readiness_vs_performance pairs |
| `recovery.caffeineLateImpact` | sleep delta after >15:00 caffeine | checkin + supplement logs |
| `effort.rirBias` | reports 2, true ≈ 4 | failed-set forensics: reps achieved when pushed vs reported RIR |

`effort.rirBias` deserves emphasis: the profile documents chronic under-effort. When Jack reports 2 RIR but on AMRAP/failed sets shows systematic extra reps, the engine learns his bias and silently corrects prescriptions (target "1 RIR reported" ≈ 3 real). This is the single highest-leverage personalisation in the system.

### 11.3 Update mechanics

- Frequency traits (preferences, adherence): exponentially weighted moving average, half-life 45 days (recent behaviour dominates, old habits fade).
- Continuous traits (recoveryHours, sleepSensitivity): rolling median over the last N relevant observations (N ≥ 8 before confidence can exceed 0.5).
- Confidence: `evidenceCount / (evidenceCount + k)` (k = 5), multiplied by a recency decay (halves after 90 days without confirming evidence) and an agreement factor (variance-penalised). Simple, monotone, explainable.
- Conflict rule: `user_asserted` overrides `learned` for 30 days, then learned data may challenge it in a weekly review ("You said you dislike leg press, but you have completed every prescribed set for 6 weeks. Keep it in the pool?").

### 11.4 Consumption thresholds

| Confidence | Engines may |
|---|---|
| < 0.4 | Ignore (profile defaults rule) |
| 0.4-0.7 | Use as tiebreaker in exercise scoring |
| ≥ 0.7 | Override defaults (volume ceilings, recovery windows, RIR correction) |
| ≥ 0.85 | Surface as a stated fact in coaching copy ("You recover slowly from heavy rows, so…") |

---

## 12. Knowledge Engine (evidence registry)

Purpose: every coaching decision explainable on tap; every deterministic rule cited; Jack learns exercise science as a side effect of training.

### 12.1 Registry schema

```typescript
interface EvidenceEntry {
  id: string;                        // "rir_proximity_hypertrophy"
  topic: string;                     // "Why train close to failure?"
  summary: string;                   // 3-5 sentences, plain language, British English
  evidenceLevel: "strong" | "moderate" | "emerging" | "mixed" | "expert_opinion";
  practicalTakeaway: string;         // one actionable sentence
  triggerConditions: TriggerCondition[]; // when the coach may surface this
  relatedRuleIds: string[];          // deterministic rules citing this entry
  references: { citation: string; url?: string; year: number }[];
  lastReviewed: string;              // registry entries get re-reviewed yearly
}

interface TriggerCondition {
  event: string;                     // "rir_reported_high" | "deload_triggered" | "post_session" ...
  cooldownDays: number;              // never repeat a lesson within N days
  maxPerWeek: number;                // education throttle: ≤ 2 unprompted lessons/week
}
```

### 12.2 Seed topics (initial ~25 entries, all required for Phase 1-3 rules)

Effort and stimulus: RIR proximity to failure and hypertrophy; mechanical tension as the primary driver; effective sets and volume dose-response; rep-range equivalence for hypertrophy; mind-muscle connection evidence and cueing.
Recovery: sleep loss and next-day performance; muscle-group recovery windows; deload rationale; why fatigue feels different day to day (readiness inputs); cold-water immersion post-hypertrophy blunting adaptation.
Nutrition/supplements: creatine daily (loading unnecessary); protein distribution and total; caffeine half-life and sleep; sodium/electrolytes for heat endurance; energy availability during recomp.
Programming: why not train the same muscle tomorrow; interference effect and how we manage it; progressive overload via double progression; plateaus and stimulus rotation; warm-up ramps.
Jack-specific: grip pain and pressing alternatives; heat illness and fuelling on long rides; step count and recomp energy expenditure; why rescue sessions preserve adaptations (maintenance-volume evidence).

Each entry ships with the PRD-mandated fields filled; entries without references do not merge.

### 12.3 Delivery rules

- Reactive ("why?" button on any coach decision): always available, no throttle, answered by LLM **from the registry entry only** (entry text is the context; the LLM may rephrase, never extend).
- Proactive (trigger-based): throttled per `TriggerCondition`; delivered as one short paragraph + "more" link to the web registry page.
- Weekly review includes at most one "concept of the week" tied to something that actually happened that week.

---

## 13. Telegram Coach

### 13.1 Principle

The bot is a **thin client**. It renders engine output and forwards user input. It calculates nothing, remembers nothing (all state in Postgres), and contains zero coaching logic. If the bot process dies mid-session, a restart resumes from `LiveSessionState` exactly.

### 13.2 Architecture

```
Telegram ──webhook──▶ /api/telegram/webhook (Next.js route handler on Vercel)
                          │ verify secret token + allow-list
                          ▼
                    Event normaliser (button payload | command | freetext)
                          │ freetext only
                          ▼
                    LLM Gateway → typed event (Zod-validated)
                          ▼
                    Coach API (state machine + engines)
                          ▼
                    Reply renderer (fixed templates + LLM phrasing where allowed)
                          ▼
                    Telegram sendMessage
```

Timer problem: rest timers and scheduled nudges need execution later than the webhook request. Solution without a standing server: **Supabase scheduled Edge Functions / pg_cron for minute-resolution jobs** (morning message, 21:00 nudge, nightly learner) and **Telegram's native reply pattern for rest timers**: the rest message includes the target time ("Rest 3:00, next set at 19:42") plus a [Ready] button; an optional pg_cron sweep sends the "time's up" ping for timers ≥ 2 min. This keeps the whole system serverless. If sub-minute timer fidelity ever matters, add a tiny always-on worker (Fly.io) later; the interface does not change.

### 13.3 Command set (full)

| Command | Behaviour |
|---|---|
| `/start` | Link account (deep-link token from web app), show status |
| `/today` | Readiness + today's session summary + start buttons |
| `/pause` `/resume` | Freeze/unfreeze live session timers |
| `/swap` | Substitution flow for current (or named) exercise |
| `/pain` | Pain flow (also triggered by button/freetext) |
| `/skip` | Skip current set/exercise (asks which if ambiguous) |
| `/done` | End session; saves partial work as valid |
| `/summary` | Last session or current week snapshot |
| `/weight` | Log body weight |
| `/measure` | Guided measurement entry (waist, arms…) |
| `/rescue` | Request the 35-min version any time |
| `/why` | Explain the most recent coach decision (Knowledge Engine) |
| `/privacy` | Active data sources + last LLM payload summary |
| `/help` | Command list |

All commands also reachable by natural language ("skip that", "what's left this week", "swap this, machine's taken").

### 13.4 Natural-language logging

Per `TELEGRAM_FLOWS.md`, extended: the LLM Gateway maps freetext to exactly one typed event with a confidence score. `confidence < 0.8` → render the parse as buttons for confirmation instead of acting ("Did you mean: 30 kg each × 8 @ 2 RIR? [Yes] [Edit]"). Every accepted parse stores prompt + raw text + parsed JSON in `llm_interactions` for audit and future parser evaluation.

### 13.5 Security (restating the non-negotiables)

Telegram user-ID allow-list (reject unknown users with a fixed message), webhook secret verification, one Cognix account ↔ one Telegram identity, no health payload in logs, minimal LLM payloads. Already specified in `COACHING_SPEC.md`; unchanged and mandatory from Phase 1.

### 13.6 Tone

Fixed template skeletons with LLM phrasing inside guardrails (§14.5). Never: guilt, streak-shaming, exclamation-mark cheerleading. Always: concrete numbers, one reason per change, "tired days still count" framing on low-readiness days. British English.

### 13.7 Offline resilience

Basic-Fit signal is unreliable. Rules: every outbound message idempotent (message keyed by state + cursor, re-sends safe); inbound events processed exactly-once via update_id dedup; out-of-order set results reconciled by cursor check (a result for a stale cursor prompts "logging this against set 2, correct?"); a session with no events for 45 min auto-pauses rather than aborting.

---

## 14. LLM layer

### 14.1 Role boundary (binding)

The LLM may: parse free text to typed events, explain deterministic decisions from provided context, teach from evidence registry entries, summarise trends from provided aggregates, answer questions with registry + athlete-model slices as context, phrase coach messages inside templates.

The LLM may never: calculate scores or loads, invent numbers absent from context, modify state directly, override or reinterpret safety rules, diagnose injuries (pain flows use fixed medical-safe copy), generate supplement/medication advice beyond registry entries.

Enforcement is structural, not prompt-based: the LLM's only write path is emitting typed events and message text. It has no tool that mutates the database. Every numeric field in an LLM-parsed event is validated against physical bounds (reps 0-50, load 0-200 kg, RIR 0-5) before acceptance.

### 14.2 Provider abstraction

Extends the existing v0.1.1 provider architecture (`AI_STRATEGY.md`):

```typescript
interface LlmProvider {
  id: "anthropic" | "openai" | "openrouter" | "ollama";
  complete(req: LlmRequest): Promise<LlmResponse>;   // structured, JSON-schema-constrained
}

interface LlmRouterPolicy {
  parse: ProviderPref[];      // cheap + fast first: local qwen3-coder via Ollama, haiku fallback
  explain: ProviderPref[];    // quality first: claude-sonnet class
  review: ProviderPref[];     // weekly/monthly summaries: claude-sonnet class
  fallbackTimeoutMs: number;  // provider unresponsive → next in list
}
```

Set parsing is high-frequency, low-difficulty, latency-sensitive → route to local Ollama (M5 Pro already runs qwen3-coder:30b) when the machine is reachable, cloud fallback otherwise. Explanations and reviews are low-frequency, quality-sensitive → Claude. All providers behind one interface; API keys server-side only.

### 14.3 Context assembly (memory layers)

Per `COACHING_SPEC.md` four-layer model, made concrete: each LLM call gets a purpose-built context slice assembled by deterministic code (immediate set context; session summary; last 3-6 exposures of the current exercise; relevant traits ≥ 0.7 confidence; relevant registry entries). Hard cap ~2k tokens per parse call, ~6k per explain call. Full history never leaves the database.

### 14.4 Auditability

Every call logged to `llm_interactions`: purpose, context hash, prompt tokens, response, validation outcome, cost. `/privacy` renders the latest entries in human terms.

### 14.5 Message template guardrails

Coach messages are templates with typed slots. The LLM fills designated freeform slots (reason phrasing, encouragement line) with hard rules: ≤ 140 chars per slot, no numbers not present in the input context (regex-verified: any digit sequence in output must appear in input), banned-phrase list (guilt/shame vocabulary). Template + slots means a broken LLM degrades to slightly robotic messages, never to wrong coaching.

---

## 15. Data model additions

Extends `DATA_MODEL.md` (which already defines `athlete_profiles`, `training_programmes`, `planned_sessions`, `planned_exercises`, `performed_sets`, `progression_states`, `coach_decisions`, `pain_events`, `llm_interactions`). New tables:

```sql
-- Exercise catalogue (seed + per-user overrides)
CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  patterns TEXT[] NOT NULL,
  primary_muscles TEXT[] NOT NULL,
  secondary_muscles TEXT[] DEFAULT '{}',
  equipment TEXT[] NOT NULL,
  grip_style TEXT NOT NULL,
  palm_load_risk SMALLINT NOT NULL DEFAULT 0,
  rep_range_default INT4RANGE NOT NULL,
  load_increment_kg NUMERIC(4,1) NOT NULL,
  is_unilateral BOOLEAN NOT NULL DEFAULT false,
  fatigue_cost SMALLINT NOT NULL,
  setup_cost SMALLINT NOT NULL,
  cues TEXT[] DEFAULT '{}',
  contraindications TEXT[] DEFAULT '{}'
);

CREATE TABLE exercise_substitutions (
  exercise_id TEXT REFERENCES exercises(id),
  substitute_id TEXT REFERENCES exercises(id),
  reason TEXT NOT NULL,
  fidelity NUMERIC(3,2) NOT NULL,
  PRIMARY KEY (exercise_id, substitute_id, reason)
);

CREATE TABLE user_exercise_overrides (
  user_id UUID REFERENCES auth.users(id),
  exercise_id TEXT REFERENCES exercises(id),
  equipment_reliability TEXT,        -- "reliable" | "contested" | "unreliable"
  banned BOOLEAN DEFAULT false,
  notes TEXT,
  PRIMARY KEY (user_id, exercise_id)
);

-- Learning engine
CREATE TABLE observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind TEXT NOT NULL,
  subject TEXT NOT NULL,
  payload JSONB NOT NULL,
  source_session_id UUID,
  source TEXT NOT NULL
);
-- append-only: no UPDATE/DELETE policies granted

CREATE TABLE athlete_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  key TEXT NOT NULL,
  subject TEXT NOT NULL,
  value JSONB NOT NULL,
  confidence NUMERIC(3,2) NOT NULL,
  evidence_count INT NOT NULL DEFAULT 0,
  provenance TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);

CREATE TABLE trait_history (
  trait_id UUID REFERENCES athlete_traits(id),
  at TIMESTAMPTZ NOT NULL,
  value JSONB NOT NULL,
  confidence NUMERIC(3,2) NOT NULL
);

-- Knowledge engine
CREATE TABLE evidence_entries (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  summary TEXT NOT NULL,
  evidence_level TEXT NOT NULL,
  practical_takeaway TEXT NOT NULL,
  trigger_conditions JSONB NOT NULL DEFAULT '[]',
  related_rule_ids TEXT[] DEFAULT '{}',
  refs JSONB NOT NULL,
  last_reviewed DATE NOT NULL
);

CREATE TABLE education_deliveries (           -- throttle state
  user_id UUID REFERENCES auth.users(id),
  entry_id TEXT REFERENCES evidence_entries(id),
  delivered_at TIMESTAMPTZ NOT NULL,
  trigger_event TEXT NOT NULL,
  PRIMARY KEY (user_id, entry_id, delivered_at)
);

-- Live sessions
CREATE TABLE live_session_states (
  session_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL,
  state JSONB NOT NULL,               -- full LiveSessionState snapshot
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Measurements
CREATE TABLE body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  at DATE NOT NULL,
  site TEXT NOT NULL,                 -- waist_navel | arm_l | arm_r | chest | shoulders | thigh_l | thigh_r
  value_cm NUMERIC(5,1) NOT NULL,
  UNIQUE (user_id, at, site)
);

-- Telegram identity
CREATE TABLE telegram_links (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  telegram_user_id BIGINT NOT NULL UNIQUE,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

All tables: RLS `auth.uid() = user_id` (catalogue and evidence tables are read-all, write-admin). `progression_states` from `DATA_MODEL.md` remains but is re-derived by the Learning Engine as `exercise.{id}.progression` traits; keep the table as the engine-facing materialised view of those traits.

### 15.1 Core TypeScript interfaces (beyond those defined inline above)

```typescript
type Mode = "push" | "normal" | "moderate" | "deload" | "rest";
type MuscleGroup = "biceps" | "triceps" | "front_delt" | "side_delt" | "rear_delt"
  | "upper_chest" | "mid_chest" | "lats" | "upper_back" | "lower_back"
  | "quads" | "hamstrings" | "glutes" | "calves" | "abs" | "forearms";

interface SetPrescription {
  exerciseId: string;
  setNumber: number;
  loadKg: number;                    // per-hand for DBs; renderer appends "each"
  repMin: number; repMax: number;
  targetRir: number;
  restSeconds: number;
  isWarmup: boolean;
}

interface PerformedSet {
  prescription: SetPrescription;
  completedReps: number;
  reportedRir?: number;
  repQuality?: "fast" | "normal" | "slow" | "grinder" | "technique_breakdown";
  actualLoadKg: number;
  failure?: FailureType;
  pain?: { region: string; severity: number };
  at: string;
}

interface CoachDecision {
  id: string;
  at: string;
  scope: "programme" | "session" | "set";
  ruleId: string;                    // deterministic rule that fired
  evidenceEntryId?: string;          // registry citation
  before: Json; after: Json;         // the delta, machine-readable
  reason: string;                    // human one-liner
  trustLevelAtTime: 1 | 2 | 3;
  userResponse?: "accepted" | "declined" | "auto";
}
```

---

## 16. Integrations

All providers behind adapters; the engines consume normalised types and never know the source (existing repo pattern, kept). Priority order below is the build order.

### 16.1 Telegram (Phase 1)

Core execution client. §13. Grammy or telegraf library; webhook mode only (no polling).

### 16.2 LLM providers (Phase 2)

Anthropic (primary explain/review), OpenAI + OpenRouter (fallback), Ollama local (parse-tier). §14.2. Claude API key already provisioned (`@anthropic-ai/sdk` installed).

### 16.3 Oura (Phase 5)

PAT auth, instant, `https://api.ouraring.com`, 5,000 req/5 min. Daily pull: readiness contributors, HRV RMSSD, sleep stages, temperature deviation. Feeds Readiness Engine baseline deltas. Easiest recovery provider; build first (matches Obsidian project note decision).

### 16.4 Garmin (Phase 5-6)

OAuth 1.0a (`oauth-1.0a` npm) or unofficial `garminconnect` route for personal use; Health API partner approval is slow, so personal-use route first. Pull: activities, HRV status, Body Battery, Training Readiness. Phase 8 (unchanged from spec): publish structured workouts to watch.

### 16.5 Strava (Phase 4)

OAuth 2, webhook for new activities. Runs and rides → endurance load ledgers → interference windows. Manual logging keeps working forever (integration outage must never block coaching).

### 16.6 Weather (Phase 4)

Open-Meteo (no key, free). Gates outdoor endurance recommendations: > 30°C on planned rides ≥ 90 min triggers heat protocol (§6.7); wind/rain adjusts route suggestions only, never blocks.

### 16.7 Google Calendar (Phase 4)

Read-only free/busy → session time suggestions and busy-week detection (feeds rescue-session proactivity). Never writes events without per-event confirmation.

### 16.8 Renpho / body composition (Phase 5)

Per `COACHING_SPEC.md`: manual Telegram weight first, CSV import second, Terra aggregator only if ever needed. BIA data used as trend only (7-day median, 14-28 day slope).

### 16.9 Apple Health (Phase 5)

No public server API. Route: iOS Shortcuts automation posting daily step count + workouts to a Cognix endpoint, or periodic XML export import. Steps feed the recomp energy picture (8-10k baseline monitoring).

---

## 17. Long-term Athlete Model

The persistent artefact the whole loop maintains (§3.3). Not a new store: a **defined projection** over profile + traits + measurements + history, materialised nightly as one versioned JSON document for fast context assembly and the web browser page.

### 17.1 Structure

```typescript
interface AthleteModel {
  version: number;                    // increments nightly if anything changed
  generatedAt: string;
  identity: { heightCm?: number; weightKg7dMedian: number; age?: number };
  physiology: {
    muscleRecoveryHours: Record<MuscleGroup, TraitValue<number>>;
    sleepSensitivity: TraitValue<number>;
    heatSensitivity: TraitValue<number>;
    rirBias: TraitValue<number>;
  };
  strength: Record<string, { e1rm: number; trend: "up" | "flat" | "down"; confidence: number }>;
  hypertrophy: {
    volumeTargets: Record<MuscleGroup, { current: number; ceiling: TraitValue<number> }>;
    priorityRanking: MuscleGroup[];
    measurements: { site: string; latest: number; delta28d: number | null }[];
  };
  endurance: {
    runningLoad4w: number; cyclingLoad4w: number;
    events: { name: string; date: string; readiness: number }[];  // Madrid-Segovia 2027
  };
  preferences: { favourites: string[]; dislikes: string[]; swapsLearned: Record<string, string> };
  psychology: {
    adherence4w: number;
    riskFlags: string[];              // "binary_dropout_pattern", "under_effort"
    motivationLevers: string[];       // "rep_PRs", "visible_arm_progress", "feeling_strong"
  };
  equipment: { gym: string; reliability: Record<string, string>; dumbbellMaxKg: number };
  safety: { activePainFlags: PainEvent[]; bannedExercises: string[]; palmPainActive: boolean };
  openQuestions: string[];            // mirrors profile §23, auto-pruned as answered
}

type TraitValue<T> = { value: T; confidence: number; provenance: string };
```

### 17.2 Update contract

Nightly learner regenerates; diff against previous version logged; material changes (any trait crossing a §11.4 threshold) appear in the weekly review. The canonical Obsidian profile remains the human-readable source for stable facts; the Athlete Model is the machine projection. When the model learns something that contradicts the written profile (e.g. "actually completes long sessions fine"), the weekly review proposes a profile update rather than silently diverging.

### 17.3 Measurement cadence engine

Waist + arms every 4 weeks (Telegram guided flow, ~60 s), full set (chest, shoulders, thighs) every 8 weeks, weight ad libitum with 7-day median smoothing. Prompts skip automatically during deload weeks (water/glycogen noise). Charts on `/measurements` with 28-day deltas, the recomp headline metric being waist trend vs arm trend.

### 17.4 Photos (Phase 5+, opt-in)

Monthly prompt alongside measurements. Supabase private bucket, separate RLS, EXIF-stripped, never in any LLM payload, excluded from standard export unless explicitly included. Side-by-side comparison UI in the web app only.

### 17.5 Export

One-click JSON + CSV export of everything (sessions, sets, observations, traits, measurements, decisions). This is both a trust feature and the escape hatch that makes the "your data, forever" claim true.

---

## 18. Safety, privacy and security

`SAFETY_RULES.md` stands in full: hard stops as code constants, readiness transformations, pain thresholds, confidence-aware behaviour, failure classification, disclaimer. PRD additions:

- **Trust dial never overrides safety**: at every autonomy level, pain flows and hard stops behave identically.
- **LLM numeric containment** (§14.5): no digit in an LLM-authored message slot that is absent from its input context.
- **Data minimisation to LLMs**: aggregates and slices only; raw health history, photos and identity fields never enter a prompt.
- **Audit completeness**: a coaching change without a `coach_decisions` row is a bug of the highest severity class.
- **Secrets**: all provider tokens server-side, encrypted at rest (Supabase Vault), never in the Next.js client bundle.
- **No medical claims**: enforcement per `AI_STRATEGY.md`; pain and illness copy reviewed as fixed strings, not LLM-generated.

---

## 19. Success metrics and validation

| Metric | Target | Source |
|---|---|---|
| North star: 4-week rolling minimum-plan adherence | ≥ 90% | sessions vs plan |
| Set-logging friction | ≤ 2 taps or 1 message per set | interaction logs |
| Pain events per month | trending down; zero severity ≥ 7 | pain_events |
| Coach-trust pulse (weekly 1-5) | ≥ 4 sustained | review answers |
| Readiness-performance correlation | positive and improving after 8 weeks | learner |
| Waist trend during recomp | −0.5 to −1 cm / 4 weeks | measurements |
| Arm trend | ≥ +0.5 cm / mesocycle | measurements |
| RIR calibration gap | shrinking (reported vs forensic) | learner |
| Cost per week (LLM + infra) | ≤ €5 | llm_interactions + billing |

Primary validation question (kept from `COACHING_SPEC.md`): after four weeks, is Cognix more convenient AND more accurate than a spreadsheet or commercial app? If no, fix friction before adding features.

---

## 20. Implementation plan

Phases are independently shippable, independently testable, and none requires rework of a previous phase. Each lists its definition of done (DoD).

### Phase 0: Spec reconciliation and seed data (no product code)

- Update `COACHING_SPEC.md` athlete profile + priority hierarchy to match the master profile (§0.2, §0.3).
- Author exercise catalogue seed (~60 exercises with tags, substitution edges, cues) as TypeScript seed data.
- Author evidence registry seed (~25 entries, §12.2).
- Write the 8-12 week programme parameters for Jack from §9.1 by hand once, as the test fixture the engine must later reproduce.
- DoD: seeds pass schema validation; catalogue covers every profile-preferred exercise plus substitutes; a human-readable programme document exists for Jack to sanity-check.

### Phase 1: Supabase migration + Telegram logger (no LLM)

- Execute `DATA_MODEL.md` v0.2 migration plus §15 tables; swap `storage.ts` internals (the designed seam).
- Telegram bot: allow-list, `/start` `/today` `/done` `/skip` `/pause` `/resume`, button-only set logging, rest messages, session state machine persisted in `live_session_states`, morning message, 21:00 rescue nudge via pg_cron.
- Sessions from Phase 0's hand-written programme (static prescriptions, double progression applied nightly by rule).
- DoD: Jack runs 2 full weeks of real workouts logged entirely via buttons; state machine survives process restarts and signal loss; unit tests on every transition; adherence metric computes.

### Phase 2: LLM Gateway (parse + explain)

- Provider abstraction (§14.2) with Anthropic + Ollama; freetext set logging with confirmation threshold; `/why` on decisions (registry-backed); template guardrails + numeric containment; `llm_interactions` audit + `/privacy`.
- DoD: 50-case parser evaluation suite ≥ 95% correct-or-clarify (never silently wrong); zero uncontained numerics in 100 sampled messages.

### Phase 3: Prescription + autoregulation engines

- Programme Engine generates Jack's programme and matches the Phase 0 hand fixture (golden test).
- Live autoregulation rules; readiness transformations wired to check-ins (wearables still absent: subjective-only readiness, confidence-aware per `SAFETY_RULES.md`); time compressor; rescue session generation; substitution graph live.
- DoD: engine-generated programme approved by Jack; four weeks of adaptive sessions; every adaptation has a decision row; plateau detection fires correctly on synthetic fixtures.

### Phase 4: Endurance, calendar, weather

- Strava ingestion + manual endurance logging; load ledgers + interference windows (upper-hypertrophy-protective, §3.2); Open-Meteo heat gating; Google Calendar free/busy for scheduling + busy-week rescue proactivity; weekly review v1 (Telegram + web).
- DoD: a logged long ride correctly restricts lower-body and preserves upper prescriptions; heat protocol triggers on a synthetic 32°C forecast.

### Phase 5: Recovery providers + body data

- Oura first, then Garmin personal-use route; readiness engine consumes real HRV/sleep with provenance + confidence; measurement cadence engine + `/measure` + charts; weight trend smoothing; photos (opt-in, bucket isolation); Apple Health steps via Shortcuts endpoint.
- DoD: readiness computed from real wearable data with graceful degradation when stale; first monthly review includes real measurement deltas.

### Phase 6: Learning Engine v1

- Observations backfilled from all Phase 1-5 data (append-only store populated retroactively from session logs); trait derivations (§11.2 table) with confidence maths; consumption thresholds wired into exercise scoring, volume ceilings, RIR correction; Athlete Model nightly materialisation + web browser page; trust dial.
- DoD: traits recomputable from scratch (determinism test); rirBias detected on synthetic under-reporting fixture; weekly review shows trait changes; Jack can see and challenge every belief.

### Phase 7: Closed-loop programming

- Mesocycle reviews, triggered deloads, adherence-aware programme evolution, block-over-block comparison, Garmin workout publishing (stretch).
- DoD: one full mesocycle completed end-to-end with a machine-proposed, human-approved next block.

Sequencing rationale: value lands in Phase 1 (usable logger in weeks), the LLM arrives only once there is a deterministic core to expose, learning arrives only once there is data to learn from. No phase builds on a component that a later phase replaces.

---

## 21. Repository structure (target)

Monorepo, current repo, no new repo:

```
cognix/
  src/
    app/                      # Next.js pages + API routes (thin)
      api/telegram/webhook/route.ts
      api/coach/…             # engine endpoints for web UI
      coach/ session/ reviews/ athlete/ knowledge/ measurements/   # new pages
    lib/
      engines/
        readiness.ts          # exists as scoring.ts → moves here
        programme.ts
        prescription.ts
        live-session.ts       # state machine (pure: (state, event) → (state, effects))
        autoregulation.ts
        learning/
          observations.ts
          traits.ts
          athlete-model.ts
      knowledge/
        registry.ts
        triggers.ts
      llm/
        gateway.ts providers/ templates.ts guards.ts
      telegram/
        normalise.ts render.ts commands.ts
      integrations/
        oura.ts garmin.ts strava.ts weather.ts calendar.ts apple-health.ts
      storage.ts              # the single persistence seam (kept)
      types.ts                # extended, single source of shared types
    data/
      exercises.seed.ts evidence.seed.ts
  supabase/
    migrations/               # numbered SQL from §15
    functions/                # cron: morning, nudge, nightly-learner, model-materialise
  tests/
    engines/ parser-eval/ golden/   # golden = Phase 0 fixture programme
  PRD.md  ARCHITECTURE.md  COACHING_SPEC.md  PROGRESSION_RULES.md
  SAFETY_RULES.md  TELEGRAM_FLOWS.md  AI_STRATEGY.md  DATA_MODEL.md
```

Conventions kept: `src/lib` pure (no React, no I/O except via storage), pages thin, engines unit-testable without a browser. The live-session state machine is a pure reducer; all side effects (Telegram sends, DB writes) execute from the effect list it returns, which is what makes §13.7's idempotency achievable.

---

## 22. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Builder-user adherence coupling: Jack stops training → product dies | High | Fatal | Phase 1 delivers standalone value in weeks; rescue sessions; north-star metric is adherence itself |
| Scope appetite: this PRD is months of evening work | High | High | Phases shippable alone; each phase is a usable product; stop-anywhere design |
| Over-coaching annoyance: too many messages → mute → dead product | Medium | High | One-nudge rule, education throttle, trust dial, weekly pulse question |
| LLM parse errors corrupt logs | Medium | Medium | Confirmation threshold, bounds validation, append-only observations enable retroactive repair |
| Wearable API fragility (Garmin unofficial route) | Medium | Low | Providers optional by design; subjective readiness path always works |
| RIR data garbage-in (profile: weak effort calibration) | High | Medium | rirBias learning; forensic calibration from failure sets; coaching the gap explicitly |
| Supabase/pg_cron timer granularity hurts rest-timer UX | Medium | Low | Target-time-in-message pattern; optional worker later without interface change |
| Health-data breach | Low | Fatal to trust | RLS everywhere, token vault, minimal LLM payloads, no client-side secrets, photo isolation |
| Single-user overfitting blocks commercial reuse | Medium | Low now | Profile-as-data rule (§4.2); catalogue/registry user-agnostic |
| Evidence registry rot | Medium | Low | `lastReviewed` field + yearly review job flags stale entries |

---

## 23. Open questions

Decisions deliberately left to Jack (everything else in this PRD is decided):

1. Telegram bot hosting: pure Vercel + pg_cron (recommended, §13.2) vs small always-on worker from day one?
2. Deadlift motivation slot: include one optional top-set deadlift day per month in the default programme, or keep PR-adjacent lifting purely user-initiated?
3. Boxing: manual log only for now, or a session type the programme actively schedules? (PRD assumes manual log until Phase 4.)
4. Wearable decision (profile §14 open question): Oura-first is assumed; confirm before Phase 5 spend.
5. Trust dial default after week 2: prompt to Level 2 automatically or wait for Jack to ask?
6. Photos: in scope at all? (PRD designs but does not commit.)
7. Nutrition depth: bands + protein target only (assumed), or meal-level logging eventually? Meal logging is a large adherence tax; recommend against.
8. Commercialisation intent: if genuinely intended within 18 months, add auth/multi-user smoke tests to every phase DoD now; otherwise defer.

---

## 24. Future roadmap (post-Phase 7 horizon)

- **Statistical personalisation sidecar**: per `PROGRESSION_RULES.md` §longer-term, once months of clean data exist: performance prediction, recovery modelling, block comparison. Python permitted here (§3.1), reading Postgres, writing traits.
- **Garmin watch as second client**: structured workout push + completion reconciliation; Telegram remains the conversational layer.
- **Voice logging**: Telegram voice notes → Whisper → parse pipeline (media stack already available locally).
- **Multi-user beta**: 2-3 friends as guinea pigs; validates profile-as-data claim before any commercial thought.
- **Commercial path (if ever)**: coach-in-a-box for evidence-based hybrid athletes; the defensible asset is the closed-loop trait learning + auditability story ("see exactly why your coach decided"), which commercial platforms structurally lack.

---

## 25. Acceptance of this PRD

Implementation may begin when Jack has: 1) approved the §0.3 priority hierarchy, 2) approved the §3.1 TypeScript decision, 3) answered or deferred §23 items 1-4. Everything else is decided herein.

---

## Appendix A: one day, end to end, with real numbers

Purpose: prove every engine hand-off is deterministic and unambiguous. Date used: a Tuesday in week 3 of Jack's first block. Trust level 2.

### A.1 Inputs at 06:30 (nightly jobs already ran)

```json
{
  "checkin": null,
  "wearables": null,
  "recentSessions": [
    { "date": "-2d", "type": "upper_a", "sets": 16, "avgRir": 1.8, "sessionRpe": 7 },
    { "date": "-4d", "type": "lower_arms", "sets": 12, "avgRir": 2.4, "sessionRpe": 6 }
  ],
  "subjectiveHistory7d": { "avgEnergy": 6.1, "avgSleepH": 7.2 },
  "plannedToday": "upper_b"
}
```

No wearable, no check-in yet → confidence Medium (`SAFETY_RULES.md`): proceed with moderate certainty, note missing data.

### A.2 Readiness Engine output

Subjective-only path: baseline 68 from 7-day rolling energy/sleep, −3 for two-day gap after a 16-set session with avgRir < 2, no pain flags. **Readiness 65, mode Normal, constraints [].** Decision row written: `rule=readiness.subjective_v1, evidence=fatigue_perception_drivers`.

### A.3 Prescription Engine output (Upper B, pull bias)

From programme week 3 + progression states:

```
1. lat_pulldown            3 × 8-12 @ 2 RIR, 62 kg,   rest 150 s   [progressed: hit 3×12 last exposure → +5 kg, reset to 8]
2. chest_supported_db_row  3 × 8-12 @ 2 RIR, 28 kg each, rest 150 s
3. machine_shoulder_press  3 × 8-12 @ 2 RIR, 50 kg,   rest 150 s   [note: seat one notch higher (technique memory)]
4. db_lateral_raise        3 × 12-18 @ 1-2 RIR, 10 kg each, rest 90 s
5. db_hammer_curl          3 × 8-12 @ 1-2 RIR, 14 kg each, rest 90 s
6. rope_pushdown           2 × 10-14 @ 1-2 RIR, 30 kg, rest 90 s   [contested: substitute ready = db_overhead_extension, fidelity 0.85]
Estimated duration: 68 min
```

### A.4 Morning message (07:45, rendered from template)

> Morning. Today: Upper B (pull focus), ~68 min.
> Readiness 65 (Normal), from your check-ins; no watch data today.
> Change: lat pulldown up to 62 kg. You earned it Saturday (3×12 at 57).
> Shoulder press: seat one notch higher, you preferred it last time.
> [Start when ready] [35-min version] [Move to tomorrow] [Check in first]

Every number traces: 62 ← progression decision; 65 ← A.2; 68 min ← set×rest arithmetic; seat note ← technique trait.

### A.5 In-session excerpt (the contested cable)

18:41, Jack types: "rope station taken as usual"

LLM Gateway parse → `SWAP {exerciseId: "rope_pushdown", reason: "equipment_taken"}` (confidence 0.96, auto-accepted). Substitution graph → `db_overhead_extension` (fidelity 0.85, reliable equipment). Engine re-prescribes remaining 2 sets at the DB equivalent load from its progression state (12 kg). Reply:

> Swapped: DB overhead extension, 12 kg × 10-14, 2 sets. Same triceps target.

Third consecutive session with this swap → nightly learner promotes `db_overhead_extension` to default, demotes rope; decision row + weekly review line: "Rope pushdown replaced by DB overhead extension (station contested 3 sessions running). Object to restore."

### A.6 Set-level adaptation excerpt

Machine shoulder press set 1: prescribed 50 kg × 8-12 @ 2 RIR. Jack taps [12 easy] and types "could've done 15".

Parse → `SET_RESULT {reps: 12, rir: 4}`. Live rule (`PROGRESSION_RULES.md`: performance well above target RIR) → set 2 at 55 kg. Reply:

> Logged: 50 kg × 12, plenty in reserve. Set 2: 55 kg, target 8-12. Rest 2:30, next set at 19:12.

Observation also written: `readiness_vs_performance` pair (65 → over-performance) and an `effort.rirBias` data point (reported RIR 4 on a "12 easy" tap is consistent; no bias evidence here, but the pair still calibrates his readiness sensitivity).

### A.7 Nightly learner output for this day

- `exercise.machine_shoulder_press.progression`: e1RM 50→55 kg class jump smoothed into trend "improving", confidence 0.71→0.74.
- `exercise.rope_pushdown.preference`: swap streak 3 → default substitution promoted (decision logged).
- `adherence.byWeekday.tuesday`: EWMA nudged up.
- Athlete Model version incremented; diff queued for Sunday review.

---

## Appendix B: gold-standard evidence registry entries

Template compliance examples. All future entries match this shape and tone.

### B.1 `rir_proximity_hypertrophy`

- **Topic:** Why train close to failure?
- **Summary:** Hypertrophy stimulus rises sharply in the last few reps before failure, when motor unit recruitment and mechanical tension peak. Sets stopped 4 or more reps short recruit less muscle and produce weaker growth signals. Training to 0-2 reps in reserve captures most of the stimulus while keeping fatigue and technique manageable. Chronically stopping at "mild discomfort" is the most common reason experienced lifters stop growing.
- **Evidence level:** strong
- **Practical takeaway:** Most working sets should end 1-2 reps before failure; if you could have done 4 more, the set barely counted.
- **Trigger conditions:** `rir_reported_high` (cooldown 10 days, max 1/week); `plateau_step_1_fired` (cooldown 0).
- **Related rules:** `autoregulation.load_increase_gate`, `plateau.step_1_effort_check`.
- **References:** Refalo et al. 2023 (systematic review, proximity to failure and hypertrophy); Robinson et al. 2024 (meta-regression, RIR dose-response); Schoenfeld 2010 (mechanisms of hypertrophy).

### B.2 `cold_water_post_hypertrophy`

- **Topic:** Why cold showers after lifting may reduce gains
- **Summary:** Cold-water immersion within a few hours of resistance training blunts the anabolic signalling (satellite cell activity, mTOR pathway) that drives muscle adaptation, and studies show smaller long-term strength and size gains when cooling routinely follows lifting. The effect matters for hypertrophy goals specifically; cooling after endurance work is less problematic. Timing is the lever: cold exposure on rest days or well before training avoids the conflict.
- **Evidence level:** moderate
- **Practical takeaway:** Keep cold showers 4+ hours away from lifting, or save them for non-lifting days.
- **Trigger conditions:** `user_mentions_cold_exposure` (cooldown 30 days).
- **Related rules:** none (education only).
- **References:** Roberts et al. 2015 (J Physiol, CWI attenuates hypertrophy); Fyfe et al. 2019; Piñero et al. 2024 review.

### B.3 `heat_endurance_fuelling`

- **Topic:** Why the Navacerrada climb broke you, and how not to repeat it
- **Summary:** Riding over 90 minutes in 30°C heat drains fluid at 1-1.5 L/hour and sodium at 500-1000 mg/hour; unreplaced, this produces exactly the cramping and dizziness you experienced. Heat also raises heart rate ~10 bpm at the same power, so pace felt is not pace sustainable. Pre-hydration, scheduled drinking, sodium, and 40-60 g carbohydrate per hour convert a survival ride into a training ride.
- **Evidence level:** strong
- **Practical takeaway:** For hot rides over 90 minutes: 500-750 ml/hour with sodium, carbs every 30-40 minutes, start before 09:00 when over 28°C is forecast.
- **Trigger conditions:** `long_ride_heat_gate` (no cooldown; fires with every gated ride).
- **Related rules:** `endurance.heat_protocol`.
- **References:** ACSM position stand, exercise and fluid replacement; Casa et al. 2015 (heat illness consensus).

---

## Appendix C: parser evaluation cases (sample of the 50-case suite)

Format: freetext → required typed event (exact match) or required clarification. "Silently wrong" on any case fails the Phase 2 gate.

| # | Input | Required output |
|---|---|---|
| 1 | "30 each for 8, about 2 left" | `SET_RESULT {reps:8, loadKg:30, rir:2}` |
| 2 | "got 8" | `SET_RESULT {reps:8}` (load/RIR from prescription defaults) |
| 3 | "failed the 5th" | `SET_RESULT {reps:4, failure:"unclassified"}` → failure-type buttons |
| 4 | "easy, gimme more" | `SET_RESULT {reps:prescribed, rir:>=4}` + flag load-increase intent |
| 5 | "wrist felt weird on that one" | `PAIN {region:"wrist", severity:null}` → severity prompt |
| 6 | "machine's taken" | `SWAP {reason:"equipment_taken"}` |
| 7 | "only got half an hour left" | `TIME_LEFT {minutes:30}` |
| 8 | "skip the curls today" | `SKIP_EXERCISE {exerciseId:"db_hammer_curl"}` |
| 9 | "done 12 but last three were ugly" | `SET_RESULT {reps:12, quality:"technique_breakdown"}` |
| 10 | "8 at 2" | `SET_RESULT {reps:8, rir:2}` |
| 11 | "80 for 8" (prescription was 30 each) | clarify: 80 total? load change intended? never auto-accept |
| 12 | "knackered, calling it" | `ABORT` → confirm button |
| 13 | "did an extra set of laterals" | `SET_RESULT {extra:true, exerciseId:"db_lateral_raise"}` → rep prompt |
| 14 | "same as last time" | `SET_RESULT {reps:last exposure same set}` only if history present, else clarify |
| 15 | "my chest hurts" mid-press | `PAIN {region:"chest"}` → severity; severity irrelevant if cardiac-pattern follow-up positive → hard stop copy |

Case 15 is the reason the pain flow is deterministic: "chest" triggers the cardiac screening branch in fixed copy regardless of LLM interpretation.

---

## Appendix D: live session transition table (normative)

| From | Event | Guard | To | Effects |
|---|---|---|---|---|
| IDLE | MORNING_TICK | planned session exists | PROPOSED | send morning msg |
| PROPOSED | START | (none) | ACCEPTED | freeze readiness, instantiate state |
| PROPOSED | RESCUE | (none) | ACCEPTED | swap plan → rescue variant |
| PROPOSED | MOVE | (none) | IDLE | reschedule decision row |
| ACCEPTED | (none) | first exercise | WARMUP(0) | send warm-up msg |
| WARMUP(i) | DONE | more warm-ups | WARMUP(i+1) | send next |
| WARMUP(i) | DONE | last warm-up | SET_PENDING(e,0) | send working set msg |
| SET_PENDING | (msg sent) | (none) | SET_AWAITING_RESULT | start staleness clock |
| SET_AWAITING_RESULT | SET_RESULT | bounds valid | SET_RECORDED | persist set, run live rules |
| SET_AWAITING_RESULT | PAIN | (none) | PAIN_FLOW | fixed pain copy |
| SET_RECORDED | (none) | sets remain | RESTING | rest msg with target time |
| SET_RECORDED | (none) | exercise done | EXERCISE_COMPLETE | progression note |
| RESTING | REST_ELAPSED ∨ READY | (none) | SET_PENDING(e,s+1) | next prescription (post-rules) |
| EXERCISE_COMPLETE | (none) | exercises remain | WARMUP/SET_PENDING(e+1) | ramp rule §10.4 |
| EXERCISE_COMPLETE | (none) | none remain | SESSION_DEBRIEF | debrief msg |
| SESSION_DEBRIEF | FEEL + NOTE | (none) | SESSION_COMPLETE | observations, summary msg |
| any in-session | PAUSE | (none) | PAUSED | freeze clocks |
| PAUSED | RESUME | (none) | prior state | restore clocks |
| PAUSED | 45 min elapsed | (none) | SESSION_DEBRIEF | save-partial prompt |
| any in-session | ABORT confirmed | (none) | SESSION_DEBRIEF | partial session valid |
| PAIN_FLOW | severity < 4 | (none) | prior state | note, continue |
| PAIN_FLOW | 4 ≤ severity < 7 | (none) | SWAP_FLOW | stop exercise, offer substitute |
| PAIN_FLOW | severity ≥ 7 | (none) | SESSION_DEBRIEF | terminate, safety event, lock region |

Reducer signature: `(LiveSessionState, Event) → { state: LiveSessionState; effects: Effect[] }`. Effects are data (SendMessage, PersistSet, WriteDecision, ScheduleTimer); an executor runs them. Pure reducer = exhaustive unit tests without Telegram or a database.

*End of PRD.*
