import type { MuscleGroup } from "./types"
import { EXERCISE_MUSCLE_MAP } from "./exercise-map"

export interface ParsedExercise {
  raw: string
  exerciseName: string
  weightKg?: number
  sets?: number
  reps?: number
  rpe?: number
  muscleGroups: MuscleGroup[]
  confidence: "low" | "medium" | "high"
}

// Parse a single line like "Bench press 4x8@80kg" or "Squat 5x5 100kg @RPE8"
export function parseExerciseLine(line: string): ParsedExercise {
  const raw = line.trim()
  if (!raw) return { raw, exerciseName: "", muscleGroups: [], confidence: "low" }

  let working = raw.toLowerCase()

  // Weight: @80kg, @80, 80kg, x80 (but not the sets×reps x)
  let weightKg: number | undefined
  const weightMatch = working.match(/@(\d+(?:\.\d+)?)\s*kg?(?!\d)|(\d+(?:\.\d+)?)\s*kg/)
  if (weightMatch) {
    weightKg = parseFloat(weightMatch[1] ?? weightMatch[2])
    working = working.replace(weightMatch[0], " ")
  }

  // RPE: @rpe8, rpe8, @rpe 8, rpe 8.5
  let rpe: number | undefined
  const rpeMatch = working.match(/@?\brpe\s*(\d+(?:\.\d+)?)/)
  if (rpeMatch) {
    rpe = parseFloat(rpeMatch[1])
    working = working.replace(rpeMatch[0], " ")
  }

  // Sets x reps: 4x8, 4x8-10, 4×8, 4 x 8
  let sets: number | undefined
  let reps: number | undefined
  const sxr = working.match(/(\d+)\s*[x×]\s*(\d+)(?:-\d+)?/)
  if (sxr) {
    sets = parseInt(sxr[1])
    reps = parseInt(sxr[2])
    working = working.replace(sxr[0], " ")
  } else {
    const sOnly = working.match(/(\d+)\s*sets?/)
    if (sOnly) {
      sets = parseInt(sOnly[1])
      working = working.replace(sOnly[0], " ")
    }
  }

  // Clean up what remains to get the exercise name
  const exerciseName = working
    .replace(/[^a-z\s\-']/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  const muscleGroups = inferFromName(exerciseName)

  const confidence: ParsedExercise["confidence"] =
    muscleGroups.length > 0 && (sets !== undefined || reps !== undefined)
      ? "high"
      : muscleGroups.length > 0
      ? "medium"
      : "low"

  return { raw, exerciseName, weightKg, sets, reps, rpe, muscleGroups, confidence }
}

function inferFromName(name: string): MuscleGroup[] {
  if (!name) return []

  const found = new Set<MuscleGroup>()
  let bestLen = 0

  // Prefer the longest matching keyword (more specific)
  for (const [keyword, muscles] of Object.entries(EXERCISE_MUSCLE_MAP)) {
    if (name.includes(keyword)) {
      if (keyword.length > bestLen) {
        found.clear()
        bestLen = keyword.length
      }
      if (keyword.length === bestLen) {
        muscles.forEach((m) => found.add(m))
      }
    }
  }

  // Fallback: partial word match for 4+ char words
  if (found.size === 0) {
    const words = name.split(/\s+/).filter((w) => w.length >= 4)
    for (const [keyword, muscles] of Object.entries(EXERCISE_MUSCLE_MAP)) {
      if (words.some((w) => keyword.includes(w))) {
        muscles.forEach((m) => found.add(m))
      }
    }
  }

  return Array.from(found)
}

export function parseExerciseText(text: string): ParsedExercise[] {
  if (!text) return []
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map(parseExerciseLine)
}
