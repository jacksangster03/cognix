// ─── Deterministic provider ───────────────────────────────────────────────────
// Converts a pre-computed BriefContext into CognixBrief format without any
// API call. This is the guaranteed fallback when no key is configured or when
// a real provider fails. The "text" it returns is valid JSON so the API route
// can parse it through the same path as a real LLM response.

import type { LLMProvider, LLMPrompt, LLMResult } from "./types"
import type { BriefContext } from "@/lib/ai/brief-schema"

function buildDeterministicBrief(context: BriefContext): Record<string, string> {
  const { deterministic_rec: rec, scores, data_confidence, settings } = context

  const confidenceNote =
    data_confidence.confidence_label === "Low"
      ? "Limited data available. Log a check-in and connect WHOOP to improve accuracy."
      : data_confidence.confidence_label === "Moderate"
        ? `${data_confidence.missing_signals.join(", ")} missing. Recommendations are estimates.`
        : data_confidence.confidence_label === "High"
          ? "Most signals present. Recommendations are reliable."
          : "All signals present. Recommendations are highly accurate."

  const overallReadout = [
    `Readiness score ${scores.overall}/100, mode ${context.mode}.`,
    scores.recovery < 50 ? `Recovery is below baseline at ${scores.recovery}/100.` : `Recovery is solid at ${scores.recovery}/100.`,
    scores.sleep < 50 ? `Sleep score is low (${scores.sleep}/100), which is the primary drag today.` : "",
    context.whoop_summary?.hrv_rmssd != null && context.whoop_summary.hrv_baseline != null
      ? `HRV is ${context.whoop_summary.hrv_rmssd} ms against a 30-day baseline of ${context.whoop_summary.hrv_baseline} ms.`
      : "",
  ].filter(Boolean).join(" ")

  return {
    headline: rec.headline,
    overall_readout: overallReadout,
    training_recommendation: rec.training,
    nutrition_guidance: rec.nutrition,
    hydration_guidance: rec.hydration,
    caffeine_guidance: rec.caffeine,
    supplement_notes: rec.supplements,
    sleep_focus: rec.sleep,
    main_risk: rec.main_risk,
    one_priority: rec.one_priority,
    data_confidence_note: confidenceNote,
  }
}

export class DeterministicProvider implements LLMProvider {
  readonly name = "deterministic"
  readonly model = "deterministic-v1"

  async generate(prompt: LLMPrompt): Promise<LLMResult> {
    // The user prompt embeds the BriefContext JSON. Extract and use it.
    // If parsing fails for any reason, return a minimal safe response.
    let context: BriefContext | null = null
    try {
      const jsonMatch = prompt.user.match(/```json\n([\s\S]+?)\n```/)
      const raw = jsonMatch ? jsonMatch[1] : prompt.user
      context = JSON.parse(raw) as BriefContext
    } catch {
      // context remains null; caller handles fallback
    }

    if (!context) {
      return {
        text: JSON.stringify({ error: "no_context" }),
        model: this.model,
        provider: this.name,
      }
    }

    const brief = buildDeterministicBrief(context)
    return {
      text: JSON.stringify(brief),
      model: this.model,
      provider: this.name,
    }
  }
}
