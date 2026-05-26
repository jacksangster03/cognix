# Cognix AI Strategy

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

Every brief carries a `DataSources` object describing the provenance of each signal:

```typescript
interface DataSources {
  whoop: "mock" | "real" | "missing"
  checkin: "user" | "demo" | "missing"
  training: "user" | "demo" | "missing"
  nutrition: "rough_user" | "demo" | "missing"
}
```

**How provenance is determined** (in `build-brief-context.ts`):

- `whoop: "mock"` — all WHOOP data in v0.1 comes from `mock-whoop.ts`. Switches to `"real"` in v0.4 when `whoopIsReal: true` is passed to `buildBriefContext`.
- `checkin: "user"` — the check-in was logged by the user into localStorage. `"demo"` when demo mode is on and the data comes from `MOCK_CHECKIN_HISTORY`.
- `training: "user"` — sessions were logged by the user. `"demo"` when demo mode on and no real sessions exist.
- `nutrition: "rough_user"` — derived from a user check-in (not tracked calories, still their data). `"demo"` when from mock history.

`is_demo` is `true` if demo mode is on, or if `whoop === "mock"`, or if `checkin === "demo"`.

### How the model uses this

If `is_demo` is true or `data_sources.whoop === "mock"`, the system prompt instructs the model to write an honest note in `data_confidence_note` that the brief is based on mock biometric data and should be treated as a product demonstration. No other field repeats this caveat.

### How the UI uses this

- **ReadinessHero**: amber "manual + mock biometrics" or "demo mode" chip
- **Dashboard**: amber notice chip below the page header
- **DailyBriefCard header**: small "mock data" badge
- **DailyBriefCard body**: amber callout panel with full explanation

All indicators disappear when `data_sources.whoop === "real"`.

---

## No medical claims: enforcement

Every system prompt includes:

```
Never give medical advice. Never diagnose. Never prescribe.
If the user reports pain >= 7/10 or persistent symptoms, the deterministic
engine has already capped the mode to Rest. Do not attempt to reinterpret this.
```

This is enforced in `brief-prompt.ts`, not just the UI disclaimer.
