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
