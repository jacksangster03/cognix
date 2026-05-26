// ─── POST /api/brief ──────────────────────────────────────────────────────────
// Accepts a BriefContext JSON body, routes to the configured LLM provider,
// validates the output with Zod, retries once on validation failure, and falls
// back to the deterministic provider if anything fails.
//
// The deterministic engine scores are passed in from the client and are never
// recalculated here. The LLM only writes explanatory prose.

import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { getProvider } from "@/lib/llm/provider"
import { DeterministicProvider } from "@/lib/llm/deterministic"
import {
  CognixBriefSchema,
  BriefContextSchema,
  type CognixBrief,
  type BriefMetadata,
} from "@/lib/ai/brief-schema"
import { SYSTEM_PROMPT, buildUserPrompt, buildRepairPrompt } from "@/lib/ai/brief-prompt"

// ─── JSON extraction ──────────────────────────────────────────────────────────
// LLMs sometimes wrap JSON in ```json ... ``` fences. Strip them.

function extractJSON(text: string): unknown {
  const fenceMatch = text.match(/```(?:json)?\s*\n([\s\S]+?)\n```/)
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1])
  }
  // Try finding the first complete {...} block
  const braceStart = text.indexOf("{")
  const braceEnd = text.lastIndexOf("}")
  if (braceStart !== -1 && braceEnd > braceStart) {
    return JSON.parse(text.slice(braceStart, braceEnd + 1))
  }
  return JSON.parse(text)
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  // Validate the incoming context
  const contextResult = BriefContextSchema.safeParse(rawBody)
  if (!contextResult.success) {
    return NextResponse.json(
      { error: "Invalid BriefContext", details: contextResult.error.issues },
      { status: 422 },
    )
  }

  const context = contextResult.data
  const provider = getProvider()
  const userPrompt = buildUserPrompt(context as Parameters<typeof buildUserPrompt>[0])
  const prompt = { system: SYSTEM_PROMPT, user: userPrompt, max_tokens: 1024 }

  let brief: CognixBrief | null = null
  let usedModel = provider.model
  let usedProvider = provider.name
  let fallbackUsed = false

  // ── Attempt 1: primary provider ─────────────────────────────────────────────
  try {
    const result = await provider.generate(prompt)
    usedModel = result.model
    usedProvider = result.provider
    const parsed = extractJSON(result.text)
    brief = CognixBriefSchema.parse(parsed)
  } catch (err) {
    const validationErrors = err instanceof ZodError
      ? err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
      : String(err)

    // ── Attempt 2: repair prompt (LLM providers only) ─────────────────────────
    if (!(provider instanceof DeterministicProvider)) {
      try {
        const originalResponse = await provider.generate(prompt)
        const repairPromptText = buildRepairPrompt(originalResponse.text, validationErrors)
        const repairResult = await provider.generate({
          system: SYSTEM_PROMPT,
          user: repairPromptText,
          max_tokens: 1024,
        })
        const reparsed = extractJSON(repairResult.text)
        brief = CognixBriefSchema.parse(reparsed)
        usedModel = repairResult.model
        usedProvider = repairResult.provider
      } catch {
        // fall through to deterministic fallback
      }
    }
  }

  // ── Fallback: deterministic provider ─────────────────────────────────────────
  if (!brief) {
    fallbackUsed = true
    const fallback = new DeterministicProvider()
    const fallbackResult = await fallback.generate(prompt)
    usedModel = fallback.model
    usedProvider = fallback.name
    try {
      const parsed = extractJSON(fallbackResult.text)
      brief = CognixBriefSchema.parse(parsed)
    } catch {
      // Absolute last resort: return a minimal safe brief
      const rec = context.deterministic_rec as Record<string, string>
      brief = {
        headline: rec.headline ?? "Check-in to get your daily brief.",
        overall_readout: `Readiness score: ${context.scores.overall}/100, mode: ${context.mode}.`,
        training_recommendation: rec.training ?? "See training page for details.",
        nutrition_guidance: rec.nutrition ?? "Hit your protein target today.",
        hydration_guidance: rec.hydration ?? "Aim for your daily water target.",
        caffeine_guidance: rec.caffeine ?? "Keep caffeine intake before your cutoff.",
        supplement_notes: rec.supplements ?? "Take supplements as planned.",
        sleep_focus: rec.sleep ?? "Aim for consistent sleep and wake times.",
        main_risk: rec.main_risk ?? "No critical flags.",
        one_priority: rec.one_priority ?? "Log your check-in to improve accuracy.",
        data_confidence_note: `Data confidence: ${context.data_confidence.confidence_label}.`,
      }
    }
  }

  const metadata: BriefMetadata = {
    provider: usedProvider,
    model: usedModel,
    generated_at: new Date().toISOString(),
    fallback_used: fallbackUsed,
    cached: false,
  }

  return NextResponse.json({ brief, metadata }, { status: 200 })
}
