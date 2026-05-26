import type { MuscleGroup } from "./types"

// ─── Exercise to muscle group mapping ────────────────────────────────────────

export const EXERCISE_MUSCLE_MAP: Record<string, MuscleGroup[]> = {
  // Chest
  "bench press": ["chest", "shoulders", "triceps"],
  "incline bench press": ["chest", "shoulders", "triceps"],
  "incline dumbbell press": ["chest", "shoulders", "triceps"],
  "incline db press": ["chest", "shoulders", "triceps"],
  "incline press": ["chest", "shoulders", "triceps"],
  "decline bench": ["chest", "shoulders", "triceps"],
  "dumbbell press": ["chest", "shoulders", "triceps"],
  "flat press": ["chest", "shoulders", "triceps"],
  "bench": ["chest", "shoulders", "triceps"],
  "cable fly": ["chest"],
  "chest fly": ["chest"],
  "db fly": ["chest"],
  "pec fly": ["chest"],
  "pec deck": ["chest"],
  "machine fly": ["chest"],
  "incline fly": ["chest"],
  "cable crossover": ["chest"],
  "push-up": ["chest", "shoulders", "triceps"],
  "pushup": ["chest", "shoulders", "triceps"],
  "push up": ["chest", "shoulders", "triceps"],
  "dips": ["chest", "triceps"],
  "dip": ["chest", "triceps"],

  // Back
  "pull-up": ["back", "biceps"],
  "pullup": ["back", "biceps"],
  "pull up": ["back", "biceps"],
  "chin-up": ["back", "biceps"],
  "chinup": ["back", "biceps"],
  "chin up": ["back", "biceps"],
  "weighted pull": ["back", "biceps"],
  "lat pulldown": ["back", "biceps"],
  "lat pull down": ["back", "biceps"],
  "cable row": ["back", "biceps"],
  "seated row": ["back", "biceps"],
  "barbell row": ["back", "biceps"],
  "bb row": ["back", "biceps"],
  "db row": ["back", "biceps"],
  "dumbbell row": ["back", "biceps"],
  "t-bar row": ["back", "biceps"],
  "pendlay row": ["back", "biceps"],
  "meadows row": ["back", "biceps"],
  "seal row": ["back", "biceps"],
  "cable pullover": ["back"],
  "straight arm pulldown": ["back"],
  "db pullover": ["back", "chest"],
  "face pull": ["back", "shoulders"],
  "deadlift": ["back", "hamstrings", "glutes", "core"],
  "trap bar deadlift": ["back", "hamstrings", "glutes", "core"],
  "hex bar deadlift": ["back", "hamstrings", "glutes", "core"],
  "farmers carry": ["back", "core"],
  "farmers walk": ["back", "core"],
  "suitcase carry": ["core"],

  // Shoulders
  "overhead press": ["shoulders", "triceps"],
  "ohp": ["shoulders", "triceps"],
  "military press": ["shoulders", "triceps"],
  "db ohp": ["shoulders", "triceps"],
  "dumbbell ohp": ["shoulders", "triceps"],
  "seated press": ["shoulders", "triceps"],
  "seated dumbbell press": ["shoulders", "triceps"],
  "seated db press": ["shoulders", "triceps"],
  "arnold press": ["shoulders", "triceps"],
  "lateral raise": ["shoulders"],
  "side lateral": ["shoulders"],
  "side raise": ["shoulders"],
  "db lateral": ["shoulders"],
  "cable lateral": ["shoulders"],
  "upright row": ["shoulders", "back"],
  "rear delt fly": ["shoulders", "back"],
  "rear delt row": ["shoulders", "back"],
  "rear delt": ["shoulders", "back"],
  "rear fly": ["shoulders", "back"],
  "reverse fly": ["shoulders", "back"],
  "reverse pec deck": ["shoulders", "back"],

  // Arms - Biceps
  "curl": ["biceps"],
  "bicep curl": ["biceps"],
  "barbell curl": ["biceps"],
  "bb curl": ["biceps"],
  "hammer curl": ["biceps"],
  "preacher curl": ["biceps"],
  "ez bar curl": ["biceps"],
  "incline curl": ["biceps"],
  "concentration curl": ["biceps"],
  "cable curl": ["biceps"],
  "spider curl": ["biceps"],
  "drag curl": ["biceps"],

  // Arms - Triceps
  "tricep pushdown": ["triceps"],
  "tricep extension": ["triceps"],
  "triceps pushdown": ["triceps"],
  "triceps extension": ["triceps"],
  "skull crusher": ["triceps"],
  "skullcrusher": ["triceps"],
  "close grip bench": ["triceps", "chest"],
  "overhead extension": ["triceps"],
  "overhead tricep": ["triceps"],
  "cable overhead": ["triceps"],
  "lying extension": ["triceps"],
  "jm press": ["triceps"],
  "rope pushdown": ["triceps"],
  "tri pushdown": ["triceps"],

  // Quads / Legs
  "squat": ["quads", "glutes", "hamstrings"],
  "barbell squat": ["quads", "glutes", "hamstrings"],
  "front squat": ["quads", "glutes"],
  "goblet squat": ["quads", "glutes"],
  "leg press": ["quads", "glutes"],
  "hack squat": ["quads", "glutes"],
  "leg extension": ["quads"],
  "leg ext": ["quads"],
  "sissy squat": ["quads"],
  "box squat": ["quads", "glutes"],
  "zercher squat": ["quads", "glutes"],
  "lunge": ["quads", "glutes", "hamstrings"],
  "walking lunge": ["quads", "glutes", "hamstrings"],
  "reverse lunge": ["quads", "glutes", "hamstrings"],
  "split squat": ["quads", "glutes", "hamstrings"],
  "bulgarian split squat": ["quads", "glutes", "hamstrings"],
  "bss": ["quads", "glutes", "hamstrings"],
  "step up": ["quads", "glutes"],
  "single leg press": ["quads", "glutes"],

  // Hamstrings / Glutes
  "romanian deadlift": ["hamstrings", "glutes", "back"],
  "rdl": ["hamstrings", "glutes", "back"],
  "single leg rdl": ["hamstrings", "glutes"],
  "stiff leg deadlift": ["hamstrings", "glutes", "back"],
  "sldl": ["hamstrings", "glutes", "back"],
  "sumo deadlift": ["hamstrings", "glutes", "back"],
  "hamstring curl": ["hamstrings"],
  "leg curl": ["hamstrings"],
  "nordic curl": ["hamstrings"],
  "glute ham raise": ["hamstrings", "glutes"],
  "ghr": ["hamstrings", "glutes"],
  "good morning": ["hamstrings", "back"],
  "hip thrust": ["glutes", "hamstrings"],
  "barbell hip thrust": ["glutes", "hamstrings"],
  "glute bridge": ["glutes"],
  "donkey kick": ["glutes"],
  "cable kickback": ["glutes"],
  "abductor": ["glutes"],
  "hip abduction": ["glutes"],

  // Calves
  "calf raise": ["calves"],
  "standing calf raise": ["calves"],
  "seated calf raise": ["calves"],
  "calf press": ["calves"],

  // Core
  "plank": ["core"],
  "ab wheel": ["core"],
  "abs wheel": ["core"],
  "crunch": ["core"],
  "ab crunch": ["core"],
  "cable crunch": ["core"],
  "decline crunch": ["core"],
  "hanging leg raise": ["core"],
  "leg raise": ["core"],
  "sit up": ["core"],
  "situp": ["core"],
  "russian twist": ["core"],
  "pallof press": ["core"],
  "dead bug": ["core"],
  "hollow body": ["core"],
  "hollow hold": ["core"],
  "copenhagen plank": ["core", "glutes"],
  "ab rollout": ["core"],
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
