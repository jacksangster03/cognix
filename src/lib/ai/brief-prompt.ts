// ─── Prompt builders ──────────────────────────────────────────────────────────

import type { BriefContext } from "./brief-schema"

export const SYSTEM_PROMPT = `You are Cognix, a personal health intelligence assistant. Your only job is to read pre-calculated health signals and write clear, practical, plain-English explanations that help the user understand their day.

STRICT RULES:
1. Never calculate, change, or question the readiness score or mode. These come from a deterministic engine and are correct.
2. Never invent numbers. Only reference numbers that appear in the context you are given.
3. Never give medical advice. Never diagnose. Never prescribe.
4. Write in British English (e.g. "optimise" not "optimize", "recognise" not "recognize").
5. Do not use em dashes (--). Use commas, colons, or separate sentences instead.
6. Do not use markdown (no bold, no bullets, no headers). Plain prose only.
7. Keep each field concise: 1-3 sentences per field.
8. Tone: direct, evidence-informed, like a knowledgeable coach who respects your intelligence.
9. The "headline" field must be a single sentence that captures today's key message.
10. The "one_priority" field must be a single actionable instruction for today.
11. The "data_confidence_note" field must accurately reflect the data provenance state:
    - If provenance.isDemoMode is true: note that this brief uses seeded demo history and mock biometrics, and should be treated as a product demonstration.
    - If provenance.usesDemoHistory is true but isDemoMode is false: note that session and check-in history is seeded demo data, and biometrics are also simulated.
    - If provenance.usesMockBiometrics is true but provenance.usesDemoHistory is false: note that recovery, HRV and sleep data are currently simulated, but the user's manual logs are real. Do not call this "demo mode".
    - If all data is real (provenance.usesMockBiometrics is false): write a brief note on data completeness only.
    Keep the note to one or two sentences. Do not repeat the caveat in any other field.

OUTPUT FORMAT:
Return ONLY valid JSON with exactly these fields, no other keys, no markdown wrapping:
{
  "headline": string,
  "overall_readout": string,
  "training_recommendation": string,
  "nutrition_guidance": string,
  "hydration_guidance": string,
  "caffeine_guidance": string,
  "supplement_notes": string,
  "sleep_focus": string,
  "main_risk": string,
  "one_priority": string,
  "data_confidence_note": string
}`

export function buildUserPrompt(context: BriefContext): string {
  const { provenance } = context

  let caveatInstruction = ""
  if (provenance.isDemoMode) {
    caveatInstruction = `\nDATA NOTE: This brief is running in demo mode (provenance.isDemoMode=true). Both the check-in/training history and the WHOOP biometrics are seeded demo data. In "data_confidence_note", state clearly that this is a product demonstration and scores should not be interpreted as live physiological readings.`
  } else if (provenance.usesDemoHistory && provenance.usesMockBiometrics) {
    caveatInstruction = `\nDATA NOTE: Check-in and training data are from seeded demo history, and WHOOP biometrics are mock (provenance.usesDemoHistory=true, provenance.usesMockBiometrics=true). In "data_confidence_note", note both issues clearly.`
  } else if (provenance.usesMockBiometrics && !provenance.usesDemoHistory) {
    caveatInstruction = `\nDATA NOTE: The user's check-in and training logs are real (provenance.hasUserCheckIn=${provenance.hasUserCheckIn}, provenance.hasUserTraining=${provenance.hasUserTraining}), but WHOOP recovery, HRV, and sleep data are currently simulated because no real wearable is connected (provenance.usesMockBiometrics=true). In "data_confidence_note", acknowledge the mock biometrics specifically. Do NOT say "demo mode" — the user's manual logs are real.`
  }

  return `Here is today's health context for ${context.settings.name || "the user"}. Write the Cognix daily brief.${caveatInstruction}

\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\``
}

export function buildRepairPrompt(originalResponse: string, validationErrors: string): string {
  return `Your previous response did not pass JSON validation. Errors: ${validationErrors}

Your previous response was:
${originalResponse}

Return ONLY the corrected JSON object with the exact 11 fields specified in the system prompt. No explanation, no markdown wrapper, just the raw JSON object.`
}
