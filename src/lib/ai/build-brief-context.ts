// ─── BriefContext builder ─────────────────────────────────────────────────────
// Assembles all pre-calculated signals into the BriefContext shape sent to
// /api/brief. Also exports getDataStateLabel for consistent UI labels across
// all components.
//
// DataSourceFlags — caller-supplied facts about data origin:
//   isDemoMode      - the demo mode setting toggle is on
//   whoopIsReal     - false in v0.1; set true in v0.4 when WHOOP OAuth connects
//   checkinFromDemo - the checkin came from MOCK_CHECKIN_HISTORY
//   sessionsFromDemo- sessions came from MOCK_TRAINING_HISTORY

import { getACWR, determineMode } from "@/lib/scoring"
import { buildConfidence } from "@/lib/confidence"
import { buildDailyRecommendation } from "@/lib/recommendations"
import {
  calculateWeeklySetsByMuscleGroup,
  calculateMuscleCoverageScore,
  getMuscleGroupGaps,
  findOverrepresentedMuscleGroups,
  getTrainingConflictsForToday,
  getDaysSinceLastSession,
  getWeeklySessionCount,
} from "@/lib/training"
import { getMuscleGroupLabel } from "@/lib/exercise-map"
import type { MockWhoopDay, DailyCheckIn, TrainingSession, ReadinessScores, UserSettings } from "@/lib/types"
import type {
  BriefContext,
  DataSources,
  ProvenanceFlags,
  DataStateLabel,
  TrainingIntelligence,
} from "./brief-schema"

export interface DataSourceFlags {
  isDemoMode: boolean
  whoopIsReal?: boolean       // default false; set true in v0.4
  checkinFromDemo?: boolean   // true when using MOCK_CHECKIN_HISTORY
  sessionsFromDemo?: boolean  // true when using MOCK_TRAINING_HISTORY
}

// ─── Data state label ─────────────────────────────────────────────────────────
// Returns the single canonical label for the current data provenance state.
// Shared by ReadinessHero, DailyBriefCard, and the dashboard notice chip.

export function getDataStateLabel(p: ProvenanceFlags): DataStateLabel {
  // Real wearable connected — all data is live (v0.4+)
  if (!p.usesMockBiometrics && (p.hasUserCheckIn || p.hasUserTraining)) {
    return "Live personal data"
  }
  // Demo mode toggle is on: whole app is seeded with demo history + mock WHOOP
  if (p.isDemoMode) {
    return "Demo mode"
  }
  // Demo history active but demo toggle is somehow off (edge case in development)
  if (p.usesDemoHistory && p.usesMockBiometrics) {
    return "Demo history + mock biometrics"
  }
  // User has logged real check-ins/training but WHOOP is still mock
  if ((p.hasUserCheckIn || p.hasUserTraining) && p.usesMockBiometrics) {
    return "Manual logs + mock biometrics"
  }
  // No useful data at all
  return "Limited data"
}

// ─── Main builder ─────────────────────────────────────────────────────────────

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

  // Training intelligence
  const weeklySets = calculateWeeklySetsByMuscleGroup(sessions)
  const coverageScore = calculateMuscleCoverageScore(weeklySets)
  const gaps = getMuscleGroupGaps(weeklySets)
  const overrep = findOverrepresentedMuscleGroups(weeklySets)
  const conflicts = getTrainingConflictsForToday(sessions, date)

  const training_intelligence: TrainingIntelligence = {
    coverage_score: coverageScore,
    missing_groups: gaps.map((g) => g.label),
    overrepresented_groups: overrep.map((g) => getMuscleGroupLabel(g)),
    top_deficit: gaps.length > 0
      ? {
          group: gaps[0].label,
          deficit_sets: gaps[0].deficit,
          suggestion: gaps[0].suggestion,
        }
      : null,
    conflicts_today: conflicts.map((c) => ({ group: c.label, hours_ago: c.hoursAgo })),
    days_since_last_session: getDaysSinceLastSession(sessions),
    weekly_session_count: getWeeklySessionCount(sessions),
  }

  const data_sources: DataSources = {
    whoop: whoop !== null ? (whoopIsReal ? "real" : "mock") : "missing",
    checkin: checkin !== null ? (checkinFromDemo ? "demo" : "user") : "missing",
    training: sessions.length > 0 ? (sessionsFromDemo ? "demo" : "user") : "missing",
    nutrition: checkin !== null ? (checkinFromDemo ? "demo" : "rough_user") : "missing",
  }

  const provenance: ProvenanceFlags = {
    isDemoMode,
    usesMockBiometrics: data_sources.whoop === "mock",
    usesDemoHistory: data_sources.checkin === "demo" || data_sources.training === "demo",
    hasUserCheckIn: data_sources.checkin === "user",
    hasUserTraining: data_sources.training === "user",
  }

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
    training_intelligence,
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
    data_sources,
    provenance,
  }
}
