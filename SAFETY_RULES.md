# Safety Rules

Safety in Cognix is deterministic and non-negotiable. The LLM can clarify language. It cannot override a safety stop.

---

## Hard stop conditions

These immediately terminate the relevant exercise or session.

| Condition | Response |
|---|---|
| Pain score >= 7/10 | Terminate session immediately; mark safety event; do not resume without user confirmation |
| Pain score >= 4/10 | Stop affected exercise; offer non-provocative substitution |
| Chest pain | Stop session; prompt user to seek medical attention |
| Fainting or near-fainting | Stop session; prompt medical attention |
| Unusual shortness of breath (non-exertional) | Stop session; flag |
| Neurological symptoms (numbness, vision, dizziness) | Stop session; prompt medical attention |
| Acute illness flag | No training; switch to rest mode |
| Injury worsening during session | Stop session; mark pain event; do not auto-resume |

Hard stop conditions are defined in code as constants. They are not prompt-configurable.

---

## Readiness mode transformations

Readiness modifies the programme with predefined transformations. It does not rewrite the programme arbitrarily.

| Mode | Readiness score | Transformation |
|---|---|---|
| Push | 80–100 | Allow load or volume progression |
| Normal | 60–79 | Execute plan as written |
| Moderate | 40–59 | Reduce working sets by 20%; maintain technique work; avoid prescribed failure |
| Deload | 20–39 | Reduce load 10–20%; reduce sets 40–60% |
| Rest | 0–19 | No structured training |

A readiness of 42 does not randomly replace a hypertrophy session with yoga. It applies the Moderate transformation above.

Pain overrides:
- Pain >= 7: overall readiness capped at 30, mode forced to Rest
- Pain >= 5: overall readiness capped at 55, mode capped at Moderate

---

## Soft adjustment conditions

These trigger readiness modifications but not hard stops.

- Repeated performance decline across multiple sessions
- Elevated resting heart rate (+10 bpm above personal baseline)
- Substantially suppressed HRV (< −20% from 30-day mean)
- Poor sleep for 3+ consecutive nights
- High reported soreness in the target muscle group
- Unusual subjective fatigue (check-in energy < 3/10)
- ACWR > 1.5 (elevated injury risk zone)
- Heat exposure (temperature > 33°C for outdoor sessions)
- Reported inadequate food or hydration

---

## Confidence-aware behaviour

The system adjusts its certainty based on available data.

| Confidence level | Condition | Behaviour |
|---|---|---|
| High | Readiness + history + check-in all present | Proceed with full prescription |
| Medium | Missing wearable data; recent logs present | Proceed with moderate prescription; note missing data |
| Low | No check-in; stale training history; failed sync | Ask before prescribing |

Low confidence prompt:

```
I am missing today's recovery data. How are energy, soreness and sleep?

[Feeling good]  [Average]  [Feeling rough]  [Skip check-in]
```

---

## Failure classification

After a failed set, the bot asks what stopped it before adapting.

| Failure type | Adaptation |
|---|---|
| Muscular failure | Reduce load or rep target; note expected |
| Grip limitation | Suggest straps or reduce load for next set |
| Cardiovascular limitation | Extend rest; reduce load if persists |
| Technique breakdown | Reduce load; cue technique; do not increase |
| Pain (any) | Follow pain protocol above |
| Equipment issue | Offer substitution; mark set as incomplete |
| Low motivation | Note; continue unless user requests stop |
| Misunderstood instruction | Clarify; re-deliver set |

---

## Disclaimer

Cognix is a personal performance tool, not a medical device and not a substitute for clinical care. For significant or worsening pain, or any medical concern, seek qualified clinical advice before continuing training.
