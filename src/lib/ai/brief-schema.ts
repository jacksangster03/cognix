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
// Every signal that feeds the brief is tagged with its provenance.
// "mock"      = generated from mock-whoop.ts, not a real device
// "real"      = from an authenticated wearable API (v0.4+)
// "user"      = user typed it into a check-in form
// "rough_user"= user typed a rough band (not tracked calories), still their data
// "demo"      = seeded from MOCK_CHECKIN_HISTORY / MOCK_TRAINING_HISTORY
// "missing"   = signal not present at all

export interface DataSources {
  whoop: "mock" | "real" | "missing"
  checkin: "user" | "demo" | "missing"
  training: "user" | "demo" | "missing"
  nutrition: "rough_user" | "demo" | "missing"
}

// ─── Brief metadata ───────────────────────────────────────────────────────────

export interface BriefMetadata {
  provider: string
  model: string
  generated_at: string
  fallback_used: boolean
  cached: boolean
  is_demo: boolean
  data_sources: DataSources
}

// ─── Cached brief ─────────────────────────────────────────────────────────────

export interface CachedBrief {
  date: string
  brief: CognixBrief
  metadata: BriefMetadata
  data_sources: DataSources
  is_demo: boolean
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
  is_demo: boolean
  data_sources: DataSources
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
  is_demo: z.boolean(),
  data_sources: z.object({
    whoop: z.enum(["mock", "real", "missing"]),
    checkin: z.enum(["user", "demo", "missing"]),
    training: z.enum(["user", "demo", "missing"]),
    nutrition: z.enum(["rough_user", "demo", "missing"]),
  }),
})
