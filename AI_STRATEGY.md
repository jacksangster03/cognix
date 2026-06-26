# Cognix AI Strategy

## The LLM's exact role

The LLM does exactly four things. Nothing else.

### 1. Parse natural language

Input: "8 reps, fairly easy but felt a little weird in right shoulder"

Output:
```json
{
  "reps": 8,
  "rir": 3,
  "difficulty": "easy",
  "pain_or_discomfort": true,
  "body_location": "right_shoulder",
  "severity": null,
  "requires_followup": true
}
```

### 2. Explain deterministic decisions

Inputs: today's readiness score, planned workout, applied adjustment rules, supporting metrics.

Output: "Your upper session remains appropriate because upper-body fatigue is low. The system removed one accessory set because sleep and subjective energy were below baseline."

### 3. Conduct constrained clarification

Examples:
- "Did you mean 30 kg per dumbbell or total?"
- "Was that pain or normal muscular effort?"
- "Did you complete five reps or fail during the fifth?"

### 4. Summarise trends

Example: "Your incline press has progressed for four consecutive exposures, but performance is more variable when it follows weighted dips."

### What the LLM must never do

- Invent or adjust weights or rep targets
- Alter historical data silently
- Calculate readiness scores
- Diagnose injuries or give medical advice
- Create supplement stacks autonomously
- Override pain or safety rules
- Infer that missing data is normal
- Rewrite the entire programme based on one poor session

---

## Structured LLM tool calls

The LLM interacts with Cognix through narrow tools only. It does not write SQL.

Available tools:

```
get_today_context()
get_current_session()
record_set_result()
record_pain_report()
request_clarification()
get_exercise_history()
suggest_exercise_substitution()
explain_coach_decision()
record_session_feedback()
```

Example tool call:

```json
{
  "tool": "record_set_result",
  "arguments": {
    "session_id": "sess_001",
    "exercise_id": "weighted_pull_up",
    "set_number": 2,
    "load_kg": 10,
    "reps": 6,
    "rir": 1,
    "completion_status": "completed"
  }
}
```

Zod (TypeScript) or Pydantic (Python) validates every tool call before persistence.

---

## Core principle: deterministic code calculates, LLM explains

The readiness score, mode, and all component scores are calculated by pure TypeScript functions in `src/lib/scoring.ts`. An LLM receives these pre-computed outputs and writes plain-English explanations. The LLM never calculates, adjusts, or invents a score.

This matters for four reasons:

**Trustworthiness:** If the LLM says your HRV is fine but TypeScript says it is 22% below baseline, TypeScript wins. The score is deterministic and auditable.

**Auditability:** Every score can be traced back to an exact input and a specific formula.

**Cost control:** The LLM is called once per day per user on demand. It receives pre-computed scores, not raw sensor data. Results are cached in localStorage for the day.

**Resilience:** If the LLM call fails, the app falls back to the deterministic provider automatically. The app never shows nothing.

---

## Provider architecture (implemented in v0.1.1)

Cognix uses a provider-agnostic LLM layer. The active provider is selected via the `LLM_PROVIDER` environment variable. Adding a new provider requires only implementing the `LLMProvider` interface.

### Files

| File | Purpose |
|---|---|
| `src/lib/llm/types.ts` | `LLMProvider` interface, `LLMPrompt`, `LLMResult` |
| `src/lib/llm/deterministic.ts` | Converts `DailyRecommendation` to `CognixBrief` format, no API call |
| `src/lib/llm/anthropic.ts` | Anthropic Messages API via `@anthropic-ai/sdk` |
| `src/lib/llm/provider.ts` | Reads env vars, returns the correct provider instance |
| `src/lib/ai/brief-schema.ts` | Zod schema for `CognixBrief`, `BriefContext`, `CachedBrief` |
| `src/lib/ai/brief-prompt.ts` | System prompt, user prompt builder, repair prompt builder |
| `src/lib/ai/build-brief-context.ts` | Assembles `BriefContext` from app state |
| `src/app/api/brief/route.ts` | `POST /api/brief` endpoint with retry and fallback logic |

### Provider selection logic

```
LLM_PROVIDER env var
  "anthropic"  → ANTHROPIC_API_KEY present? → AnthropicProvider
                                            → DeterministicProvider (warning logged)
  "deterministic" or missing              → DeterministicProvider
  anything else (openai, openrouter, etc) → DeterministicProvider (warning logged)
```

### Adding a new provider

1. Create `src/lib/llm/yourprovider.ts` implementing `LLMProvider`
2. Add a case to the switch in `src/lib/llm/provider.ts`
3. Add the env var to `.env.example`

---

## API route: POST /api/brief

Accepts a `BriefContext` JSON body. Returns `{ brief: CognixBrief, metadata: BriefMetadata }`.

### Request flow

1. Parse body, validate with `BriefContextSchema`
2. `getProvider()` returns the active provider
3. Build system and user prompts via `brief-prompt.ts`
4. Call `provider.generate(prompt)`
5. Extract JSON from response (strips markdown fences if present)
6. Validate with `CognixBriefSchema`
7. If validation fails: retry once with a repair prompt
8. If retry fails or the provider throws: use `DeterministicProvider` fallback
9. Return `{ brief, metadata }` including `provider`, `model`, `generated_at`, `fallback_used`

### Response metadata

```typescript
interface BriefMetadata {
  provider: string       // e.g. "anthropic"
  model: string          // e.g. "claude-sonnet-4-5"
  generated_at: string   // ISO datetime
  fallback_used: boolean
  cached: boolean        // set by client from localStorage
}
```

---

## LLM output schema

```typescript
const CognixBriefSchema = z.object({
  headline: z.string().min(10).max(200),
  overall_readout: z.string().min(20).max(500),
  training_recommendation: z.string().min(10).max(400),
  nutrition_guidance: z.string().min(10).max(400),
  hydration_guidance: z.string().min(10).max(300),
  caffeine_guidance: z.string().min(10).max(300),
  supplement_notes: z.string().min(10).max(300),
  sleep_focus: z.string().min(10).max(300),
  main_risk: z.string().min(10).max(300),
  one_priority: z.string().min(10).max(200),
  data_confidence_note: z.string().min(10).max(300),
})
```

All LLM output is validated with Zod before storage or display. Validation failure triggers a repair retry, then deterministic fallback. The user always sees a brief.

---

## Caching

Generated briefs are cached in localStorage under `cognix:brief_cache` (30-day ring buffer, one entry per date). On dashboard load, the client checks the cache before calling `/api/brief`. If a cached brief for today exists, no API call is made.

---

## System prompt rules

The system prompt hard-constrains the model to:

- Never calculate or change readiness score or mode
- Never invent numbers (only reference numbers present in context)
- Never give medical advice
- Write in British English
- No em dashes, no markdown, plain prose only
- Keep each field to 1-3 sentences
- Tone: direct, evidence-informed, like a knowledgeable coach

---

## Token cost model

| Item | Approximate tokens |
|---|---|
| System prompt | ~220 |
| BriefContext (JSON) | ~500 |
| Expected output | ~350 |
| Total per brief | ~1,070 tokens |

At claude-sonnet-4-5 pricing ($3/M input, $15/M output):
- Cost per brief: ~$0.0031 (under 0.4 cents)
- Cost for 100 users daily: ~$0.31/day
- With localStorage caching, regeneration is rare in practice

---

## Future: Ask Cognix (v0.8)

Conversational interface. LLM with function calling against Supabase. Read-only queries only. Context is scoped to the authenticated user (enforced by RLS, not just the prompt). Medical disclaimer appended to every response referencing symptoms.

---

## Data provenance in the brief

Cognix makes a precise distinction between four concepts that are often conflated. Getting this right matters because labelling a user's real check-in as "demo data" is inaccurate and erodes trust.

| Concept | Meaning | Flag |
|---|---|---|
| Demo mode | The settings toggle is on; seeded example data is loaded | `provenance.isDemoMode` |
| Mock biometrics | WHOOP-style data is simulated; no real wearable connected | `provenance.usesMockBiometrics` |
| Demo history | Check-in and training data are from seeded mock history | `provenance.usesDemoHistory` |
| User logs | The user has typed real check-ins or sessions | `provenance.hasUserCheckIn / hasUserTraining` |

`DataSources` tags each signal individually. `ProvenanceFlags` distils the combination into named booleans. `getDataStateLabel()` (in `build-brief-context.ts`) maps flags to a single canonical `DataStateLabel`:

```
"Demo mode"                    — isDemoMode=true
"Demo history + mock biometrics" — usesDemoHistory && usesMockBiometrics && !isDemoMode
"Manual logs + mock biometrics"  — hasUserCheckIn && usesMockBiometrics && !usesDemoHistory
"Live personal data"             — !usesMockBiometrics (real WHOOP, v0.4+)
"Limited data"                   — no WHOOP, no check-in, no demo
```

### How the prompt uses provenance

`buildUserPrompt()` generates a distinct caveat instruction for each state:

- `isDemoMode=true` → tells the model this is a product demonstration; scores should not be interpreted as live physiological readings.
- `usesDemoHistory && usesMockBiometrics && !isDemoMode` → tells the model both history and biometrics are seeded.
- `usesMockBiometrics && !usesDemoHistory` → tells the model the user's manual logs are real, but WHOOP readings are simulated. Instructs the model NOT to use the phrase "demo mode".

The caveat goes only into `data_confidence_note`. No other field repeats it.

### How the UI uses provenance

- **ReadinessHero**: amber chip showing the `DataStateLabel` (hidden for "Live personal data")
- **Dashboard notice**: one-sentence amber box below the page header with state-specific detail
- **DailyBriefCard header**: amber badge with the `DataStateLabel`
- **DailyBriefCard body**: `ProvenanceNotice` component with precise, state-specific prose

All indicators disappear when `provenance.usesMockBiometrics=false` and `provenance.usesDemoHistory=false`. The v0.4 migration is one flag: pass `whoopIsReal: true` to `buildBriefContext`.

### `is_demo` in metadata vs. in context

- `BriefMetadata.is_demo` = any non-real data was present (`usesMockBiometrics || usesDemoHistory`). Used by analytics and caching.
- `BriefContext` no longer has a top-level `is_demo`. The explicit `provenance` flags replace it with precise semantics.

---

## No medical claims: enforcement

Every system prompt includes:

```
Never give medical advice. Never diagnose. Never prescribe.
If the user reports pain >= 7/10 or persistent symptoms, the deterministic
engine has already capped the mode to Rest. Do not attempt to reinterpret this.
```

This is enforced in `brief-prompt.ts`, not just the UI disclaimer.
