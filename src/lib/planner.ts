import type {
  CalendarBlock,
  WorkoutSlotRecommendation,
  Mode,
  SessionType,
} from "./types"

// ─── Mock calendar blocks (replace with Google Calendar in v0.5) ──────────────

export const MOCK_CALENDAR_BLOCKS: CalendarBlock[] = [
  { label: "Lecture", start_hour: 9, end_hour: 11, type: "busy" },
  { label: "Free", start_hour: 12, end_hour: 13, type: "free" },
  { label: "Study / Work", start_hour: 14, end_hour: 16, type: "busy" },
  { label: "Free", start_hour: 17.5, end_hour: 19, type: "free" },
  { label: "Dinner / Social", start_hour: 20, end_hour: 21, type: "social" },
]

function getFreeSlots(blocks: CalendarBlock[]): CalendarBlock[] {
  return blocks.filter((b) => b.type === "free")
}

function scoreSlot(
  block: CalendarBlock,
  mode: Mode,
  preferredHour: number,
  targetDuration: number,
): number {
  const available = (block.end_hour - block.start_hour) * 60
  const fits = available >= targetDuration

  if (!fits) return 0

  let score = 60

  // Prefer slots close to the user's preferred training time
  const distance = Math.abs(block.start_hour - preferredHour)
  score -= distance * 3

  // Penalise very late training (after 20:00)
  if (block.start_hour >= 20) score -= 25
  if (block.start_hour >= 19) score -= 10

  // Penalise training right after eating (12:00-13:00 post-lunch)
  if (block.start_hour === 12) score -= 5

  // Bonus for afternoon free time (sweet spot 17:00-19:00 for most people)
  if (block.start_hour >= 17 && block.start_hour < 19) score += 15

  // Mode adjustments
  if (mode === "Rest" || mode === "Deload") score -= 20
  if (mode === "Push") score += 10

  return Math.max(0, Math.min(100, score))
}

function recommendedSessionType(mode: Mode): SessionType {
  switch (mode) {
    case "Push": return "Strength"
    case "Normal": return "Strength"
    case "Moderate": return "Strength"
    case "Deload": return "Mobility"
    case "Rest": return "Recovery"
  }
}

function recommendedDuration(mode: Mode, available: number): number {
  const targets: Record<Mode, number> = {
    Push: 65,
    Normal: 60,
    Moderate: 45,
    Deload: 30,
    Rest: 20,
  }
  return Math.min(targets[mode], available)
}

function slotRationale(slot: WorkoutSlotRecommendation, mode: Mode): string {
  const parts: string[] = []

  if (mode === "Push") parts.push("Readiness is high.")
  if (mode === "Rest") parts.push("Rest day: short movement only.")
  if (mode === "Deload") parts.push("Deload day: light session.")

  parts.push(`${slot.duration_available_minutes} minutes available.`)

  if (slot.start_hour >= 17 && slot.start_hour < 19) {
    parts.push("Afternoon slots are optimal: body temperature peaks, strength output is highest.")
  }
  if (slot.start_hour >= 12 && slot.start_hour < 14) {
    parts.push("Lunchtime slot: efficient but digestion may be a factor if you ate just before.")
  }

  return parts.join(" ")
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function findBestWorkoutSlot(
  mode: Mode,
  preferredHour: number,
  targetDuration = 60,
  blocks: CalendarBlock[] = MOCK_CALENDAR_BLOCKS,
): WorkoutSlotRecommendation | null {
  const free = getFreeSlots(blocks)
  if (free.length === 0) return null

  const scored = free
    .map((block) => {
      const available = Math.round((block.end_hour - block.start_hour) * 60)
      const score = scoreSlot(block, mode, preferredHour, targetDuration)
      const recDuration = recommendedDuration(mode, available)

      const slot: WorkoutSlotRecommendation = {
        start_hour: block.start_hour,
        end_hour: block.end_hour,
        label: block.label,
        duration_available_minutes: available,
        score,
        rationale: "",
        recommended_session_type: recommendedSessionType(mode),
        recommended_duration_minutes: recDuration,
      }

      slot.rationale = slotRationale(slot, mode)
      return slot
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored[0] ?? null
}

export function formatHour(h: number): string {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`
}
