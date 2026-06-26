# Cognix Data Model

## v0.1: localStorage

Five keys. All stored as JSON.

| Key | Type | Notes |
|---|---|---|
| `cognix:settings` | `UserSettings` | One object per user |
| `cognix:checkins` | `DailyCheckIn[]` | Array, sorted by date, last 90 days |
| `cognix:training_sessions` | `TrainingSession[]` | Array, sorted by date, last 120 sessions |
| `cognix:experiments` | `Experiment[]` | Array, persists indefinitely |
| `cognix:demo_mode` | `boolean` | Default true |

All types are defined in `src/lib/types.ts`.

---

## v0.2+: Supabase tables

### user_profiles

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  goal_phase TEXT CHECK (goal_phase IN (
    'muscle_gain', 'fat_loss', 'recomp', 'maintenance', 'endurance', 'health'
  )),
  bodyweight_kg DECIMAL,
  protein_target_g INTEGER,
  water_target_litres DECIMAL,
  preferred_training_time TEXT,
  caffeine_cutoff_hour INTEGER DEFAULT 14,
  timezone TEXT DEFAULT 'Europe/Madrid',
  demo_mode BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### whoop_tokens

```sql
CREATE TABLE whoop_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,     -- encrypted at application layer
  refresh_token TEXT NOT NULL,    -- encrypted at application layer
  expires_at TIMESTAMPTZ NOT NULL,
  whoop_user_id TEXT,
  scopes TEXT[] NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ
);
```

### whoop_cycles

One row per WHOOP physiological cycle (wake-to-wake, not calendar day).

```sql
CREATE TABLE whoop_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  whoop_cycle_id BIGINT NOT NULL,
  cycle_start TIMESTAMPTZ NOT NULL,
  cycle_end TIMESTAMPTZ,            -- NULL if current cycle
  recovery_score INTEGER,
  recovery_state TEXT,              -- SCORED | PENDING_SCORE | UNSCORABLE
  hrv_rmssd_milli DECIMAL,
  resting_heart_rate INTEGER,
  spo2_percentage DECIMAL,
  skin_temp_celsius DECIMAL,
  sleep_total_ms BIGINT,
  sleep_rem_ms BIGINT,
  sleep_sws_ms BIGINT,
  sleep_light_ms BIGINT,
  sleep_awake_ms BIGINT,
  sleep_performance_pct INTEGER,
  sleep_consistency_pct INTEGER,
  sleep_efficiency_pct INTEGER,
  respiratory_rate DECIMAL,
  strain_score DECIMAL,
  kilojoules DECIMAL,
  raw_json JSONB,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, whoop_cycle_id)
);
```

### daily_checkins

```sql
CREATE TABLE daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  mood INTEGER CHECK (mood BETWEEN 1 AND 5),
  energy INTEGER CHECK (energy BETWEEN 1 AND 5),
  stress INTEGER CHECK (stress BETWEEN 1 AND 5),
  soreness INTEGER CHECK (soreness BETWEEN 1 AND 5),
  pain_score INTEGER CHECK (pain_score BETWEEN 0 AND 10),
  pain_area TEXT,
  planned_workout TEXT,
  protein TEXT CHECK (protein IN ('Low', 'Okay', 'Good', 'High', 'Unknown')),
  calories TEXT CHECK (calories IN ('Under', 'About right', 'Over', 'Unknown')),
  hydration TEXT CHECK (hydration IN ('Low', 'Okay', 'Good', 'Unknown')),
  caffeine_amount TEXT CHECK (caffeine_amount IN ('None', 'Low', 'Moderate', 'High')),
  last_caffeine_time TEXT,
  supplements_taken TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, checkin_date)
);
```

### training_sessions

```sql
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_type TEXT CHECK (session_type IN (
    'Strength', 'Cardio', 'HIIT', 'Mobility', 'Sport', 'Recovery', 'Rest'
  )),
  duration_minutes INTEGER,
  rpe DECIMAL CHECK (rpe BETWEEN 1 AND 10),
  session_load DECIMAL GENERATED ALWAYS AS (rpe * duration_minutes) STORED,
  muscle_groups TEXT[],
  exercises_freeform TEXT,
  notes TEXT,
  pain_score INTEGER CHECK (pain_score BETWEEN 0 AND 10),
  source TEXT DEFAULT 'manual',     -- 'manual' | 'strava' | 'whoop'
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### supplement_logs

```sql
CREATE TABLE supplement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  log_time TIME,
  supplement_name TEXT NOT NULL,
  dose_amount DECIMAL,
  dose_unit TEXT,
  timing_context TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### experiments

```sql
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_key TEXT NOT NULL,      -- links to template ID
  name TEXT NOT NULL,
  duration_days INTEGER,
  metric_target TEXT,
  status TEXT CHECK (status IN ('idle', 'active', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### daily_briefs

```sql
CREATE TABLE daily_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brief_date DATE NOT NULL,
  readiness_score INTEGER,
  mode TEXT,
  brief_text TEXT,                   -- deterministic fallback
  ai_brief JSONB,                    -- Claude output (v0.3+)
  training_recommendation TEXT,
  context_used JSONB,                -- snapshot of inputs
  model_used TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, brief_date)
);
```

### body_metrics

```sql
CREATE TABLE body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  weight_kg DECIMAL,
  body_fat_pct DECIMAL,
  measurement_method TEXT,
  notes TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Coaching schema (v0.3+)

These tables support the Telegram coaching loop. See `COACHING_SPEC.md` for design rationale.

### athlete_profiles

Extended profile beyond `user_profiles`. Stores stable goals, constraints, preferences and schedule rules.

```sql
CREATE TABLE athlete_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goals_primary TEXT[] NOT NULL DEFAULT '{}',
  goals_secondary TEXT[] DEFAULT '{}',
  priority_hierarchy TEXT[] NOT NULL DEFAULT '{}',
  available_days_per_week INTEGER,
  typical_session_minutes INTEGER,
  preferred_training_time TEXT,
  gym_name TEXT,
  strength_training_years INTEGER,
  running_level TEXT CHECK (running_level IN ('beginner','intermediate','advanced')),
  cycling_level TEXT CHECK (cycling_level IN ('beginner','intermediate','advanced')),
  schedule_rules JSONB DEFAULT '{}',
  equipment TEXT[] DEFAULT '{}',
  telegram_user_id BIGINT UNIQUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### training_programmes

```sql
CREATE TABLE training_programmes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  block_type TEXT CHECK (block_type IN ('hypertrophy','strength','endurance','mixed','deload')),
  status TEXT CHECK (status IN ('active','completed','abandoned')) DEFAULT 'active',
  goals JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### planned_sessions

One row per planned training day.

```sql
CREATE TABLE planned_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  programme_id UUID REFERENCES training_programmes(id),
  planned_date DATE NOT NULL,
  session_type TEXT NOT NULL,
  estimated_duration_minutes INTEGER,
  readiness_mode_at_planning TEXT,
  status TEXT CHECK (status IN ('pending','accepted','swapped','skipped','completed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### planned_exercises

One row per exercise within a planned session.

```sql
CREATE TABLE planned_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES planned_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  exercise_order INTEGER NOT NULL,
  purpose TEXT,
  target_sets INTEGER,
  rep_min INTEGER,
  rep_max INTEGER,
  target_rir INTEGER,
  target_load_kg DECIMAL,
  rest_seconds INTEGER,
  substitution_options TEXT[] DEFAULT '{}'
);
```

### performed_sets

Critical table. Never overwrite what was prescribed. Store prescription and performance separately.

```sql
CREATE TABLE performed_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  set_type TEXT CHECK (set_type IN ('warmup','working','backoff','technique','amrap')) DEFAULT 'working',
  prescribed_load_kg DECIMAL,
  prescribed_rep_min INTEGER,
  prescribed_rep_max INTEGER,
  prescribed_rir INTEGER,
  actual_load_kg DECIMAL,
  actual_reps INTEGER,
  actual_rir INTEGER,
  completion_status TEXT CHECK (completion_status IN ('completed','failed','skipped','pain_stop')) DEFAULT 'completed',
  rep_quality TEXT CHECK (rep_quality IN ('fast','normal','slow','grinder','technique_breakdown')),
  pain_score INTEGER CHECK (pain_score BETWEEN 0 AND 10),
  pain_location TEXT,
  rest_seconds INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  source TEXT CHECK (source IN ('telegram_button','telegram_text','manual','garmin')) DEFAULT 'telegram_button',
  raw_user_text TEXT,
  parser_confidence DECIMAL CHECK (parser_confidence BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### progression_states

Exercise-level state. Updated by the learning engine after each session.

```sql
CREATE TABLE progression_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  estimated_1rm_kg DECIMAL,
  current_working_load_kg DECIMAL,
  preferred_rep_min INTEGER,
  preferred_rep_max INTEGER,
  typical_set_dropoff_pct DECIMAL,
  minimum_recovery_hours INTEGER,
  load_increment_kg DECIMAL,
  performance_trend TEXT CHECK (performance_trend IN ('improving','stable','declining','insufficient_data')) DEFAULT 'insufficient_data',
  confidence DECIMAL CHECK (confidence BETWEEN 0 AND 1) DEFAULT 0,
  last_exposure_date DATE,
  total_exposures INTEGER DEFAULT 0,
  notes TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, exercise_id)
);
```

### coach_decisions

Audit trail for every automated coaching decision.

```sql
CREATE TABLE coach_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES training_sessions(id),
  decision_type TEXT NOT NULL,
  decision_at TIMESTAMPTZ DEFAULT NOW(),
  inputs JSONB NOT NULL,
  output JSONB NOT NULL,
  engine TEXT NOT NULL,
  readiness_score INTEGER,
  readiness_mode TEXT
);
```

### pain_events

```sql
CREATE TABLE pain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES training_sessions(id),
  exercise_id TEXT,
  pain_score INTEGER CHECK (pain_score BETWEEN 0 AND 10),
  pain_location TEXT,
  pain_type TEXT,
  triggered_safety_stop BOOLEAN DEFAULT FALSE,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);
```

### llm_interactions

For cost tracking, debugging and audit.

```sql
CREATE TABLE llm_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES training_sessions(id),
  interaction_type TEXT CHECK (interaction_type IN ('parse_set_result','explain_decision','clarification','trend_summary','daily_brief')),
  raw_user_text TEXT,
  structured_output JSONB,
  parser_confidence DECIMAL,
  model_used TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Relationships

```
auth.users
  1 -- 1  user_profiles
  1 -- 1  whoop_tokens
  1 -- N  whoop_cycles
  1 -- N  daily_checkins
  1 -- N  training_sessions
  1 -- N  supplement_logs
  1 -- N  experiments
  1 -- N  daily_briefs
  1 -- N  body_metrics
```

## RLS principles

All tables have `ENABLE ROW LEVEL SECURITY`. One policy per table:

```sql
CREATE POLICY "user_isolation" ON <table>
  FOR ALL USING (auth.uid() = user_id);
```

No exceptions. Users can only access their own rows.

## Migration from localStorage to Supabase

The migration is a straight lift-and-shift:

1. Create all tables above
2. Enable RLS on each
3. Replace each function in `src/lib/storage.ts` with a Supabase client call
4. The function signature stays the same (same parameters, same return type)
5. Change synchronous calls to `async/await` in page components

No component rewrites required.
