import type { TrainingSession, MuscleGroup } from "./types"
import { inferMuscleGroupsFromText, findMissingMuscleGroups, getMuscleGroupLabel } from "./exercise-map"

// ─── Weekly set targets per muscle group ─────────────────────────────────────
// Based on typical evidence-informed recommendations for natural trainees.

export const WEEKLY_SET_TARGETS: Record<MuscleGroup, { min: number; max: number }> = {
  chest:      { min: 8,  max: 20 },
  back:       { min: 8,  max: 20 },
  shoulders:  { min: 6,  max: 16 },
  biceps:     { min: 6,  max: 14 },
  triceps:    { min: 6,  max: 14 },
  core:       { min: 4,  max: 12 },
  quads:      { min: 8,  max: 20 },
  hamstrings: { min: 6,  max: 16 },
  glutes:     { min: 6,  max: 20 },
  calves:     { min: 4,  max: 16 },
  full_body:  { min: 0,  max: 999 },
}

// ─── Core load helpers ────────────────────────────────────────────────────────

export function getSessionLoad(session: TrainingSession): number {
  return session.rpe * session.duration_minutes
}

export function calculateTrainingLoad(sessions: TrainingSession[]): {
  acute: number
  chronic: number
  acwr: number
} {
  const now = new Date()

  const acute = sessions
    .filter((s) => (now.getTime() - new Date(s.date).getTime()) / 86400000 <= 7)
    .reduce((sum, s) => sum + getSessionLoad(s), 0) / 7

  const chronic = sessions
    .filter((s) => (now.getTime() - new Date(s.date).getTime()) / 86400000 <= 28)
    .reduce((sum, s) => sum + getSessionLoad(s), 0) / 28

  const acwr = chronic === 0 ? 1.0 : acute / chronic

  return {
    acute: Math.round(acute * 10) / 10,
    chronic: Math.round(chronic * 10) / 10,
    acwr: Math.round(acwr * 100) / 100,
  }
}

export function getRecentSessions(sessions: TrainingSession[], days = 14): TrainingSession[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().split("T")[0]
  return sessions
    .filter((s) => s.date >= cutoffStr)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getAllMuscleGroupsTrained(sessions: TrainingSession[], days = 7): MuscleGroup[] {
  const recent = getRecentSessions(sessions, days)
  const all = new Set<MuscleGroup>()
  for (const session of recent) {
    session.muscle_groups.forEach((m) => all.add(m))
    if (session.exercises_freeform) {
      inferMuscleGroupsFromText(session.exercises_freeform).forEach((m) => all.add(m))
    }
  }
  return Array.from(all)
}

export function getDaysSinceLastSession(sessions: TrainingSession[]): number {
  if (sessions.length === 0) return 999
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date))
  const diff = (new Date().getTime() - new Date(sorted[0].date).getTime()) / 86400000
  return Math.floor(diff)
}

export function getWeeklySessionCount(sessions: TrainingSession[]): number {
  return getRecentSessions(sessions, 7).length
}

// ─── Set-count based coverage ─────────────────────────────────────────────────

export function calculateWeeklySetsByMuscleGroup(
  sessions: TrainingSession[],
): Record<MuscleGroup, number> {
  const counts: Record<string, number> = {}
  const recent = getRecentSessions(sessions, 7)

  for (const session of recent) {
    if (session.parsed_exercises && session.parsed_exercises.length > 0) {
      for (const ex of session.parsed_exercises) {
        const sets = ex.sets ?? 1
        for (const group of ex.muscleGroups) {
          counts[group] = (counts[group] ?? 0) + sets
        }
      }
    } else {
      // Fall back to session-level muscle groups: credit 3 sets each as a rough estimate
      const groups = [
        ...session.muscle_groups,
        ...(session.exercises_freeform ? inferMuscleGroupsFromText(session.exercises_freeform) : []),
      ]
      const unique = [...new Set(groups)]
      unique.forEach((g) => {
        counts[g] = (counts[g] ?? 0) + 3
      })
    }
  }

  return counts as Record<MuscleGroup, number>
}

// Legacy session-count based coverage (kept for compatibility)
export function calculateWeeklyMuscleCoverage(sessions: TrainingSession[]): Record<MuscleGroup, number> {
  const counts: Record<string, number> = {}
  const recent = getRecentSessions(sessions, 7)

  for (const session of recent) {
    const groups = [
      ...session.muscle_groups,
      ...(session.exercises_freeform ? inferMuscleGroupsFromText(session.exercises_freeform) : []),
    ]
    const unique = [...new Set(groups)]
    unique.forEach((g) => {
      counts[g] = (counts[g] ?? 0) + 1
    })
  }

  return counts as Record<MuscleGroup, number>
}

// ─── Coverage score ───────────────────────────────────────────────────────────
// 0-100 based on how many muscle groups meet their minimum weekly set target.
// full_body sessions are excluded from the denominator.

export function calculateMuscleCoverageScore(
  sets: Partial<Record<MuscleGroup, number>>,
): number {
  const scorable = Object.keys(WEEKLY_SET_TARGETS).filter(
    (g) => g !== "full_body",
  ) as MuscleGroup[]

  const total = scorable.reduce((acc, group) => {
    const actual = sets[group] ?? 0
    const target = WEEKLY_SET_TARGETS[group].min
    return acc + Math.min(actual / target, 1)
  }, 0)

  return Math.round((total / scorable.length) * 100)
}

// ─── Gap analysis ─────────────────────────────────────────────────────────────

export interface MuscleGroupGap {
  group: MuscleGroup
  label: string
  actualSets: number
  targetMin: number
  targetMax: number
  deficit: number
  suggestion: string
}

const GROUP_SUGGESTIONS: Record<MuscleGroup, string> = {
  chest: "Add incline DB press or cable fly",
  back: "Add lat pulldown or cable row",
  shoulders: "Add lateral raises or face pulls",
  biceps: "Add EZ bar curls or hammer curls",
  triceps: "Add tricep pushdowns or overhead extension",
  core: "Add planks or ab wheel",
  quads: "Add leg press or goblet squat",
  hamstrings: "Add RDLs or leg curl",
  glutes: "Add hip thrusts or glute bridge",
  calves: "Add standing calf raises",
  full_body: "",
}

export function findMissingThisWeek(sessions: TrainingSession[]): MuscleGroup[] {
  const trained = getAllMuscleGroupsTrained(sessions, 7)
  return findMissingMuscleGroups(trained)
}

export function getMuscleGroupGaps(
  sets: Partial<Record<MuscleGroup, number>>,
): MuscleGroupGap[] {
  return (Object.keys(WEEKLY_SET_TARGETS) as MuscleGroup[])
    .filter((g) => g !== "full_body")
    .map((group) => {
      const actual = sets[group] ?? 0
      const { min, max } = WEEKLY_SET_TARGETS[group]
      const deficit = Math.max(0, min - actual)
      return {
        group,
        label: getMuscleGroupLabel(group),
        actualSets: actual,
        targetMin: min,
        targetMax: max,
        deficit,
        suggestion: GROUP_SUGGESTIONS[group],
      }
    })
    .filter((g) => g.deficit > 0)
    .sort((a, b) => b.deficit - a.deficit)
}

export function findOverrepresentedMuscleGroups(
  sets: Partial<Record<MuscleGroup, number>>,
): MuscleGroup[] {
  return (Object.keys(WEEKLY_SET_TARGETS) as MuscleGroup[])
    .filter((g) => g !== "full_body" && (sets[g] ?? 0) > WEEKLY_SET_TARGETS[g].max)
}

// ─── Conflict detection ───────────────────────────────────────────────────────
// Flags muscle groups that were trained hard in the last 24h or 48h so the
// user can avoid scheduling the same group back-to-back.

export interface TrainingConflict {
  group: MuscleGroup
  label: string
  hoursAgo: number
  sessionDate: string
}

export function getTrainingConflictsForToday(
  sessions: TrainingSession[],
  todayISO?: string,
): TrainingConflict[] {
  const today = todayISO ?? new Date().toISOString().split("T")[0]
  const todayTime = new Date(today).getTime()
  const cutoff = todayTime - 48 * 3600 * 1000

  const conflicts: TrainingConflict[] = []

  for (const session of sessions) {
    const sessionTime = new Date(session.date).getTime()
    if (sessionTime >= cutoff && session.date !== today) {
      const hoursAgo = Math.round((todayTime - sessionTime) / 3600000)
      const groups = [
        ...session.muscle_groups,
        ...(session.exercises_freeform ? inferMuscleGroupsFromText(session.exercises_freeform) : []),
        ...(session.parsed_exercises?.flatMap((e) => e.muscleGroups) ?? []),
      ]
      const unique = [...new Set(groups)] as MuscleGroup[]
      for (const group of unique) {
        if (!conflicts.some((c) => c.group === group)) {
          conflicts.push({
            group,
            label: getMuscleGroupLabel(group),
            hoursAgo,
            sessionDate: session.date,
          })
        }
      }
    }
  }

  return conflicts
}
