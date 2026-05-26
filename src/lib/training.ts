import type { TrainingSession, MuscleGroup } from "./types"
import { inferMuscleGroupsFromText, findMissingMuscleGroups } from "./exercise-map"

// ─── Training intelligence ────────────────────────────────────────────────────

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

export function findMissingThisWeek(sessions: TrainingSession[]): MuscleGroup[] {
  const trained = getAllMuscleGroupsTrained(sessions, 7)
  return findMissingMuscleGroups(trained)
}

export function getDaysSinceLastSession(sessions: TrainingSession[]): number {
  if (sessions.length === 0) return 999
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date))
  const last = sorted[0].date
  const diff = (new Date().getTime() - new Date(last).getTime()) / 86400000
  return Math.floor(diff)
}

export function getWeeklySessionCount(sessions: TrainingSession[]): number {
  return getRecentSessions(sessions, 7).length
}
