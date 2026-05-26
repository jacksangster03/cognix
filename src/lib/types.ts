// ─── Core categorical types ──────────────────────────────────────────────────

export type Mode = "Push" | "Normal" | "Moderate" | "Deload" | "Rest"

export type ScoreState = "SCORED" | "PENDING_SCORE" | "UNSCORABLE"

export type ProteinBand = "Low" | "Okay" | "Good" | "High" | "Unknown"

export type HydrationBand = "Low" | "Okay" | "Good" | "Unknown"

export type CalorieBand = "Under" | "About right" | "Over" | "Unknown"

export type CaffeineAmount = "None" | "Low" | "Moderate" | "High"

export type LastCaffeineTimeBand =
  | "None"
  | "Before 12"
  | "12 to 14"
  | "14 to 16"
  | "After 16"

export type SessionType =
  | "Strength"
  | "Cardio"
  | "HIIT"
  | "Mobility"
  | "Sport"
  | "Recovery"
  | "Rest"

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "core"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "full_body"

export type IntegrationStatus = "connected" | "coming_soon" | "planned" | "not_started"

export type IntegrationPhase = "v0.2" | "v0.3" | "v0.4" | "v0.5" | "v0.6" | "v0.7" | "v1.0"

// ─── WHOOP mock data ──────────────────────────────────────────────────────────

export interface MockWhoopDay {
  date: string                        // ISO date YYYY-MM-DD
  recovery_score: number              // 0-100
  hrv_rmssd_milli: number            // e.g. 58.4
  hrv_30d_mean: number               // rolling 30-day baseline
  resting_heart_rate: number         // bpm
  rhr_30d_mean: number               // rolling baseline
  sleep_total_ms: number
  sleep_rem_ms: number
  sleep_sws_ms: number               // slow-wave / deep sleep
  sleep_light_ms: number
  sleep_awake_ms: number
  sleep_performance_pct: number      // 0-100
  sleep_consistency_pct: number
  sleep_efficiency_pct: number
  strain_score: number               // 0-21
  kilojoules: number
  score_state: ScoreState
  respiratory_rate?: number
  spo2_pct?: number
  skin_temp_celsius?: number
}

// ─── Daily check-in ───────────────────────────────────────────────────────────

export interface DailyCheckIn {
  id: string                         // UUID or timestamp string
  date: string                       // ISO date YYYY-MM-DD
  created_at: string                 // ISO datetime

  // Subjective wellbeing (1-5 scale)
  sleep_quality: number
  mood: number
  energy: number
  stress: number
  soreness: number

  // Pain
  pain_score: number                 // 0-10
  pain_area?: string                 // freeform, optional

  // Planned workout
  planned_workout?: string

  // Rough nutrition bands
  protein: ProteinBand
  calories: CalorieBand
  hydration: HydrationBand

  // Caffeine
  caffeine_amount: CaffeineAmount
  last_caffeine_time: LastCaffeineTimeBand

  // Supplements (list of supplement names taken today)
  supplements_taken: string[]

  notes?: string
}

// ─── Training session ─────────────────────────────────────────────────────────

export interface TrainingSession {
  id: string
  date: string                       // ISO date
  session_type: SessionType
  duration_minutes: number
  rpe: number                        // 1-10
  muscle_groups: MuscleGroup[]
  exercises_freeform?: string        // raw text log
  parsed_exercises?: import("./exercise-parser").ParsedExercise[]
  notes?: string
  pain_score?: number                // 0-10

  // session load = rpe × duration (calculated, not stored)
}

// ─── User settings ────────────────────────────────────────────────────────────

export interface UserSettings {
  name: string
  goal_phase: "muscle_gain" | "fat_loss" | "recomp" | "maintenance" | "endurance" | "health"
  bodyweight_kg: number
  protein_target_g: number
  water_target_litres: number
  preferred_training_time: "morning" | "lunch" | "afternoon" | "evening"
  caffeine_cutoff_hour: number       // e.g. 14 means no caffeine after 14:00
  timezone: string                   // e.g. "Europe/Madrid"
  demo_mode: boolean
}

// ─── Readiness scores (all 0-100) ────────────────────────────────────────────

export interface ReadinessScores {
  recovery: number
  sleep: number
  subjective: number
  nutrition: number
  hydration: number
  caffeine: number
  training_load: number
  pain: number
  overall: number
  data_confidence: number            // 0-100, how much data is available
}

// ─── Daily recommendation ─────────────────────────────────────────────────────

export interface DailyRecommendation {
  mode: Mode
  headline: string
  training: string
  nutrition: string
  hydration: string
  caffeine: string
  supplements: string
  sleep: string
  main_risk: string
  one_priority: string
  reasons: string[]
}

// ─── Planner ─────────────────────────────────────────────────────────────────

export interface CalendarBlock {
  label: string
  start_hour: number                 // 0-23
  end_hour: number
  type: "busy" | "free" | "meal" | "social"
}

export interface WorkoutSlotRecommendation {
  start_hour: number
  end_hour: number
  label: string
  duration_available_minutes: number
  score: number                      // 0-100
  rationale: string
  recommended_session_type: SessionType
  recommended_duration_minutes: number
}

// ─── Experiments ──────────────────────────────────────────────────────────────

export interface Experiment {
  id: string
  name: string
  description: string
  hypothesis: string
  duration_days: number
  metric_target: string
  protocol: string[]
  status: "idle" | "active" | "completed" | "abandoned"
  started_at?: string
  ended_at?: string
  notes?: string
}

// ─── Future integrations catalogue ───────────────────────────────────────────

export interface FutureIntegration {
  id: string
  name: string
  description: string
  what_it_adds: string[]
  why_it_matters: string
  phase: IntegrationPhase
  status: IntegrationStatus
  oauth_required: boolean
  api_complexity: "low" | "medium" | "high"
  estimated_effort: string
  data_fields_unlocked: string[]
  docs_url?: string
}

// ─── Data confidence breakdown ────────────────────────────────────────────────

export interface DataConfidence {
  overall: number                    // 0-100
  whoop_connected: boolean
  has_checkin_today: boolean
  has_training_history: boolean
  has_settings: boolean
  missing_signals: string[]
  confidence_label: "Low" | "Moderate" | "High" | "Full"
}
