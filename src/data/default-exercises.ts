export interface ExerciseTemplate {
  name: string
  category: "compound" | "isolation" | "cardio" | "mobility"
  primary_muscles: string[]
}

export const DEFAULT_EXERCISES: ExerciseTemplate[] = [
  { name: "Barbell Squat", category: "compound", primary_muscles: ["quads", "glutes", "hamstrings"] },
  { name: "Romanian Deadlift", category: "compound", primary_muscles: ["hamstrings", "glutes"] },
  { name: "Deadlift", category: "compound", primary_muscles: ["back", "hamstrings", "glutes"] },
  { name: "Bench Press", category: "compound", primary_muscles: ["chest", "shoulders", "triceps"] },
  { name: "Incline Dumbbell Press", category: "compound", primary_muscles: ["chest", "shoulders"] },
  { name: "Overhead Press", category: "compound", primary_muscles: ["shoulders", "triceps"] },
  { name: "Pull-Up", category: "compound", primary_muscles: ["back", "biceps"] },
  { name: "Lat Pulldown", category: "compound", primary_muscles: ["back", "biceps"] },
  { name: "Cable Row", category: "compound", primary_muscles: ["back", "biceps"] },
  { name: "Lateral Raise", category: "isolation", primary_muscles: ["shoulders"] },
  { name: "Rear Delt Fly", category: "isolation", primary_muscles: ["shoulders", "back"] },
  { name: "Bicep Curl", category: "isolation", primary_muscles: ["biceps"] },
  { name: "Tricep Pushdown", category: "isolation", primary_muscles: ["triceps"] },
  { name: "Leg Press", category: "compound", primary_muscles: ["quads", "glutes"] },
  { name: "Hamstring Curl", category: "isolation", primary_muscles: ["hamstrings"] },
  { name: "Calf Raise", category: "isolation", primary_muscles: ["calves"] },
  { name: "Plank", category: "mobility", primary_muscles: ["core"] },
  { name: "Bulgarian Split Squat", category: "compound", primary_muscles: ["quads", "glutes"] },
  { name: "Hip Thrust", category: "compound", primary_muscles: ["glutes", "hamstrings"] },
  { name: "Face Pull", category: "isolation", primary_muscles: ["shoulders", "back"] },
]

export const EXERCISE_NAMES = DEFAULT_EXERCISES.map((e) => e.name)
