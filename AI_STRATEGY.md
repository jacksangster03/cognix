# Cognix AI Strategy

## Core principle: deterministic code calculates, LLM explains

The readiness score, mode, and all component scores are calculated by pure TypeScript functions. Claude receives these pre-computed outputs and explains them in natural language. Claude never calculates, adjusts, or invents a score.

This matters for four reasons:

**Trustworthiness:** If Claude says your HRV is fine but TypeScript says it is 22% below baseline, TypeScript wins. The score is deterministic and auditable.

**Auditability:** Every score can be traced back to an exact input and a specific formula. This is essential for any regulatory context (SaMD, clinical decision support).

**Cost control:** Claude is called once per day per user. It receives pre-computed scores, not raw sensor data. Maximum 800 tokens of context per request.

**Resilience:** If the Claude call fails, the app falls back to deterministic text recommendations. The app never shows nothing.

---

## What Claude receives (v0.3)

```typescript
// Context sent to Claude (not raw sensor data)
interface BriefContext {
  user: { name: string; goal_phase: string; bodyweight_kg: number }
  date: string
  scores: ReadinessScores          // pre-computed, 0-100 each
  mode: Mode                       // pre-computed
  whoop_summary: {
    recovery_score: number
    hrv_milli: number
    hrv_pct_vs_baseline: number    // pre-computed deviation
    sleep_total_hours: number
    sleep_performance_pct: number
    strain_score: number
  }
  training_summary: {
    acwr: number                   // pre-computed
    acwr_status: string
    last_session_type: string
    days_since_rest: number
  }
  nutrition_summary: {
    protein_band: string
    hydration_band: string
    caffeine_timing: string
  }
  deterministic_recommendation: DailyRecommendation  // already computed
}
```

---

## Claude output schema

```typescript
const BriefOutputSchema = z.object({
  headline: z.string().max(80),
  overall_readout: z.string().max(400),
  recovery_insight: z.string().max(200),
  sleep_insight: z.string().max(200),
  training_recommendation: z.string().max(300),
  nutrition_guidance: z.string().max(300),
  supplement_notes: z.string().max(200),
  one_thing: z.string().max(120),
  data_completeness: z.array(z.string()),
})
```

All output is validated with Zod before being stored or displayed. If validation fails, the app uses the deterministic recommendation text instead.

---

## System prompt (v0.3)

```
You are Cognix, a personal health intelligence assistant.

Rules:
- Be direct and specific. "Your HRV is 14% below your 30-day baseline" is better than "your recovery is a bit low."
- Explain the WHY behind each recommendation, citing the specific data point.
- Do not give medical advice. Do not diagnose. Do not recommend supplements beyond what the user has already logged.
- If data is missing, acknowledge it briefly without penalising the score.
- Tone: coach, not cheerleader. Honest, grounded, motivating without being sycophantic.
- Length: 200-350 words total across all fields.

Return a JSON object matching the schema provided. No markdown. No explanation outside the JSON.
```

---

## Token cost model

| Item | Tokens |
|---|---|
| System prompt | ~200 |
| User context | ~400 |
| Expected output | ~350 |
| Total per brief | ~950 tokens |

At $3 per million tokens (claude-sonnet-4-6 input) and $15 per million output:
- Cost per brief: ~$0.0029 (under 0.3 cents)
- Cost for 100 users daily: ~$0.29/day

---

## Future: Ask Cognix (v0.8)

Conversational interface. Claude with function calling. Can query Supabase for specific date ranges, correlations, and experiment outcomes.

Safety boundaries:
- All function calls read-only. Claude cannot write to the database.
- Context includes only the authenticated user's data (enforced by RLS).
- No cross-user data access at any layer.
- Medical disclaimer appended to every response that mentions symptoms.

---

## No medical claims: implementation

Every Claude prompt includes:
```
IMPORTANT: You are a personal performance tool. Do not make medical claims.
Do not diagnose. Do not advise on medications. If the user reports persistent
pain (>7/10), significant illness, or a medical condition, advise them to
seek qualified clinical advice and do not attempt to interpret their symptoms.
```

This is enforced in the system prompt, not just the UI disclaimer.
