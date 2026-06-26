# Progression Rules

All progression is exercise-specific. Different movements use different models. No single universal rule applies across exercises.

---

## Progression models

### Double progression

Best for most hypertrophy work. Increase load only when all criteria are met.

**Example: 3 × 8–12 at 2 RIR**

Advance load when:
- All prescribed sets reach the upper rep threshold
- Average RIR is not below target
- Technique is acceptable across all sets

```
Week 1: 26 kg × 10, 9, 8    (not ready: set 3 below upper threshold)
Week 2: 26 kg × 11, 10, 9   (not ready: set 2 and 3 below threshold)
Week 3: 26 kg × 12, 11, 10  (not ready: sets 2 and 3 below threshold)
Week 4: 26 kg × 12, 12, 12  (ready: all sets at threshold)
→     : 28 kg × 8 (reset to lower bound)
```

### Top set plus back-offs

For major strength movements where the working weight needs a live top-set signal.

```
Top set: 5–7 reps at 1–2 RIR
Back-offs: 2 × 6–8 at 90% of top-set load
```

The live top-set weight determines back-off load, not a fixed prescription.

### Rep-goal progression

For bodyweight or resistance movements without incremental load.

```
Target: 30 total pull-ups across 4 sets
Once achieved with acceptable RIR across all sets:
  add external load and reset rep target
```

---

## Load velocity proxies

Without bar speed hardware, use descriptive proxies from the user's reported feel:

| Label | Meaning |
|---|---|
| `fast` | Bar moved explosively throughout |
| `normal` | Controlled tempo, no struggle |
| `slow` | Noticeable deceleration |
| `grinder` | Significant deceleration, final reps barely completed |
| `technique_breakdown` | Form degraded to complete the rep |

The LLM maps natural-language reports to this scale. The progression engine uses the label.

---

## Estimated 1RM

```
estimated_1RM = weight × (1 + reps / 30)
```

Adjust for reported RIR by treating the performed set as if additional reps were theoretically available.

Use estimated 1RM for:
- Trend detection across exposures
- Initial prescription when returning to an exercise

Do not use it as absolute truth for day-to-day prescription.

---

## Live autoregulation engine

Applied after every set during a Telegram session. Determines the next action using deterministic rules.

### Load adjustment rules

```
IF completed_reps >= rep_target_upper
AND reported_rir >= target_rir
AND rep_quality NOT IN ['grinder', 'technique_breakdown']
THEN next-set load may increase by smallest available increment

IF reps < rep_target_lower - 1
AND rest_duration >= prescribed_rest
THEN reduce load by 5–10% or terminate after next set

IF reported_rir == 0
AND failure was not prescribed
THEN do NOT increase load; reduce next-set rep target by 1–2

IF pain >= 4
THEN stop exercise; offer non-provocative substitution

IF pain >= 7
THEN terminate all affected training; mark safety event; do not resume
```

### Intra-session adaptation examples

Scenario: first set harder than expected.

```
Prescribed: +10 kg × 6–8 @ 2 RIR
Result set 1: 6 reps @ 1 RIR

Response: Keep +10 kg for set 2. Target 5–6 reps.
Reason: First set was harder than expected; do not increase load.
```

Scenario: load too light.

```
Prescribed: +10 kg × 6–8 @ 2 RIR
Result set 1: 8 reps @ 4 RIR

Response: Set 2 increased to +12.5 kg. Target 6–8 reps.
Reason: Performance was well above target RIR; advance load.
```

---

## Exercise-level progression state

```json
{
  "exercise_id": "incline_dumbbell_press",
  "estimated_1rm_kg_each": 38.4,
  "preferred_rep_range": [7, 10],
  "typical_set_dropoff_pct": 9.2,
  "minimum_recovery_hours": 54,
  "load_increment_kg_each": 2,
  "performance_trend": "improving",
  "confidence": 0.76
}
```

This is updated by the progression and learning engine overnight or after session close. Never overwrite with single-session data without smoothing.

---

## Progression and learning engine inputs

Per exercise, per session:

- Completed load and reps
- Reported RIR and rep quality
- Set order within the session
- Preceding exercises (fatigue state)
- Recovery state (readiness mode)
- Body-weight change (relevant for bodyweight movements)
- Session timing
- Rest interval duration

Use simple rules and rolling averages first. There is no need for a machine-learning model until several months of clean data exist.

---

## Example adaptive session (readiness 57, Moderate)

Planned session:

```
Upper Strength
1. Weighted pull-up      3 × 5–7 @ 2 RIR
2. Incline dumbbell press 3 × 6–9 @ 2 RIR
3. Chest-supported row   3 × 8–10 @ 2 RIR
4. Cable lateral raise   3 × 12–18 @ 1–2 RIR
5. Cable curl            2 × 8–12 @ 1–2 RIR
6. Triceps extension     2 × 10–14 @ 1–2 RIR
```

Readiness is 57 (Moderate) due to short sleep and elevated fatigue. Deterministic transformation:

- Retain primary exercises
- No load progression today
- Cap all sets at 2 RIR
- Remove one row set (accessory volume reduction)
- Remove one arm isolation set
- Estimated duration: 66 min → 53 min

During incline press:

```
Target: 30 kg each × 7–9 @ 2 RIR
Set 1: 8 reps @ 1 RIR → keep load, lower set-2 target to 7

Set 2: 6 reps, failed 7th

Response: Set 3 changed to 28 kg each × 7–8 @ 2 RIR
```

Post-session, the system does NOT mark 30 kg as a regression because it knows:

- Readiness was suppressed
- Sleep was short
- The load was not intended to progress today
- Set 1 still matched recent performance

This context-awareness distinguishes Cognix from a static workout tracker.

---

## Longer-term statistical personalisation

Once several months of data exist, fit simple personal models.

### Performance prediction

```
Predicted reps =
  exercise strength state
  + load effect
  + readiness effect
  + prior-set fatigue
  + rest interval effect
  + exercise order effect
  + body-weight effect
```

### Recovery modelling

Estimate probability that a muscle group is recovered from:
- Hours since last exposure
- Number of hard sets and average RIR
- Eccentric emphasis
- Soreness
- Sleep quality
- Performance on the next exposure

### Programme response comparison

Compare training blocks using:
- Strength trend per movement
- Volume tolerance and adherence
- Subjective fatigue ratings
- Body-weight and endurance trend
- Pain event frequency

Use transparent regressions and rolling averages. No neural network is needed at this scale.
