// ─── BriefContext builder ─────────────────────────────────────────────────────
// Assembles all pre-calculated signals into the BriefContext shape that is
// sent to /api/brief. Called from client components after the deterministic
// engine has already run.
//
// DataSourceFlags documents the provenance of each input signal:
//   isDemoMode     - the app's demo mode toggle is on
//   whoopIsReal    - set to true in v0.4 when WHOOP OAuth is connected;
//                    false in v0.1 (all WHOOP data is mock)
//   checkinFromDemo - the checkin was pulled from MOCK_CHECKIN_HISTORY
//   sessionsFromDemo - sessions were pulled from MOCK_TRAINING_HISTORY

import { getACWR, determineMode } from "@/lib/scoring"
import { buildConfidence } from "@/lib/confidence"
import { buildDailyRecommendation } from "@/lib/recommendations"
import type { MockWhoopDay, DailyCheckIn, TrainingSession, ReadinessScores, UserSettings } from "@/lib/types"
import type { BriefContext, DataSources } from "./brief-schema"

export interface DataSourceFlags {
  isDemoMode: boolean
  whoopIsReal?: boolean       // default false; flip to true in v0.4
  checkinFromDemo?: boolean   // true when using MOCK_CHECKIN_HISTORY
  sessionsFromDemo?: boolean  // true when using MOCK_TRAINING_HISTORY
}

export function buildBriefContext(
  date: string,
  scores: ReadinessScores,
  checkin: DailyCheckIn | null,
  whoop: MockWhoopDay | null,
  sessions: TrainingSession[],
  settings: UserSettings,
  flags: DataSourceFlags = { isDemoMode: false },
): BriefContext {
  const {
    isDemoMode,
    whoopIsReal = false,
    checkinFromDemo = isDemoMode,
    sessionsFromDemo = isDemoMode,
  } = flags

  const mode = determineMode(scores, checkin)

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

  const data_sources: DataSources = {
    whoop: whoop !== null ? (whoopIsReal ? "real" : "mock") : "missing",
    checkin: checkin !== null ? (checkinFromDemo ? "demo" : "user") : "missing",
    training: sessions.length > 0 ? (sessionsFromDemo ? "demo" : "user") : "missing",
    nutrition: checkin !== null
      ? (checkinFromDemo ? "demo" : "rough_user")
      : "missing",
  }

  const is_demo = isDemoMode || data_sources.whoop === "mock" || data_sources.checkin === "demo"

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
    is_demo,
    data_sources,
  }
}
