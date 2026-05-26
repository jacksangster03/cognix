import type { DailyCheckIn, TrainingSession } from "./types"

// ─── 14 days of mock check-in history ────────────────────────────────────────
// Used when demo mode is on to populate progress and trend views.

function isoDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split("T")[0]
}

export const MOCK_CHECKIN_HISTORY: DailyCheckIn[] = [
  {
    id: "mock-1", date: isoDate(13), created_at: isoDate(13) + "T08:00:00Z",
    sleep_quality: 4, mood: 4, energy: 4, stress: 2, soreness: 2,
    pain_score: 0, protein: "Good", calories: "About right", hydration: "Good",
    caffeine_amount: "Moderate", last_caffeine_time: "Before 12",
    supplements_taken: ["Creatine", "Omega-3", "Vitamin D3"], planned_workout: "Push A",
  },
  {
    id: "mock-2", date: isoDate(12), created_at: isoDate(12) + "T08:00:00Z",
    sleep_quality: 3, mood: 3, energy: 3, stress: 3, soreness: 3,
    pain_score: 1, protein: "Okay", calories: "About right", hydration: "Okay",
    caffeine_amount: "Moderate", last_caffeine_time: "12 to 14",
    supplements_taken: ["Creatine", "Vitamin D3"], planned_workout: "Rest",
  },
  {
    id: "mock-3", date: isoDate(11), created_at: isoDate(11) + "T08:00:00Z",
    sleep_quality: 4, mood: 4, energy: 4, stress: 2, soreness: 2,
    pain_score: 0, protein: "Good", calories: "About right", hydration: "Good",
    caffeine_amount: "Low", last_caffeine_time: "Before 12",
    supplements_taken: ["Creatine", "Omega-3", "Vitamin D3", "Magnesium"], planned_workout: "Pull A",
  },
  {
    id: "mock-4", date: isoDate(10), created_at: isoDate(10) + "T08:00:00Z",
    sleep_quality: 5, mood: 5, energy: 5, stress: 1, soreness: 1,
    pain_score: 0, protein: "High", calories: "About right", hydration: "Good",
    caffeine_amount: "Moderate", last_caffeine_time: "Before 12",
    supplements_taken: ["Creatine", "Omega-3", "Vitamin D3", "Magnesium"], planned_workout: "Legs A",
  },
  {
    id: "mock-5", date: isoDate(9), created_at: isoDate(9) + "T08:00:00Z",
    sleep_quality: 2, mood: 2, energy: 2, stress: 4, soreness: 4,
    pain_score: 3, protein: "Low", calories: "Under", hydration: "Low",
    caffeine_amount: "High", last_caffeine_time: "After 16",
    supplements_taken: ["Creatine"], notes: "Late night, stressed, bad sleep",
  },
  {
    id: "mock-6", date: isoDate(8), created_at: isoDate(8) + "T08:00:00Z",
    sleep_quality: 3, mood: 3, energy: 3, stress: 3, soreness: 3,
    pain_score: 2, protein: "Okay", calories: "About right", hydration: "Okay",
    caffeine_amount: "Moderate", last_caffeine_time: "12 to 14",
    supplements_taken: ["Creatine", "Vitamin D3"],
  },
  {
    id: "mock-7", date: isoDate(7), created_at: isoDate(7) + "T08:00:00Z",
    sleep_quality: 4, mood: 4, energy: 4, stress: 2, soreness: 2,
    pain_score: 0, protein: "Good", calories: "About right", hydration: "Good",
    caffeine_amount: "Moderate", last_caffeine_time: "Before 12",
    supplements_taken: ["Creatine", "Omega-3", "Vitamin D3", "Magnesium"], planned_workout: "Push B",
  },
  {
    id: "mock-8", date: isoDate(6), created_at: isoDate(6) + "T08:00:00Z",
    sleep_quality: 4, mood: 4, energy: 3, stress: 2, soreness: 3,
    pain_score: 1, protein: "Good", calories: "About right", hydration: "Good",
    caffeine_amount: "Low", last_caffeine_time: "Before 12",
    supplements_taken: ["Creatine", "Omega-3", "Vitamin D3"],
  },
  {
    id: "mock-9", date: isoDate(5), created_at: isoDate(5) + "T08:00:00Z",
    sleep_quality: 5, mood: 4, energy: 5, stress: 1, soreness: 2,
    pain_score: 0, protein: "High", calories: "Over", hydration: "Good",
    caffeine_amount: "Moderate", last_caffeine_time: "Before 12",
    supplements_taken: ["Creatine", "Omega-3", "Vitamin D3", "Magnesium"], planned_workout: "Pull B",
  },
  {
    id: "mock-10", date: isoDate(4), created_at: isoDate(4) + "T08:00:00Z",
    sleep_quality: 4, mood: 4, energy: 4, stress: 2, soreness: 2,
    pain_score: 0, protein: "Good", calories: "About right", hydration: "Good",
    caffeine_amount: "Moderate", last_caffeine_time: "12 to 14",
    supplements_taken: ["Creatine", "Omega-3", "Vitamin D3", "Magnesium"], planned_workout: "Legs B",
  },
  {
    id: "mock-11", date: isoDate(3), created_at: isoDate(3) + "T08:00:00Z",
    sleep_quality: 3, mood: 3, energy: 3, stress: 3, soreness: 4,
    pain_score: 2, protein: "Okay", calories: "Under", hydration: "Okay",
    caffeine_amount: "Moderate", last_caffeine_time: "14 to 16",
    supplements_taken: ["Creatine"], notes: "Skipped lunch, legs sore",
  },
  {
    id: "mock-12", date: isoDate(2), created_at: isoDate(2) + "T08:00:00Z",
    sleep_quality: 4, mood: 4, energy: 4, stress: 2, soreness: 2,
    pain_score: 0, protein: "Good", calories: "About right", hydration: "Good",
    caffeine_amount: "Low", last_caffeine_time: "Before 12",
    supplements_taken: ["Creatine", "Omega-3", "Vitamin D3", "Magnesium"],
  },
  {
    id: "mock-13", date: isoDate(1), created_at: isoDate(1) + "T08:00:00Z",
    sleep_quality: 4, mood: 5, energy: 4, stress: 1, soreness: 2,
    pain_score: 0, protein: "Good", calories: "About right", hydration: "Good",
    caffeine_amount: "Moderate", last_caffeine_time: "Before 12",
    supplements_taken: ["Creatine", "Omega-3", "Vitamin D3", "Magnesium"], planned_workout: "Push A",
  },
]

export const MOCK_TRAINING_HISTORY: TrainingSession[] = [
  {
    id: "tr-1", date: isoDate(13), session_type: "Strength", duration_minutes: 65,
    rpe: 7, muscle_groups: ["chest", "shoulders", "triceps"],
    exercises_freeform: "Bench press 4x8@80kg\nIncline DB press 3x10@28kg\nLateral raise 4x15@12kg\nOverhead press 3x8@50kg\nTricep pushdown 3x12",
  },
  {
    id: "tr-2", date: isoDate(11), session_type: "Strength", duration_minutes: 60,
    rpe: 7, muscle_groups: ["back", "biceps"],
    exercises_freeform: "Pull-up 4x6\nLat pulldown 3x10@70kg\nCable row 3x10@65kg\nFace pull 3x15\nCurl 3x10@16kg",
  },
  {
    id: "tr-3", date: isoDate(10), session_type: "Strength", duration_minutes: 70,
    rpe: 8, muscle_groups: ["quads", "hamstrings", "glutes", "calves"],
    exercises_freeform: "Squat 4x5@100kg\nRDL 3x10@80kg\nLeg press 3x12@150kg\nHamstring curl 3x12\nCalf raise 4x15",
  },
  {
    id: "tr-4", date: isoDate(7), session_type: "Strength", duration_minutes: 65,
    rpe: 7, muscle_groups: ["chest", "shoulders", "triceps"],
    exercises_freeform: "Bench press 4x8@82.5kg\nIncline DB press 3x10@30kg\nLateral raise 4x15@12kg\nOHP 3x8@52.5kg\nTricep pushdown 3x12",
  },
  {
    id: "tr-5", date: isoDate(5), session_type: "Strength", duration_minutes: 60,
    rpe: 7, muscle_groups: ["back", "biceps"],
    exercises_freeform: "Pull-up 4x7\nLat pulldown 3x10@72.5kg\nCable row 3x10@67.5kg\nFace pull 3x15\nCurl 3x10@16kg",
  },
  {
    id: "tr-6", date: isoDate(4), session_type: "Strength", duration_minutes: 68,
    rpe: 8, muscle_groups: ["quads", "hamstrings", "glutes", "calves"],
    exercises_freeform: "Squat 4x5@102.5kg\nRDL 3x10@82.5kg\nLeg press 3x12@155kg\nHamstring curl 3x12\nCalf raise 4x15",
  },
  {
    id: "tr-7", date: isoDate(1), session_type: "Strength", duration_minutes: 65,
    rpe: 7, muscle_groups: ["chest", "shoulders", "triceps"],
    exercises_freeform: "Bench press 4x8@82.5kg\nIncline DB press 3x10@30kg\nLateral raise 4x15@14kg\nOHP 3x8@52.5kg",
  },
]
