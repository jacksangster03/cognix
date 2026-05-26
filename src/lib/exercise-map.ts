import type { MuscleGroup } from "./types"

// ─── Exercise to muscle group mapping ────────────────────────────────────────

export const EXERCISE_MUSCLE_MAP: Record<string, MuscleGroup[]> = {
  // Chest
  "bench press": ["chest", "shoulders", "triceps"],
  "incline bench press": ["chest", "shoulders", "triceps"],
  "incline dumbbell press": ["chest", "shoulders", "triceps"],
  "dumbbell press": ["chest", "shoulders", "triceps"],
  "cable fly": ["chest"],
  "chest fly": ["chest"],
  "push-up": ["chest", "shoulders", "triceps"],
  "pushup": ["chest", "shoulders", "triceps"],
  "dips": ["chest", "triceps"],

  // Back
  "pull-up": ["back", "biceps"],
  "pullup": ["back", "biceps"],
  "chin-up": ["back", "biceps"],
  "chinup": ["back", "biceps"],
  "lat pulldown": ["back", "biceps"],
  "cable row": ["back", "biceps"],
  "seated row": ["back", "biceps"],
  "barbell row": ["back", "biceps"],
  "db row": ["back", "biceps"],
  "dumbbell row": ["back", "biceps"],
  "t-bar row": ["back", "biceps"],
  "face pull": ["back", "shoulders"],
  "deadlift": ["back", "hamstrings", "glutes", "core"],
  "trap bar deadlift": ["back", "hamstrings", "glutes", "core"],

  // Shoulders
  "overhead press": ["shoulders", "triceps"],
  "ohp": ["shoulders", "triceps"],
  "military press": ["shoulders", "triceps"],
  "lateral raise": ["shoulders"],
  "rear delt fly": ["shoulders", "back"],
  "rear delt row": ["shoulders", "back"],
  "arnold press": ["shoulders", "triceps"],

  // Arms
  "curl": ["biceps"],
  "bicep curl": ["biceps"],
  "barbell curl": ["biceps"],
  "hammer curl": ["biceps"],
  "preacher curl": ["biceps"],
  "tricep pushdown": ["triceps"],
  "tricep extension": ["triceps"],
  "skull crusher": ["triceps"],
  "close grip bench": ["triceps", "chest"],

  // Quads / Legs
  "squat": ["quads", "glutes", "hamstrings"],
  "barbell squat": ["quads", "glutes", "hamstrings"],
  "front squat": ["quads", "glutes"],
  "goblet squat": ["quads", "glutes"],
  "leg press": ["quads", "glutes"],
  "hack squat": ["quads", "glutes"],
  "lunge": ["quads", "glutes", "hamstrings"],
  "bulgarian split squat": ["quads", "glutes", "hamstrings"],
  "step up": ["quads", "glutes"],

  // Hamstrings / Glutes
  "romanian deadlift": ["hamstrings", "glutes", "back"],
  "rdl": ["hamstrings", "glutes", "back"],
  "hamstring curl": ["hamstrings"],
  "leg curl": ["hamstrings"],
  "good morning": ["hamstrings", "back"],
  "hip thrust": ["glutes", "hamstrings"],
  "glute bridge": ["glutes"],

  // Calves / Core
  "calf raise": ["calves"],
  "standing calf raise": ["calves"],
  "seated calf raise": ["calves"],
  "plank": ["core"],
  "ab wheel": ["core"],
  "crunch": ["core"],
  "cable crunch": ["core"],
  "hanging leg raise": ["core"],
  "russian twist": ["core"],
  "pallof press": ["core"],
}

const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  "chest", "back", "shoulders", "biceps", "triceps",
  "core", "quads", "hamstrings", "glutes", "calves",
]

// ─── Keyword-based inference from freeform text ───────────────────────────────

export function inferMuscleGroupsFromText(text: string): MuscleGroup[] {
  if (!text) return []
  const lower = text.toLowerCase()
  const found = new Set<MuscleGroup>()

  for (const [keyword, muscles] of Object.entries(EXERCISE_MUSCLE_MAP)) {
    if (lower.includes(keyword)) {
      muscles.forEach((m) => found.add(m))
    }
  }

  return Array.from(found)
}

// ─── Coverage analysis ────────────────────────────────────────────────────────

export function findMissingMuscleGroups(trained: MuscleGroup[]): MuscleGroup[] {
  const trainedSet = new Set(trained)
  return ALL_MUSCLE_GROUPS.filter((m) => !trainedSet.has(m) && m !== "full_body")
}

export function getMuscleGroupLabel(group: MuscleGroup): string {
  const labels: Record<MuscleGroup, string> = {
    chest: "Chest",
    back: "Back",
    shoulders: "Shoulders",
    biceps: "Biceps",
    triceps: "Triceps",
    core: "Core",
    quads: "Quads",
    hamstrings: "Hamstrings",
    glutes: "Glutes",
    calves: "Calves",
    full_body: "Full Body",
  }
  return labels[group] ?? group
}
