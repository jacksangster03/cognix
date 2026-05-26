import type { DataConfidence, MockWhoopDay, DailyCheckIn, TrainingSession } from "./types"
import { calculateDataConfidence } from "./scoring"

export function getConfidenceColour(confidence: DataConfidence): string {
  if (confidence.overall >= 80) return "text-emerald-400"
  if (confidence.overall >= 50) return "text-amber-400"
  return "text-red-400"
}

export function getConfidenceDescription(confidence: DataConfidence): string {
  switch (confidence.confidence_label) {
    case "Full":
      return "All signals present. Recommendations are highly accurate."
    case "High":
      return "Most signals present. Recommendations are reliable."
    case "Moderate":
      return "Some signals missing. Recommendations use available data."
    case "Low":
      return "Limited data available. Recommendations are rough estimates."
  }
}

export function buildConfidence(
  whoop: MockWhoopDay | null,
  checkin: DailyCheckIn | null,
  sessions: TrainingSession[],
  hasSettings: boolean,
): DataConfidence {
  return calculateDataConfidence(whoop, checkin, sessions, hasSettings)
}
