import { z } from "zod"
import type {
  Mode,
  ReadinessScores,
  DailyCheckIn,
  DailyRecommendation,
  DataConfidence,
} from "@/lib/types"

// ─── LLM output schema ────────────────────────────────────────────────────────

export const CognixBriefSchema = z.object({
  headline: z.string().min(10).max(200),
  overall_readout: z.string().min(20).max(500),
  training_recommendation: z.string().min(10).max(400),
  nutrition_guidance: z.string().min(10).max(400),
  hydration_guidance: z.string().min(10).max(300),
  caffeine_guidance: z.string().min(10).max(300),
  supplement_notes: z.string().min(10).max(300),
  sleep_focus: z.string().min(10).max(300),
  main_risk: z.string().min(10).max(300),
  one_priority: z.string().min(10).max(200),
  data_confidence_note: z.string().min(10).max(300),
})

export type CognixBrief = z.infer<typeof CognixBriefSchema>

// ─── Data source tags ─────────────────────────────────────────────────────────
// Tags the provenance of each signal that feeds the brief.
//
// whoop:
//   "mock"     = generated from mock-whoop.ts; no real wearable connected
//   "real"     = from authenticated WHOOP API (v0.4+)
//   "missing"  = no WHOOP data at all (demo mode off, no wearable)
//
// checkin / training:
//   "user"      = user typed this into the check-in or training form (localStorage)
//   "demo"      = seeded from MOCK_CHECKIN_HISTORY / MOCK_TRAINING_HISTORY
//   "missing"   = no data present
//
// nutrition:
//   "rough_user" = user entered a rough band in the check-in form
//   "demo"       = from mock history
//   "missing"    = no check-in data

export interface DataSources {
  whoop: "mock" | "real" | "missing"
  checkin: "user" | "demo" | "missing"
  training: "user" | "demo" | "missing"
  nutrition: "rough_user" | "demo" | "missing"
}

// ─── Provenance flags ─────────────────────────────────────────────────────────
// Explicit booleans derived from DataSources. Components use these for UI
// labels and the prompt uses them for precise caveat text.
//
// isDemoMode:        The demo mode setting toggle is on.
// usesMockBiometrics: WHOOP data is simulated (always true in v0.1 when WHOOP present).
//                    False when real WHOOP is connected in v0.4.
// usesDemoHistory:   Check-in or training data comes from seeded demo history.
// hasUserCheckIn:    A user-typed check-in is powering the subjective scores.
// hasUserTraining:   User-logged sessions are powering ACWR and muscle coverage.

export interface ProvenanceFlags {
  isDemoMode: boolean
  usesMockBiometrics: boolean
  usesDemoHistory: boolean
  hasUserCheckIn: boolean
  hasUserTraining: boolean
}

// ─── Data state label ─────────────────────────────────────────────────────────
// The single human-readable label summarising the provenance state.

export type DataStateLabel =
  | "Demo mode"
  | "Demo history + mock biometrics"
  | "Manual logs + mock biometrics"
  | "Live personal data"
  | "Limited data"

// ─── Brief metadata ───────────────────────────────────────────────────────────

export interface BriefMetadata {
  provider: string
  model: string
  generated_at: string
  fallback_used: boolean
  cached: boolean
  // is_demo: any non-real data was present when the brief was generated.
  // Distinct from isDemoMode (toggle) — a brief generated with real check-ins
  // but mock WHOOP has is_demo=true but isDemoMode=false.
  is_demo: boolean
  data_sources: DataSources
}

// ─── Cached brief ─────────────────────────────────────────────────────────────

export interface CachedBrief {
  date: string
  brief: CognixBrief
  metadata: BriefMetadata
  data_sources: DataSources
  provenance: ProvenanceFlags
}

// ─── Brief context (sent to /api/brief) ──────────────────────────────────────

export interface WhoopSummary {
  recovery_score: number
  hrv_rmssd: number
  hrv_baseline: number
  sleep_total_hours: number
  sleep_performance_pct: number
  resting_heart_rate: number
}

export interface TrainingIntelligence {
  coverage_score: number              // 0-100
  missing_groups: string[]            // muscle group names
  overrepresented_groups: string[]
  top_deficit: { group: string; deficit_sets: number; suggestion: string } | null
  conflicts_today: { group: string; hours_ago: number }[]
  days_since_last_session: number
  weekly_session_count: number
}

export interface BriefContext {
  date: string
  mode: Mode
  scores: ReadinessScores
  checkin: DailyCheckIn | null
  sessions_summary: {
    recent_7d_count: number
    acwr: number
    acute_load: number
    chronic_load: number
  }
  training_intelligence: TrainingIntelligence
  settings: {
    goal_phase: string
    protein_target_g: number
    water_target_litres: number
    caffeine_cutoff_hour: number
    name: string
  }
  deterministic_rec: DailyRecommendation
  data_confidence: DataConfidence
  whoop_summary: WhoopSummary | null
  data_sources: DataSources
  provenance: ProvenanceFlags
}

export const BriefContextSchema = z.object({
  date: z.string(),
  mode: z.enum(["Push", "Normal", "Moderate", "Deload", "Rest"]),
  scores: z.object({
    recovery: z.number(),
    sleep: z.number(),
    subjective: z.number(),
    nutrition: z.number(),
    hydration: z.number(),
    caffeine: z.number(),
    training_load: z.number(),
    pain: z.number(),
    overall: z.number(),
    data_confidence: z.number(),
  }),
  checkin: z.any().nullable(),
  sessions_summary: z.object({
    recent_7d_count: z.number(),
    acwr: z.number(),
    acute_load: z.number(),
    chronic_load: z.number(),
  }),
  training_intelligence: z.object({
    coverage_score: z.number(),
    missing_groups: z.array(z.string()),
    overrepresented_groups: z.array(z.string()),
    top_deficit: z.object({
      group: z.string(),
      deficit_sets: z.number(),
      suggestion: z.string(),
    }).nullable(),
    conflicts_today: z.array(z.object({ group: z.string(), hours_ago: z.number() })),
    days_since_last_session: z.number(),
    weekly_session_count: z.number(),
  }),
  settings: z.object({
    goal_phase: z.string(),
    protein_target_g: z.number(),
    water_target_litres: z.number(),
    caffeine_cutoff_hour: z.number(),
    name: z.string(),
  }),
  deterministic_rec: z.any(),
  data_confidence: z.any(),
  whoop_summary: z.any().nullable(),
  data_sources: z.object({
    whoop: z.enum(["mock", "real", "missing"]),
    checkin: z.enum(["user", "demo", "missing"]),
    training: z.enum(["user", "demo", "missing"]),
    nutrition: z.enum(["rough_user", "demo", "missing"]),
  }),
  provenance: z.object({
    isDemoMode: z.boolean(),
    usesMockBiometrics: z.boolean(),
    usesDemoHistory: z.boolean(),
    hasUserCheckIn: z.boolean(),
    hasUserTraining: z.boolean(),
  }),
})
