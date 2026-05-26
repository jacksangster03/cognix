# Cognix: Portfolio Positioning Guide

## How to frame this project

Cognix is a personal health intelligence platform. It synthesises wearable biometric data with manual behavioural inputs to generate a daily readiness score and protocol.

**What it is not:** a fitness tracker, a workout logger, or a calorie counter. Those exist. Cognix does the synthesis layer that none of them do.

**What makes it technically interesting:**
- Digital biomarker signal processing (HRV deviation, sleep architecture, ACWR)
- WHOOP API integration (OAuth 2.0, physiological cycle architecture)
- Deterministic scoring engine with LLM synthesis layer (separation of concerns)
- Structured AI output with Zod validation and graceful fallback
- Data confidence modelling (partial-data-tolerant recommendations)
- N-of-1 experiment design (hypothesis, protocol, outcome measurement)

---

## Connection to digital biomarkers

HRV RMSSD is a clinically validated biomarker of autonomic nervous system function. It is used in:
- Post-surgical recovery monitoring
- Cardiac rehabilitation
- Depression and anxiety research (low HRV correlates with severity)
- Sports medicine (overtraining detection)
- Remote patient monitoring for chronic disease

The Cognix approach (comparing today's HRV to a personal 30-day baseline rather than a population reference) mirrors the intra-individual deviation approach used in validated digital biomarker endpoints.

Sleep architecture (SWS and REM percentages, sleep efficiency) is used as a digital endpoint in:
- Alzheimer's disease clinical trials (sleep fragmentation as a prodromal biomarker)
- Depression treatment studies (REM latency)
- Parkinson's disease (REM sleep behaviour disorder)

---

## Connection to pharma digital health

**Regulatory framing:** Cognix is not a medical device. It is a personal wellness tool. But its architecture is deliberately designed to be upgradeable toward regulated contexts:

- Deterministic scoring is auditable (required for SaMD)
- No medical claims architecture is consistent with FDA 21 CFR Part 11 guidance
- RLS-enforced data isolation mirrors clinical data integrity requirements
- Structured AI output with validation mirrors what is required in clinical decision support tools

**Real-world evidence (RWE) connection:** The experiment engine is a simplified N-of-1 trial design. This is methodologically related to n-of-1 RWE study designs used in personalised medicine and pragmatic clinical trials.

**Remote patient monitoring (RPM) connection:** The WHOOP data pipeline (wearable device, OAuth, real-time sync, threshold-based alerting) is architecturally identical to RPM systems used for:
- Post-discharge cardiac monitoring
- Diabetes management (CGM integration)
- Oncology symptom monitoring (PRO-based digital endpoints)

---

## How to talk about it in interviews

**For pharma AI/data roles:**
"I built a personal health intelligence platform that processes wearable biometric data and manual behavioural inputs into a daily readiness score and protocol. The architecture separates deterministic signal processing from LLM synthesis, which maps directly to how you would design a clinical decision support tool where auditability and trustworthiness are non-negotiable."

**For digital health/healthtech product roles:**
"The interesting problem I solved was making the app useful with incomplete data. If WHOOP is disconnected, or the user hasn't logged today, the app still generates a score and recommendation with a data confidence indicator. That graceful degradation is what makes it practical."

**For digital biomarker roles:**
"The HRV scoring uses intra-individual deviation from a 30-day rolling baseline rather than population reference values, because interpersonal HRV variation is large and individual trends are what matter. This is the same approach used in validated digital biomarker endpoints in clinical trials."

**For AI product/engineering roles:**
"I deliberately separated the scoring layer from the AI layer. TypeScript calculates the scores; Claude explains them. All Claude output is validated with Zod against a strict schema before storage. If Claude fails or returns unexpected output, the app falls back to deterministic text. The AI is a synthesis layer, not the source of truth."

---

## What this project does not claim

- It is not clinically validated
- It does not diagnose, treat, or prevent any condition
- The scoring weights are based on sports science and physiology literature, not a clinical trial
- WHOOP data is consumer-grade wearable data, not medical-grade diagnostics
- The experiment outcomes are observational, not controlled studies

These limits are explicit and honest. A pharma interviewer will appreciate intellectual honesty about what consumer digital health tools can and cannot do.

---

## Complementarity with Neuropharma RAG

| Dimension | Neuropharma RAG | Cognix |
|---|---|---|
| Domain | Clinical / pharma | Consumer healthtech |
| Data type | Clinical trial records, PubMed abstracts | Wearable biometrics, behavioural logs |
| AI role | RAG synthesis of clinical evidence | Natural language explanation of scores |
| Stack | Python, ChromaDB, sentence-transformers | Next.js, TypeScript, Supabase |
| Relevance | Pharma data science, RWE, AI in drug discovery | Digital health, RPM, wearable data, AI product |

Together they demonstrate: clinical data at one end, consumer-facing wearable intelligence at the other. Both with disciplined AI architecture (no hallucination, structured output, validation).

---

## GitHub/LinkedIn description

> "Personal health intelligence platform processing WHOOP biometrics, HRV deviation analysis, and ACWR training load into a daily readiness score and protocol. Deterministic TypeScript scoring engine with Claude AI explanation layer. Full-stack Next.js 15, Supabase, TypeScript. Demonstrates digital biomarker signal processing, wearable data architecture, and production AI integration patterns relevant to pharma digital health and remote patient monitoring."
