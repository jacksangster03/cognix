import { z } from "zod"
import type {
  Mode,
  ReadinessScores,
  DailyCheckIn,
  DailyRecommendation,
  DataConfidence,
} from "@/lib/types"

// ─── LLM output schema ────────────────────────────────────────────────────────
// The model must return valid JSON matching this shape. Fields must contain
// plain prose: no markdown, no em dashes, British English. The model never
// sets mode or scores — those are passed in from the deterministic engine.

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

// ─── Brief metadata ───────────────────────────────────────────────────────────

export interface BriefMetadata {
  provider: string
  model: string
  generated_at: string    // ISO datetime
  fallback_used: boolean
  cached: boolean
}

// ─── Cached brief (stored in localStorage) ───────────────────────────────────

export interface CachedBrief {
  date: string           // ISO date YYYY-MM-DD
  brief: CognixBrief
  metadata: BriefMetadata
}

// ─── Brief context (sent to /api/brief) ──────────────────────────────────────
// Contains ALL pre-calculated signals. The LLM reads these and writes
// explanatory prose. It never modifies mode, scores, or calculated values.

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
})
