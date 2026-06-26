# Cognix

**Closed-loop personal coaching. Observe your body, decide what to train, coach you through it, learn from the result.**

Cognix synthesises wearable biometric data, activity imports, manual check-ins, nutrition, caffeine, supplement and training logs into a daily readiness score and actionable protocol. It then delivers the session one set at a time through Telegram and adapts the prescription in real time based on what you actually do. It is a provider-agnostic hybrid athlete coaching system, not a fitness tracker.

---

## The complete product loop

```
Measure → Understand → Plan → Coach → Observe → Adapt → Learn
```

1. **Measure**: Renpho, Garmin, Oura, Strava, weather, calendar, manual check-in
2. **Understand**: Readiness, fatigue, training load, muscle recovery, progression status
3. **Plan**: Choose workout, exercises, sets, reps, loads and targets
4. **Coach**: Deliver one instruction at a time through Telegram
5. **Observe**: Record weight, reps, RIR, pain, technique and subjective difficulty
6. **Adapt**: Modify the current session and future programme
7. **Learn**: Update exercise-specific strength estimates and response patterns

The system operates on three timescales: long-term programming (8–12 weeks), daily planning, and live session adaptation. These are separate engines. An LLM alone does not control any of them.

Cognix answers one question every morning:

> "What should I do today to make progress without burning out?"

It then takes you through that session set by set.

For endurance athletes: it also calculates weekly running and cycling volume, elevation gain, Zone 2 time, longest run/ride trends, and a preparedness score toward a specific target event (Madrid to Segovia, half marathon, etc.).

---

## Why Cognix exists

Most health and fitness apps show you data. Cognix synthesises it.

A recovery score of 72 means something different if your HRV is 20% above baseline vs. 15% below. A rest day is the wrong call if your ACWR shows you are undertrained. Doing 80km MTB rides in 35°C Madrid heat on poor sleep is how you end up fainting on a mountain road.

Cognix connects these signals into a single answer you can act on in 30 seconds each morning.

The origin was a failed attempt at the Madrid to Segovia route: 160km+ through the Sierra Nevada, abandoned due to heat, fatigue, and no real training base. Cognix is the system built to make sure that does not happen again.

The secondary purpose is portfolio and career positioning. This project demonstrates:

- **Hybrid athlete data architecture**: running + cycling + strength + recovery in one unified model
- **Provider-agnostic integration design**: Strava, Garmin, WHOOP, Fitbit, Oura all feed the same scoring engine without rewriting it
- **Endurance intelligence**: ACWR from real activities, Zone 2 estimation, event preparedness scoring
- **AI product engineering**: deterministic scoring separate from LLM synthesis, structured output, Zod validation
- **Healthtech product thinking**: evidence-based logic, data confidence modelling, no medical claims
- **Full-stack development**: Next.js 15 App Router, TypeScript, Supabase-ready architecture

---

## What v0.1 includes

| Feature | Status |
|---|---|
| Dashboard with readiness score, mode, metric tiles | Done |
| Daily check-in (wellbeing, nutrition, caffeine, supplements) | Done |
| Training session log with muscle group detection | Done |
| ACWR (Acute:Chronic Workload Ratio) calculation | Done |
| Workout planner with mock calendar | Done |
| Progress trends (mock data) | Done |
| Structured experiments with start/stop | Done |
| Integration roadmap catalogue | Done |
| Settings with goals and preferences | Done |
| Deterministic scoring engine | Done |
| Deterministic recommendation engine (no LLM) | Done |
| AI brief layer (provider-agnostic LLM layer, optional) | Done |
| Data confidence scoring | Done |
| localStorage persistence | Done |
| Demo mode with mock biometric data + history | Done |
| Dark mode, responsive layout | Done |

---

## What v0.1 deliberately excludes

| Feature | Reason | Phase |
|---|---|---|
| Supabase / cloud database | Build and validate locally first | v0.2 |
| Auth | No need until multi-device sync matters | v0.2 |
| Strava OAuth | Mock data validates the pipeline first | v0.3 |
| Endurance Base page | Needs real Strava data to be meaningful | v0.3 |
| Weather API | Core logic works without it | v0.4 |
| Google Calendar | Mock blocks validate the planner | v0.4 |
| Garmin Health API | Strava is the faster first path | v0.5 |
| Recovery provider (WHOOP/Oura/Garmin) | Provider-agnostic abstraction first | v0.5 |
| Manual FIT/GPX/TCX upload | Alternative to OAuth for local import | v0.4 |
| Spotify | Non-core intelligence feature | v0.7 |

---

## Product principles

**1. Deterministic code calculates; LLM explains.**
The readiness score, mode, caffeine risk, training load, ACWR, and all component scores are calculated by pure TypeScript functions. Claude explains these scores in natural language. The LLM never invents or adjusts a score.

**2. Rough data is acceptable.**
Cognix does not require precise calorie counting. Nutrition uses bands: Low / Okay / Good / High for protein, Under / About right / Over for calories. A rough answer every day beats a precise answer once a week.

**3. Provider-agnostic from the start.**
The scoring engine accepts typed interfaces, not provider-specific objects. Strava, Garmin, WHOOP, Fitbit, and Oura all map to the same internal types. Adding a new wearable never requires rewriting the scoring logic.

**4. Useful before AI.**
The first version generates deterministic daily recommendations without a single LLM call. This proves the logic works independently of the AI layer.

**5. Deterministic systems prescribe and record. Statistical models learn. The LLM communicates and interprets.**
The LLM does exactly four things: parse natural language, explain deterministic decisions, ask constrained clarifying questions, and summarise trends. It does not calculate readiness, invent weights, diagnose injuries or rewrite programmes.

**6. Endurance-first, recovery-as-context.**
Training load, ACWR, elevation gain, weekly volume, and event preparedness are first-class metrics. Recovery signals (HRV, sleep) contextualise training readiness but do not dominate the app's purpose.

**7. Healthtech aesthetic, not gym-bro.**
Cognix feels analytical, calm, and premium. No streaks, no gamification, no emoji-heavy motivational copy.

**8. No medical claims.**
Cognix is a personal performance tool. It does not diagnose, treat, or give medical advice.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Validation | Zod |
| Charts | Recharts |
| Storage (v0.1) | localStorage |
| Database (v0.2) | Supabase (PostgreSQL) |
| Auth (v0.2) | Supabase Auth |
| AI synthesis (v0.1.1+) | Anthropic Claude (claude-sonnet-4-6), provider-agnostic |
| Activity data (v0.3) | Strava API (OAuth 2.0) |
| Environmental context (v0.4) | OpenWeatherMap API |
| Recovery/sleep (v0.5) | Oura Ring Gen 4 API (OAuth 2.0 / PAT) |
| Training data (v0.5) | Garmin Health API / garminconnect bridge |
| Deployment | Vercel |

---

## App architecture

```
src/
  app/                    Next.js App Router pages
    dashboard/            Daily readiness overview
    checkin/              Subjective + nutrition + caffeine + supplement log
    training/             Session log + muscle coverage + ACWR
    planner/              Workout slot recommendation
    progress/             Signal trends
    endurance/            (v0.3) Weekly volume, elevation, event preparedness
    experiments/          Structured self-experiments
    integrations/         Integration roadmap catalogue
    settings/             Goals and preferences

  components/
    layout/               AppShell, Sidebar, MobileNav, PageHeader
    dashboard/            ReadinessHero, MetricTile, ModeBadge, DailyBriefCard,
                          TodayProtocol, WhyCookedCard, DataConfidenceCard,
                          QuickActions, TrendStrip
    endurance/            (v0.3) EnduranceBaseCard, WeeklyLoadStrip,
                          EventPreparednessCard, ZoneTwoTracker
    experiments/          ExperimentCard, ExperimentBuilder
    integrations/         IntegrationCard

  lib/
    types.ts              All TypeScript interfaces and enums
    constants.ts          Mode config, score thresholds, storage keys
    storage.ts            localStorage read/write (future: Supabase)
    mock-biometrics.ts    30-day mock recovery/HRV/sleep cycle data
    mock-history.ts       14-day mock check-in and training history
    scoring.ts            Deterministic scoring functions (pure)
    recommendations.ts    Deterministic recommendation engine (pure)
    training.ts           ACWR, muscle coverage, session load
    endurance.ts          (v0.3) Weekly volume, Zone 2, event preparedness scoring
    exercise-map.ts       Exercise to muscle group mapping + inference
    planner.ts            Calendar blocks + workout slot scoring
    confidence.ts         Data confidence calculation
    future-integrations.ts Integration catalogue for roadmap
    providers/            (v0.3+) Provider abstraction layer
      strava.ts           Strava API client + activity normaliser
      garmin.ts           (v0.5) Garmin Health API client
      recovery-adapter.ts Normalises recovery signals from any provider

  data/
    default-supplements.ts  Supplement catalogue with timing logic
    default-exercises.ts    Exercise catalogue
    demo-user.ts            Default demo user settings
```

---

## Data flow

```
User opens dashboard
        |
        v
 Demo mode? ─── Yes ──> Load mock biometrics + mock history
        |
       No
        |
        v
 Load from localStorage (v0.2: Supabase)
        |
        v
 calculateReadinessScores()     <── pure TypeScript, no API calls
 (recovery, sleep, subjective,
  nutrition, hydration, caffeine,
  training_load, pain, overall)
        |
        v
 determineMode()                <── thresholds: Push/Normal/Moderate/Deload/Rest
        |
        v
 buildDailyRecommendation()     <── deterministic text, no LLM
        |
        v
 Render dashboard               <── ReadinessHero, MetricTiles, Brief, Protocol

 (v0.3 adds)
        |
        v
 Strava activities loaded       <── real run/ride data
 calculateEnduranceMetrics()    <── weekly km, elevation, ACWR, event prep score
 Render EnduranceBase page      <── load strips, progression charts, preparedness
```

---

## Deterministic scoring

All scores are 0-100. Higher is better. Every score is a pure function with no side effects and no API calls.

### Readiness score weights

| Component | Weight | Source |
|---|---|---|
| Recovery | 30% | Wearable recovery score + HRV deviation (provider-agnostic) |
| Sleep | 20% | Wearable sleep performance percentage |
| Subjective | 20% | Check-in: sleep quality, mood, energy, stress, soreness |
| Nutrition | 10% | Check-in: protein band, calorie band |
| Hydration | 8% | Check-in: hydration band |
| Caffeine | 7% | Check-in: caffeine amount + timing vs cutoff |
| Training load | 5% | ACWR from training session history |

Pain >= 7/10: overall score capped at 30, mode forced to Rest.
Pain >= 5/10: overall score capped at 55, mode capped at Moderate.

### Training mode thresholds

| Score | Mode | Training guidance |
|---|---|---|
| 80-100 | Push | Full intensity. Progressive overload. |
| 60-79 | Normal | Planned session as written. |
| 40-59 | Moderate | Reduce volume/intensity by 20-30%. |
| 20-39 | Deload | Light movement, mobility, Zone 2 only. |
| 0-19 | Rest | No structured training. |

### ACWR (Acute:Chronic Workload Ratio)

Training load = RPE x duration in minutes (session-RPE method). From v0.3, Strava activities contribute automatically via normalised load calculation.

```
ACWR = (7-day average daily load) / (28-day average daily load)

< 0.5:  significantly undertrained
0.5-0.8: slightly undertrained
0.8-1.3: optimal
1.3-1.5: elevated injury risk
> 1.5:  high injury risk
```

### HRV deviation from personal baseline

```
pct_deviation = (today_hrv - 30d_mean) / 30d_mean x 100

> +20%:          exceptional recovery
+5 to +20%:     above average
-5 to +5%:      normal
-5 to -20%:     below average
< -20%:         significant suppression
```

---

## Endurance Base (v0.3)

The Endurance Base section is added in v0.3 alongside Strava integration. It answers a different question from the main dashboard: not "am I recovered today?" but "am I building the base I need to reach my target event?"

### Endurance metrics

| Metric | Calculation | Source |
|---|---|---|
| Weekly running km | Sum of run distance (current Mon-Sun) | Strava |
| Weekly cycling km | Sum of ride distance (current Mon-Sun) | Strava |
| Weekly elevation gain | Sum of elevation from all activities | Strava |
| Longest run this month | Max run distance in rolling 30 days | Strava |
| Longest ride this month | Max ride distance in rolling 30 days | Strava |
| Zone 2 time (estimated) | Duration where avg HR < 75% max HR | Strava + HR data |
| Running ACWR | 7-day vs 28-day average weekly run km | Strava |
| Cycling ACWR | 7-day vs 28-day average weekly ride km | Strava |
| Climbing volume | Weekly elevation gain rolling 4-week average | Strava |
| Activity frequency | Sessions per week, 4-week rolling | Strava |

### Event preparedness scoring

The Madrid to Segovia preparedness score is deterministic. It compares current endurance metrics against evidence-based thresholds for completing a 160km+ MTB climb through the Sierra Nevada in summer conditions.

```
Madrid-Segovia Preparedness = weighted combination of:
  - Longest ride this month vs target (needs: 100km+ long ride) : 30%
  - Weekly cycling km vs target (needs: 150km/week base)        : 25%
  - Weekly elevation gain vs target (needs: 2,000m/week)        : 25%
  - Fitness trend (improving ACWR over 6 weeks)                 : 10%
  - Heat adaptation indicator (recent outdoor rides in heat)    : 10%
```

A Half Marathon Base Score uses equivalent logic: long run progression, weekly km, weekly frequency, pace trend.

Both scores are 0-100 and displayed as a progress indicator with a projected readiness date. No LLM involvement in the score itself.

---

## Rough data philosophy

Precise nutrition tracking is unsustainable for most people. Cognix uses bands:

| Band | Meaning | Protein score |
|---|---|---|
| Low | Under 50% of target | 25/100 |
| Okay | Roughly half target | 60/100 |
| Good | Near or at target | 85/100 |
| High | Above target | 95/100 |

A rough answer every day for 30 days beats a precise answer for 3 days.

---

## Data provenance: four distinct states

Cognix separates four concepts that are often conflated:

| Concept | Meaning | TypeScript flag |
|---|---|---|
| Demo mode | Settings toggle is on; the app loads seeded example data | `provenance.isDemoMode` |
| Mock biometrics | Wearable data is simulated; no real device connected | `provenance.usesMockBiometrics` |
| Demo history | Check-in and training data from seeded mock history, not the user's own logs | `provenance.usesDemoHistory` |
| User logs | The user has typed real check-ins or sessions into the app | `provenance.hasUserCheckIn`, `provenance.hasUserTraining` |

### Data state labels

| Label | When it appears |
|---|---|
| Demo mode | `isDemoMode=true` (toggle on; everything is seeded) |
| Demo history + mock biometrics | Demo history active but toggle is off |
| Manual logs + mock biometrics | User has logged real check-ins/sessions but no wearable connected |
| Live personal data | Real wearable connected (v0.5+) and user has their own logs |
| Limited data | No demo mode, no wearable, no check-ins |

### Signal status in v0.1

| Signal | Status | When it becomes real |
|---|---|---|
| Recovery, HRV, RHR, sleep | Mock | v0.5: first recovery provider connected |
| Daily check-in (wellbeing, nutrition, caffeine) | Real if user logs it, demo otherwise | Immediate |
| Training sessions | Real if user logs it, demo otherwise | Immediate |
| Strava activities (runs, rides) | Not yet connected | v0.3 |
| Readiness score | Always deterministic from above signals | Always |

---

## AI brief layer (v0.1.1)

A provider-agnostic LLM layer generates daily intelligence briefs. The deterministic engine is the source of truth; the LLM only writes explanatory prose.

Configured via environment variables:

```bash
LLM_PROVIDER=anthropic          # or: deterministic (default), openai, openrouter, ollama
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6
```

If no key is set, the app uses the `DeterministicProvider` which converts the deterministic recommendation into brief format without any API call.

See `AI_STRATEGY.md` for the full provider architecture, retry logic, caching, and token cost model. See `COACHING_SPEC.md` for the LLM's exact role within the coaching system.

---

## Provider abstraction architecture (v0.3+)

All external data sources feed through a typed normalisation layer. No page component or scoring function ever calls a provider SDK directly.

```
External source (Strava / Garmin / WHOOP / Fitbit / Oura)
        |
        v
  Provider adapter (src/lib/providers/<name>.ts)
        |
        v
  Normalised types (ActivityRecord, RecoveryRecord, SleepRecord)
        |
        v
  Supabase upsert
        |
        v
  Scoring engine (unchanged)
        |
        v
  Dashboard / Endurance Base page (unchanged)
```

This means:
- Adding Garmin in v0.5 requires only `garmin.ts` and a new row in `provider_connections`
- The scoring engine never needs to know what device you use
- WHOOP, Oura, and Garmin all resolve to the same `RecoveryRecord` type

### Normalised activity record (v0.3)

```typescript
interface ActivityRecord {
  id: string
  user_id: string
  provider: "strava" | "garmin" | "manual"
  provider_activity_id: string
  activity_date: string               // ISO date
  activity_type: "Run" | "Ride" | "MountainBikeRide" | "Walk" | "Hike" | "Swim" | "Workout"
  name: string
  duration_seconds: number
  distance_metres: number
  elevation_gain_metres: number
  avg_heart_rate?: number
  max_heart_rate?: number
  avg_speed_ms?: number
  avg_watts?: number
  suffer_score?: number               // Strava-specific
  training_load?: number              // Garmin-specific
  perceived_exertion?: number         // normalised RPE 1-10
  polyline_encoded?: string           // route visualisation
  raw_json: object
  synced_at: string
}
```

### Normalised recovery record (v0.5)

```typescript
interface RecoveryRecord {
  id: string
  user_id: string
  provider: "garmin" | "whoop" | "oura" | "fitbit" | "manual"
  record_date: string
  recovery_score?: number             // 0-100 where available
  hrv_rmssd_ms?: number
  resting_heart_rate?: number
  sleep_total_ms?: number
  sleep_rem_ms?: number
  sleep_deep_ms?: number
  sleep_efficiency_pct?: number
  spo2_pct?: number
  body_battery?: number               // Garmin-specific
  readiness_score?: number            // Oura-specific
  raw_json: object
  synced_at: string
}
```

---

## Future Supabase migration (v0.2)

The localStorage schema is a 1:1 lift-and-shift to Supabase. Migration path:

1. Replace `src/lib/storage.ts` functions with Supabase client calls
2. Add RLS policies: users can only access their own rows
3. Add Supabase Auth (email + password for v0.2)
4. All component code stays the same

See `DATA_MODEL.md` for the full schema.

---

## Healthtech and digital biomarker relevance

**Digital biomarkers:** HRV deviation from personal baseline mirrors clinical digital biomarker validation methodology. Sleep architecture analysis (SWS, REM) parallels polysomnography-derived digital endpoints.

**Remote patient monitoring (RPM):** The wearable ingestion pipeline, signal processing, and threshold-based alerting mirror RPM system architecture used in cardiac rehabilitation and oncology symptom monitoring.

**Real-world evidence (RWE):** The experiment engine is a simplified N-of-1 study design: individual subject, repeated measures, controlled intervention, pre/post comparison.

**Endurance medicine:** ACWR and training load monitoring are used in sports medicine and physiotherapy to predict and prevent overtraining injuries. The Zone 2 time tracking maps directly to aerobic base development protocols used by elite endurance coaches.

**Pharma digital health:** The data confidence layer, deterministic/LLM separation, and no-medical-claims architecture are directly relevant to SaMD (Software as a Medical Device) development under EU MDR and FDA guidance.

---

## How to run locally

```bash
# 1. Clone
git clone https://github.com/jacksangster03/cognix
cd cognix

# 2. Install dependencies
npm install

# 3. Start dev server (no env vars needed for v0.1)
npm run dev

# 4. Open
open http://localhost:3000
```

The app opens in demo mode with mock biometric data and 14 days of sample history. Go to Settings to enter your name and goals, then start logging real check-ins and sessions.

---

## Roadmap

| Version | What ships |
|---|---|
| v0.1 | Local MVP: scoring engine, check-in, training log, planner, experiments, AI brief |
| v0.2 | Supabase + auth: multi-device sync |
| v0.3 | Strava integration: real activity import, Endurance Base page, event preparedness |
| v0.4 | Weather + FIT/GPX upload + Google Calendar: heat-adjusted hydration, real planner |
| v0.5 | Recovery provider: Oura Ring Gen 4 + Garmin Health (replaces mock biometrics) |
| v0.6 | Telegram workout logger: session state machine, set-by-set delivery, live logging |
| v0.7 | Natural-language session input: LLM as parser, structured output, pain/failure flows |
| v0.8 | Personalised prescription engine: exercise-specific progression, autoregulation |
| v0.9 | Strava, calendar and body metrics: endurance interference, weight trends, Renpho adapter |
| v0.10 | Live recovery data: Oura HRV, Garmin Body Battery, retire mock biometrics |
| v1.0 | Closed-loop adaptive coaching: rolling programme, mesocycle, individual response models |

---

## Recommended wearable hardware

See `INTEGRATIONS.md` for the full wearable comparison and recommendations. See `COACHING_SPEC.md`, `TELEGRAM_FLOWS.md`, `PROGRESSION_RULES.md` and `SAFETY_RULES.md` for the coaching system design.

**Device decisions (already made):**
- Primary sport watch: Garmin Fenix 8 (GPS, training load, Body Battery, topographic maps, MTB metrics)
- Recovery and sleep: Oura Ring Gen 4 (highest-accuracy overnight HRV; note: Oura currently requires a membership subscription for full feature access)
- WHOOP: ruled out (subscription, no GPS, Garmin+Oura is the better stack)

---

## Portfolio positioning

Relevant for roles in: pharma digital health, digital biomarkers, healthtech product, wearable data, AI decision support, remote patient monitoring, clinical data science, sports performance technology.

Interview talking points:
- Why is provider-agnostic architecture important here? (wearable market is fragmented; lock-in to one device limits the addressable user base and data quality)
- What is ACWR and why does it matter? (injury prediction metric from sports science; 7-day vs 28-day load ratio; used in elite sports and physiotherapy)
- Why does deterministic code calculate and LLM explain? (trustworthy, auditable, cost-controlled, regulatory-ready)
- What is HRV RMSSD and why use deviation not absolute value? (interpersonal variation is large; intra-individual deviation is clinically meaningful)
- What is Zone 2 training and why track it? (aerobic base development; the foundation of endurance capacity; chronically undertrained in recreational athletes)

See `PORTFOLIO_POSITIONING.md` for the full career narrative.

---

## Companion project

**Neuropharma RAG** (`github.com/jacksangster03/neuropharma-rag`): RAG pipeline over ClinicalTrials.gov + PubMed for Parkinson's disease drug pipeline intelligence. ChromaDB, sentence-transformers, Claude synthesis.

Together these projects cover the full range: clinical data engineering and wearable health intelligence.

---

## Disclaimer

Cognix is a personal performance tool. Not a medical device. Not medical advice. If you experience significant pain or are managing a health condition, seek qualified clinical advice before using any tool to guide training or nutrition decisions.

---

*Built with Next.js 15, TypeScript, Tailwind, shadcn/ui, Recharts. Designed to grow to Supabase, Strava, Garmin, weather, and a pluggable recovery provider layer.*
