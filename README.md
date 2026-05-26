# Cognix

**Personal health intelligence. What should I do today to make progress without burning out?**

Cognix synthesises biometric data (WHOOP), manual check-ins, nutrition, caffeine, supplement, and training logs into a single daily readiness score and actionable protocol. It is a personal performance operating system, not a fitness tracker.

---

## The core question

> "What should I do today to make progress without burning out?"

Cognix answers this question every morning with a deterministic readiness score, a training mode (Push / Normal / Moderate / Deload / Rest), and a structured protocol covering training, nutrition, hydration, caffeine, and supplements.

---

## Why Cognix exists

Most health and fitness apps show you data. Cognix synthesises it.

A recovery score of 72 means something different if your HRV is 20% above baseline vs. 15% below. A rest day is the wrong call if your ACWR shows you are undertrained. High stress today changes how your body handles training load tomorrow.

Cognix connects these signals into a single answer you can act on in 30 seconds each morning.

The secondary purpose is portfolio and career positioning. This project demonstrates:

- **Digital biomarker system design**: physiological signals, baseline tracking, deviation scoring
- **Wearable data architecture**: WHOOP API design, OAuth 2.0, real-time sync
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
| Data confidence scoring | Done |
| localStorage persistence | Done |
| Demo mode with mock WHOOP + history data | Done |
| Dark mode, responsive layout | Done |

---

## What v0.1 deliberately excludes

| Feature | Reason | Phase |
|---|---|---|
| Supabase / cloud database | Build and validate locally first | v0.2 |
| Auth | No need until multi-device sync matters | v0.2 |
| Claude / OpenAI synthesis | Scoring engine works without it | v0.3 |
| WHOOP OAuth | Mock data validates the pipeline first | v0.4 |
| Google Calendar | Mock blocks validate the planner | v0.5 |
| OpenWeatherMap | Trivial to add once core is proven | v0.5 |
| Strava | Manual training log sufficient for v0.1 | v0.6 |
| Spotify | Non-core intelligence feature | v0.7 |

---

## Product principles

**1. Deterministic code calculates; LLM explains.**
The readiness score, mode, caffeine risk, training load, and all component scores are calculated by pure TypeScript functions. Claude explains these scores in natural language in v0.3. The LLM never invents or adjusts a score.

**2. Rough data is acceptable.**
Cognix does not require precise calorie counting. Nutrition uses bands: Low / Okay / Good / High for protein, Under / About right / Over for calories. A rough answer every day beats a precise answer once a week.

**3. Useful without WHOOP.**
v0.1 uses mock WHOOP-style data. The app delivers value immediately. Real WHOOP OAuth connects in v0.4.

**4. Useful before AI.**
The first version generates deterministic daily recommendations without a single LLM call. This proves the logic works independently of the AI layer.

**5. Healthtech aesthetic, not gym-bro.**
Cognix feels analytical, calm, and premium. No streaks, no gamification, no emoji-heavy motivational copy.

**6. No medical claims.**
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
| AI synthesis (v0.3) | Anthropic Claude (claude-sonnet-4-6) |
| Biometrics (v0.4) | WHOOP API (OAuth 2.0) |
| Calendar (v0.5) | Google Calendar API |
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
    experiments/          Structured self-experiments
    integrations/         Integration roadmap catalogue
    settings/             Goals and preferences

  components/
    layout/               AppShell, Sidebar, MobileNav, PageHeader
    dashboard/            ReadinessHero, MetricTile, ModeBadge, DailyBriefCard,
                          TodayProtocol, WhyCookedCard, DataConfidenceCard,
                          QuickActions, TrendStrip
    experiments/          ExperimentCard, ExperimentBuilder
    integrations/         IntegrationCard

  lib/
    types.ts              All TypeScript interfaces and enums
    constants.ts          Mode config, score thresholds, storage keys
    storage.ts            localStorage read/write (future: Supabase)
    mock-whoop.ts         30-day mock WHOOP cycle data
    mock-history.ts       14-day mock check-in and training history
    scoring.ts            Deterministic scoring functions (pure)
    recommendations.ts    Deterministic recommendation engine (pure)
    training.ts           ACWR, muscle coverage, session load
    exercise-map.ts       Exercise to muscle group mapping + inference
    planner.ts            Calendar blocks + workout slot scoring
    confidence.ts         Data confidence calculation
    future-integrations.ts Integration catalogue for roadmap

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
 Demo mode? ─── Yes ──> Load mock WHOOP + mock history
        |
       No
        |
        v
 Load from localStorage
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

        (v0.3 adds: Claude API explains the scores in natural language)
```

---

## Deterministic scoring

All scores are 0-100. Higher is better. Every score is a pure function with no side effects and no API calls.

### Readiness score weights

| Component | Weight | Source |
|---|---|---|
| Recovery | 30% | WHOOP recovery score + HRV deviation |
| Sleep | 20% | WHOOP sleep performance percentage |
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

Training load = RPE x duration in minutes (session-RPE method).

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

## Data provenance: what is real vs. mock in v0.1

Cognix is transparent about which signals are real and which are simulated. Every data signal is tagged with its provenance in the `DataSources` object, which appears in the brief context and in cached briefs.

| Signal | v0.1 status | When it becomes real |
|---|---|---|
| WHOOP recovery score | Mock (`mock-whoop.ts`) | v0.4: WHOOP OAuth |
| HRV, RHR, sleep data | Mock (`mock-whoop.ts`) | v0.4: WHOOP OAuth |
| Daily check-in (wellbeing, nutrition, caffeine) | Real user data if logged, demo if not | Immediate: log a check-in |
| Training sessions | Real user data if logged, demo if not | Immediate: log a session |
| Readiness score | Deterministic from above signals | Always deterministic |

### UI indicators

The app shows a persistent indicator wherever mock biometric data is powering the readiness score:

- **Header chip**: "manual + mock biometrics" or "demo mode" (amber, small)
- **Brief card badge**: "mock data" chip on the brief card header
- **Brief card notice** (when expanded): amber callout explaining exactly which signals are mock and why

These indicators disappear automatically when real WHOOP data is connected in v0.4 (set `whoopIsReal: true` in `buildBriefContext`).

### DataSources type

```typescript
interface DataSources {
  whoop: "mock" | "real" | "missing"       // "real" from v0.4
  checkin: "user" | "demo" | "missing"     // "user" as soon as you log a check-in
  training: "user" | "demo" | "missing"    // "user" as soon as you log a session
  nutrition: "rough_user" | "demo" | "missing"
}
```

The AI brief is always labelled with its data sources in metadata. Cached briefs carry the `DataSources` snapshot from when they were generated.

---

## AI brief layer (v0.1.1)

A provider-agnostic LLM layer generates daily intelligence briefs. The deterministic engine is the source of truth; the LLM only writes explanatory prose.

Configured via environment variables:

```bash
LLM_PROVIDER=anthropic          # or: deterministic (default), openai, openrouter, ollama
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5
```

If no key is set, the app uses the `DeterministicProvider` which converts the deterministic recommendation into brief format without any API call. Adding a key enables the AI brief with a single button click in the dashboard.

See `AI_STRATEGY.md` for the full provider architecture, retry logic, caching, and token cost model.

---

## Future AI strategy (v0.3)

The LLM is the explanation layer, not the calculation layer. The scoring engine runs first. The LLM receives pre-computed scores and returns a natural language brief.

All LLM output is validated with Zod. If validation fails, the app retries once with a repair prompt, then falls back to deterministic text. The app never shows nothing.

---

## Future WHOOP integration (v0.4)

WHOOP uses OAuth 2.0 Authorization Code flow. Critical architectural note: WHOOP cycles are physiological (wake-to-wake), not calendar-based. Tuesday's recovery score reflects Monday night's sleep. All data models use `cycle_id`, not date.

Data available via WHOOP API: recovery_score, hrv_rmssd_milli, resting_heart_rate, sleep stages (total, REM, SWS, light, awake in ms), sleep_performance_pct, strain_score, kilojoules.

Data NOT available via API: raw HR streams, GPS, Stress Monitor, Healthspan score, ECG, blood pressure.

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

**Remote patient monitoring (RPM):** The wearable ingestion pipeline, signal processing, and threshold-based alerting mirror RPM system architecture.

**Real-world evidence (RWE):** The experiment engine is a simplified N-of-1 study design: individual subject, repeated measures, controlled intervention, pre/post comparison.

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

The app opens in demo mode with mock WHOOP data and 14 days of sample history. Go to Settings to enter your name and goals, then start logging real check-ins and sessions.

---

## Roadmap

| Version | What ships |
|---|---|
| v0.1 | Local MVP: scoring engine, check-in, training log, planner, experiments |
| v0.2 | Supabase + auth: multi-device sync |
| v0.3 | AI explanation: Claude brief, Ask Cognix chat |
| v0.4 | WHOOP OAuth: real biometric data |
| v0.5 | Calendar + weather: real workout slot planning |
| v0.6 | Strava, body metrics, smart scale |
| v0.7 | Spotify: mode-matched playlist interventions |
| v0.8 | Ask Cognix: conversational health assistant |
| v1.0 | Portfolio-ready public release |

---

## Portfolio positioning

Relevant for roles in: pharma digital health, digital biomarkers, healthtech product, wearable data, AI decision support, remote patient monitoring, clinical data science.

Interview talking points:
- Why is the WHOOP cycle physiological, not calendar-based? (sleep-to-wake, not midnight-to-midnight)
- What is ACWR? (injury prediction metric from sports science; 7-day vs 28-day load ratio)
- Why does deterministic code calculate and LLM explain? (trustworthy, auditable, cost-controlled, regulatory-ready)
- What is HRV RMSSD and why use deviation not absolute value? (interpersonal variation is large; intra-individual deviation is clinically meaningful)

See `PORTFOLIO_POSITIONING.md` for the full career narrative.

---

## Companion project

**Neuropharma RAG** (`github.com/jacksangster03/neuropharma-rag`): RAG pipeline over ClinicalTrials.gov + PubMed for Parkinson's disease drug pipeline intelligence. ChromaDB, sentence-transformers, Claude synthesis.

Together these projects cover the full range: clinical data engineering and wearable health intelligence.

---

## Disclaimer

Cognix is a personal performance tool. Not a medical device. Not medical advice. If you experience significant pain or are managing a health condition, seek qualified clinical advice before using any tool to guide training or nutrition decisions.

---

*Built with Next.js 15, TypeScript, Tailwind, shadcn/ui, Recharts. Designed to grow to Supabase, WHOOP, Claude, and Strava.*
