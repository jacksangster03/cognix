import { MODE_CONFIG } from "./constants"
import { determineMode } from "./scoring"
import type {
  ReadinessScores,
  DailyCheckIn,
  MockWhoopDay,
  TrainingSession,
  UserSettings,
  DailyRecommendation,
  Mode,
} from "./types"

// ─── Deterministic recommendation engine (no LLM) ────────────────────────────

function trainingRec(mode: Mode, sessions: TrainingSession[], checkin: DailyCheckIn | null): string {
  const recentTypes = sessions.slice(-3).map((s) => s.session_type)
  const hasRecentLegs = sessions
    .slice(-2)
    .some((s) => s.muscle_groups.includes("quads") || s.muscle_groups.includes("hamstrings"))
  const hasRecentPush = sessions
    .slice(-2)
    .some((s) => s.muscle_groups.includes("chest") || s.muscle_groups.includes("shoulders"))

  switch (mode) {
    case "Push":
      if (hasRecentLegs && hasRecentPush)
        return "Full intensity session. Pull pattern (back/biceps) is the most underworked group based on recent history."
      if (hasRecentLegs)
        return "Full intensity push session recommended. Chest, shoulders, and triceps are the priority."
      return "Full intensity session. No muscle group restrictions based on recent training."

    case "Normal":
      return "Planned session at normal intensity. Keep RPE around 7. Avoid chasing PRs unless energy is high mid-session."

    case "Moderate":
      return "Reduce session volume by one set per exercise. Keep weight the same but drop RPE target to 6. If pain worsens during warm-up, stop."

    case "Deload":
      if (recentTypes.every((t) => t === "Strength"))
        return "Zone 2 cardio (30-40 min walk, cycle) or mobility work only. No barbell work today."
      return "Light movement: walk, stretch, or yoga. Nothing above RPE 5."

    case "Rest":
      return "No structured training. A 20-30 minute walk is fine if you feel up to it. Prioritise sleep and food today."
  }
}

function nutritionRec(scores: ReadinessScores, checkin: DailyCheckIn | null, mode: Mode, proteinTarget: number): string {
  const proteinGap = checkin?.protein === "Low" ? `Prioritise hitting ${proteinTarget}g protein today.` : ""
  const recoveryContext = mode === "Push" || mode === "Normal"
    ? "Carbohydrate intake supports today's training. Do not undereat on a Push day."
    : "Recovery nutrition: keep protein high even on rest days. Muscle repair does not stop."

  if (!checkin) return `Log today's nutrition to get a personalised recommendation. Target: ${proteinTarget}g protein.`

  const statements: string[] = []
  if (proteinGap) statements.push(proteinGap)
  if (checkin.protein === "Low") statements.push("Low protein yesterday likely slowed overnight recovery.")
  if (checkin.calories === "Under" && (mode === "Push" || mode === "Normal")) {
    statements.push("You are in a caloric deficit on a training day. Consider adding a meal or snack before training.")
  }
  statements.push(recoveryContext)
  return statements.join(" ")
}

function hydrationRec(scores: ReadinessScores, checkin: DailyCheckIn | null, waterTarget: number): string {
  if (!checkin) return `Aim for ${waterTarget}L of water today. Log hydration to track compliance.`
  if (checkin.hydration === "Low") return `You logged low hydration. Start with 500ml now and aim for ${waterTarget}L before 19:00.`
  if (checkin.hydration === "Okay") return `Hydration is acceptable. Push towards ${waterTarget}L, especially if training today.`
  return `Good hydration logged. Maintain ${waterTarget}L and add 0.5L on training days.`
}

function caffeineRec(scores: ReadinessScores, checkin: DailyCheckIn | null, cutoffHour: number): string {
  if (!checkin || checkin.caffeine_amount === "None") {
    return `No caffeine logged. If using today, stop by ${cutoffHour}:00 to protect sleep quality.`
  }

  const late = checkin.last_caffeine_time === "After 16" || checkin.last_caffeine_time === "14 to 16"
  if (late && checkin.caffeine_amount !== "Low") {
    return `Late caffeine detected (half-life ~5.5h). Significant concentration likely present at sleep time. Consider melatonin-free sleep aids tonight and shifting intake earlier tomorrow.`
  }
  if (checkin.caffeine_amount === "High") {
    return `High caffeine intake logged. Watch for rebound fatigue in the afternoon. Ensure next intake is before ${cutoffHour}:00.`
  }
  return `Caffeine timing looks acceptable. Keep intake before ${cutoffHour}:00 for optimal sleep.`
}

function supplementRec(checkin: DailyCheckIn | null): string {
  if (!checkin) return "Log supplements to track compliance and get timing reminders."
  const taken = checkin.supplements_taken
  const suggestions: string[] = []

  if (!taken.includes("Creatine")) suggestions.push("Creatine not logged — take any time, compliance is what matters.")
  if (!taken.includes("Vitamin D3")) suggestions.push("Vitamin D3 not logged — take with your largest meal.")
  if (!taken.includes("Omega-3")) suggestions.push("Omega-3 not logged.")
  if (!taken.includes("Magnesium")) suggestions.push("Consider magnesium glycinate 30-60 min before bed.")

  if (suggestions.length === 0) return "Core supplements logged. Good compliance today."
  return suggestions.slice(0, 2).join(" ")
}

function sleepRec(scores: ReadinessScores, checkin: DailyCheckIn | null, caffeineScore: number): string {
  const statements: string[] = []

  if (caffeineScore < 50) {
    statements.push("Late caffeine will compress sleep quality tonight. Dim screens from 21:00 and avoid bright light.")
  }
  if (checkin?.stress && checkin.stress >= 4) {
    statements.push("High stress logged. Wind-down routine is especially important: no news, no emails after 21:00.")
  }
  if (scores.sleep < 60) {
    statements.push("Sleep quality was poor last night. Prioritise an earlier bedtime today, even by 30 minutes.")
  }
  if (statements.length === 0) {
    statements.push("Sleep looked reasonable. Maintain consistent sleep and wake times.")
  }
  return statements.join(" ")
}

function mainRisk(scores: ReadinessScores, checkin: DailyCheckIn | null, mode: Mode): string {
  if (checkin?.pain_score && checkin.pain_score >= 7) return "Significant pain reported. Training risk is high."
  if (mode === "Rest") return "Low readiness: training today risks compounding recovery debt."
  if (mode === "Deload") return "Accumulated fatigue. Pushing hard will extend the recovery hole."
  if (scores.caffeine < 40) return "Late caffeine may disrupt tonight's sleep, compounding the current readiness dip."
  if (scores.hydration < 40) return "Low hydration degrades both cognitive and physical performance."
  if (scores.nutrition < 40) return "Low protein intake slows muscle protein synthesis and recovery."
  if (scores.training_load < 30) return "Very high training load (ACWR > 1.5). Injury risk elevated."
  return "No critical flags today."
}

function onePriority(scores: ReadinessScores, checkin: DailyCheckIn | null, mode: Mode, proteinTarget: number): string {
  if (checkin?.pain_score && checkin.pain_score >= 7) return "Rest and consult a physio if pain persists more than 48h."
  if (mode === "Push") return "Hit the gym and push progressive overload on at least one lift."
  if (scores.caffeine < 40) return `Set a caffeine cutoff reminder for ${new Date().getHours() < 12 ? "14:00" : "tomorrow morning"}.`
  if (scores.hydration < 40) return "Drink 500ml of water in the next 30 minutes and log it."
  if (checkin?.protein === "Low") return `Get ${proteinTarget}g of protein today — front-load it at breakfast and lunch.`
  if (scores.sleep < 50) return "Prioritise an early bedtime: in bed by 22:00 tonight."
  return "Log today's check-in and training to improve recommendation accuracy tomorrow."
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function buildDailyRecommendation(
  scores: ReadinessScores,
  checkin: DailyCheckIn | null,
  whoop: MockWhoopDay | null,
  sessions: TrainingSession[],
  settings: UserSettings,
): DailyRecommendation {
  const mode = determineMode(scores, checkin)

  const reasons: string[] = []
  if (scores.recovery < 40) reasons.push(`Low WHOOP recovery score (${scores.recovery}/100)`)
  if (scores.sleep < 50) reasons.push(`Poor sleep performance`)
  if (checkin?.soreness && checkin.soreness >= 4) reasons.push(`High soreness (${checkin.soreness}/5)`)
  if (checkin?.stress && checkin.stress >= 4) reasons.push(`Elevated stress (${checkin.stress}/5)`)
  if (scores.caffeine < 50) reasons.push(`Late or high caffeine logged`)
  if (scores.nutrition < 40) reasons.push(`Low protein intake`)
  if (scores.hydration < 40) reasons.push(`Low hydration`)
  if (scores.training_load < 35) reasons.push(`High acute training load (ACWR elevated)`)
  if (checkin?.pain_score && checkin.pain_score >= 5) reasons.push(`Pain reported (${checkin.pain_score}/10)`)

  const modeConf = MODE_CONFIG[mode]
  const headline = reasons.length === 0
    ? `${mode} day. ${modeConf.description}`
    : `${mode} day: ${reasons[0].toLowerCase()}.`

  return {
    mode,
    headline,
    training: trainingRec(mode, sessions, checkin),
    nutrition: nutritionRec(scores, checkin, mode, settings.protein_target_g),
    hydration: hydrationRec(scores, checkin, settings.water_target_litres),
    caffeine: caffeineRec(scores, checkin, settings.caffeine_cutoff_hour),
    supplements: supplementRec(checkin),
    sleep: sleepRec(scores, checkin, scores.caffeine),
    main_risk: mainRisk(scores, checkin, mode),
    one_priority: onePriority(scores, checkin, mode, settings.protein_target_g),
    reasons,
  }
}
