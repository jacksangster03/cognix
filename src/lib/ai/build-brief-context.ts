// ─── BriefContext builder ─────────────────────────────────────────────────────
// Assembles all pre-calculated signals into the BriefContext shape that is
// sent to /api/brief. Called from client components after the deterministic
// engine has already run. Nothing here calls an LLM.

import { getACWR } from "@/lib/scoring"
import { buildConfidence } from "@/lib/confidence"
import { buildDailyRecommendation } from "@/lib/recommendations"
import type { MockWhoopDay, DailyCheckIn, TrainingSession, ReadinessScores, UserSettings } from "@/lib/types"
import type { BriefContext } from "./brief-schema"

export function buildBriefContext(
  date: string,
  scores: ReadinessScores,
  checkin: DailyCheckIn | null,
  whoop: MockWhoopDay | null,
  sessions: TrainingSession[],
  settings: UserSettings,
): BriefContext {
  const mode = (() => {
    const { determineMode } = require("@/lib/scoring")
    return determineMode(scores, checkin)
  })()

  const recentSessions = sessions.filter((s) => {
    const diff = (new Date(date).getTime() - new Date(s.date).getTime()) / 86400000
    return diff <= 7
  })

  const acute = recentSessions.reduce((sum, s) => sum + s.rpe * s.duration_minutes, 0) / 7
  const chronicSessions = sessions.filter((s) => {
    const diff = (new Date(date).getTime() - new Date(s.date).getTime()) / 86400000
    return diff <= 28
  })
  const chronic = chronicSessions.reduce((sum, s) => sum + s.rpe * s.duration_minutes, 0) / 28
  const acwr = getACWR(sessions)

  const deterministic_rec = buildDailyRecommendation(scores, checkin, whoop, sessions, settings)
  const data_confidence = buildConfidence(whoop, checkin, sessions, !!settings.name)

  return {
    date,
    mode,
    scores,
    checkin,
    sessions_summary: {
      recent_7d_count: recentSessions.length,
      acwr,
      acute_load: Math.round(acute),
      chronic_load: Math.round(chronic),
    },
    settings: {
      goal_phase: settings.goal_phase,
      protein_target_g: settings.protein_target_g,
      water_target_litres: settings.water_target_litres,
      caffeine_cutoff_hour: settings.caffeine_cutoff_hour,
      name: settings.name,
    },
    deterministic_rec,
    data_confidence,
    whoop_summary: whoop && whoop.score_state === "SCORED"
      ? {
          recovery_score: whoop.recovery_score,
          hrv_rmssd: Math.round(whoop.hrv_rmssd_milli * 10) / 10,
          hrv_baseline: Math.round(whoop.hrv_30d_mean * 10) / 10,
          sleep_total_hours: Math.round((whoop.sleep_total_ms / 3600000) * 10) / 10,
          sleep_performance_pct: whoop.sleep_performance_pct,
          resting_heart_rate: whoop.resting_heart_rate,
        }
      : null,
  }
}
