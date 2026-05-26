import { SCORE_THRESHOLDS } from "./constants"
import type {
  MockWhoopDay,
  DailyCheckIn,
  TrainingSession,
  ReadinessScores,
  Mode,
  DataConfidence,
} from "./types"

// ─── Pure scoring functions (no side effects, no API calls) ───────────────────

export function calculateRecoveryScore(whoop: MockWhoopDay | null): number {
  if (!whoop || whoop.score_state !== "SCORED") return 50

  const base = whoop.recovery_score

  // Adjust for HRV deviation from personal baseline
  const hrvDev = whoop.hrv_30d_mean > 0
    ? ((whoop.hrv_rmssd_milli - whoop.hrv_30d_mean) / whoop.hrv_30d_mean) * 100
    : 0
  const hrvAdj = Math.min(10, Math.max(-15, hrvDev * 0.4))

  // Adjust for RHR deviation from personal baseline
  const rhrDev = whoop.rhr_30d_mean > 0
    ? ((whoop.resting_heart_rate - whoop.rhr_30d_mean) / whoop.rhr_30d_mean) * 100
    : 0
  const rhrAdj = Math.min(0, Math.max(-12, -rhrDev * 0.6))

  return Math.round(Math.min(100, Math.max(0, base + hrvAdj + rhrAdj)))
}

export function calculateSleepScore(whoop: MockWhoopDay | null): number {
  if (!whoop || whoop.score_state !== "SCORED") return 50

  const perf = whoop.sleep_performance_pct
  if (perf >= SCORE_THRESHOLDS.sleep_performance.good) return Math.round(70 + (perf - 85) * 2)
  if (perf >= SCORE_THRESHOLDS.sleep_performance.acceptable) return Math.round(45 + (perf - 70) * 1.67)
  if (perf >= SCORE_THRESHOLDS.sleep_performance.poor) return Math.round(20 + (perf - 55) * 1.67)
  return Math.max(0, Math.round(perf / 55 * 20))
}

export function calculateSubjectiveScore(checkin: DailyCheckIn | null): number {
  if (!checkin) return 50

  const positive = (checkin.sleep_quality + checkin.mood + checkin.energy) / 3
  const negative = (checkin.stress + checkin.soreness) / 2

  // positive 1-5 maps to 0-100, negative 1-5 inversely weighted
  const base = ((positive - 1) / 4) * 100
  const penalty = ((negative - 1) / 4) * 30

  return Math.round(Math.min(100, Math.max(0, base - penalty)))
}

export function calculateNutritionScore(checkin: DailyCheckIn | null): number {
  if (!checkin) return 50

  const proteinMap = { Low: 25, Okay: 60, Good: 85, High: 95, Unknown: 50 }
  const calorieMap = { Under: 50, "About right": 90, Over: 70, Unknown: 50 }

  const p = proteinMap[checkin.protein]
  const c = calorieMap[checkin.calories]
  return Math.round(p * 0.65 + c * 0.35)
}

export function calculateHydrationScore(checkin: DailyCheckIn | null): number {
  if (!checkin) return 50
  const map = { Low: 20, Okay: 60, Good: 95, Unknown: 50 }
  return map[checkin.hydration]
}

export function calculateCaffeineScore(checkin: DailyCheckIn | null, cutoffHour = 14): number {
  if (!checkin) return 80

  if (checkin.caffeine_amount === "None") return 100

  const timeRisk: Record<string, number> = {
    "None": 100,
    "Before 12": 95,
    "12 to 14": 75,
    "14 to 16": 40,
    "After 16": 10,
  }

  const amountMultiplier: Record<string, number> = {
    None: 1.0,
    Low: 1.0,
    Moderate: 0.85,
    High: 0.65,
  }

  const base = timeRisk[checkin.last_caffeine_time] ?? 70
  const mult = amountMultiplier[checkin.caffeine_amount] ?? 0.85

  // If caffeine after user's personal cutoff, additional penalty
  const latePenalty =
    checkin.last_caffeine_time === "After 16" && cutoffHour <= 16 ? -15
    : checkin.last_caffeine_time === "14 to 16" && cutoffHour <= 14 ? -10
    : 0

  return Math.round(Math.min(100, Math.max(0, base * mult + latePenalty)))
}

export function calculateTrainingScore(sessions: TrainingSession[]): number {
  if (sessions.length === 0) return 60

  const now = new Date()

  const acute = sessions
    .filter((s) => {
      const diff = (now.getTime() - new Date(s.date).getTime()) / 86400000
      return diff <= 7
    })
    .reduce((sum, s) => sum + s.rpe * s.duration_minutes, 0) / 7

  const chronic = sessions
    .filter((s) => {
      const diff = (now.getTime() - new Date(s.date).getTime()) / 86400000
      return diff <= 28
    })
    .reduce((sum, s) => sum + s.rpe * s.duration_minutes, 0) / 28

  const acwr = chronic === 0 ? 1.0 : acute / chronic

  if (acwr < 0.5) return 45
  if (acwr < 0.8) return 70
  if (acwr <= 1.3) return 100
  if (acwr <= 1.5) return 60
  return 25
}

export function calculatePainScore(checkin: DailyCheckIn | null): number {
  if (!checkin) return 100
  const p = checkin.pain_score
  if (p === 0) return 100
  if (p <= 2) return 85
  if (p <= 4) return 65
  if (p <= 6) return 40
  if (p <= 8) return 15
  return 0
}

export function calculateDataConfidence(
  whoop: MockWhoopDay | null,
  checkin: DailyCheckIn | null,
  sessions: TrainingSession[],
  hasSettings: boolean,
): DataConfidence {
  const missing: string[] = []
  let score = 0

  if (whoop && whoop.score_state === "SCORED") {
    score += 40
  } else {
    missing.push("WHOOP biometric data")
  }

  if (checkin) {
    score += 35
  } else {
    missing.push("Today's check-in")
  }

  if (sessions.length >= 3) {
    score += 15
  } else if (sessions.length >= 1) {
    score += 8
    missing.push("More training history (< 3 sessions logged)")
  } else {
    missing.push("Training history")
  }

  if (hasSettings) {
    score += 10
  } else {
    missing.push("User settings (goals, targets)")
  }

  const label: DataConfidence["confidence_label"] =
    score >= 90 ? "Full"
    : score >= 65 ? "High"
    : score >= 35 ? "Moderate"
    : "Low"

  return {
    overall: score,
    whoop_connected: !!whoop,
    has_checkin_today: !!checkin,
    has_training_history: sessions.length > 0,
    has_settings: hasSettings,
    missing_signals: missing,
    confidence_label: label,
  }
}

export function calculateReadinessScores(
  whoop: MockWhoopDay | null,
  checkin: DailyCheckIn | null,
  sessions: TrainingSession[],
  hasSettings: boolean,
  caffeinesCutoffHour = 14,
): ReadinessScores {
  const recovery = calculateRecoveryScore(whoop)
  const sleep = calculateSleepScore(whoop)
  const subjective = calculateSubjectiveScore(checkin)
  const nutrition = calculateNutritionScore(checkin)
  const hydration = calculateHydrationScore(checkin)
  const caffeine = calculateCaffeineScore(checkin, caffeinesCutoffHour)
  const training_load = calculateTrainingScore(sessions)
  const pain = calculatePainScore(checkin)
  const confidence = calculateDataConfidence(whoop, checkin, sessions, hasSettings)

  const overall = Math.round(
    recovery * 0.30 +
    sleep * 0.20 +
    subjective * 0.20 +
    nutrition * 0.10 +
    hydration * 0.08 +
    caffeine * 0.07 +
    training_load * 0.05
  )

  // Pain is a hard modifier, not a component
  const painCapped = checkin && checkin.pain_score >= 7 ? Math.min(overall, 30)
    : checkin && checkin.pain_score >= 5 ? Math.min(overall, 55)
    : overall

  return {
    recovery,
    sleep,
    subjective,
    nutrition,
    hydration,
    caffeine,
    training_load,
    pain,
    overall: painCapped,
    data_confidence: confidence.overall,
  }
}

export function determineMode(scores: ReadinessScores, checkin: DailyCheckIn | null): Mode {
  const painScore = checkin?.pain_score ?? 0

  if (painScore >= 7) return "Rest"
  if (painScore >= 5) {
    return scores.overall >= 55 ? "Deload" : "Rest"
  }

  const { overall } = scores

  if (overall >= 80) return "Push"
  if (overall >= 60) return "Normal"
  if (overall >= 40) return "Moderate"
  if (overall >= 20) return "Deload"
  return "Rest"
}

export function getACWR(sessions: TrainingSession[]): number {
  const now = new Date()

  const acute = sessions
    .filter((s) => (now.getTime() - new Date(s.date).getTime()) / 86400000 <= 7)
    .reduce((sum, s) => sum + s.rpe * s.duration_minutes, 0) / 7

  const chronic = sessions
    .filter((s) => (now.getTime() - new Date(s.date).getTime()) / 86400000 <= 28)
    .reduce((sum, s) => sum + s.rpe * s.duration_minutes, 0) / 28

  return chronic === 0 ? 1.0 : Math.round((acute / chronic) * 100) / 100
}
