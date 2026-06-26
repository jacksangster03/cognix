# Telegram Flows

Telegram is the execution client for the coaching engine. It is not a free-form AI chatbot. Every session is a deterministic state machine. The LLM interprets natural language and explains decisions; it does not control flow.

---

## Session state machine

```
SESSION_PROPOSED
    ↓
SESSION_ACCEPTED
    ↓
WARMUP_IN_PROGRESS
    ↓
AWAITING_SET_RESULT
    ↓
SET_RECORDED
    ↓
RESTING
    ↓
NEXT_SET_READY
    ↓
EXERCISE_COMPLETE
    ↓
SESSION_COMPLETE
```

### Example session state record

```json
{
  "session_id": "sess_2026_06_29_001",
  "status": "awaiting_set_result",
  "exercise_index": 2,
  "set_index": 1,
  "prescribed": {
    "exercise_id": "incline_dumbbell_press",
    "load_kg_each": 30,
    "rep_min": 7,
    "rep_max": 9,
    "target_rir": 2
  },
  "started_at": "2026-06-29T18:42:00+02:00"
}
```

The LLM can interpret "managed 8 but pretty grindy" but it cannot decide that this message refers to a different exercise. Session state provides that context and prevents hallucinations, duplicate sets, and corrupted logs.

---

## Morning interaction

At a chosen time Cognix sends a morning summary:

```
Today: Upper Strength

Readiness: 74, Normal
Sleep: slightly below baseline
Legs: residual fatigue from Tuesday
Upper body: recovered
Estimated duration: 58 minutes

Main target: progress weighted pull-ups and incline press
Adjustment: one fewer accessory set because sleep was 6h 22m

[Start workout]  [Swap workout]  [Train later]  [Rest today]
```

---

## During the session

### Warm-up delivery

```
1. Weighted pull-up

Warm-up: bodyweight × 6
Target: smooth reps, at least 3 reps in reserve

[Done]  [Change]
```

### Working set delivery

```
Working set 1
+10 kg × 6
Target: 2 RIR
Rest after: 3:00

[6 easy]  [6 right]  [6 hard]
[5 reps]  [Failed]   [Change load]
```

The user may also type naturally:

> got 6 but last rep was very slow, probably 1 rir

The LLM parses this into a structured record:

```json
{
  "completed_reps": 6,
  "load_kg": 10,
  "rir": 1,
  "result": "completed",
  "rep_quality": "slow_final_rep",
  "pain": 0
}
```

The progression engine then responds:

```
Logged: +10 kg × 6 @ 1 RIR.

Keep +10 kg for set 2. Target 5–6 reps.
Your first set was harder than expected, so I am not increasing the load.
```

---

## Failure and pain handling

### On failure

```
Failed on rep 5

What stopped the set?

[Muscle failure]  [Grip]  [Technique]  [Pain]  [Other]
```

Cognix distinguishes:

- Muscular failure
- Grip limitation
- Cardiovascular limitation
- Technique breakdown
- Pain
- Equipment issue
- Low motivation
- Misunderstood instruction

### On pain

```
Where and how severe (0–10)?
```

Pain uses deterministic safety rules. The LLM can clarify language but cannot override a safety stop. See `SAFETY_RULES.md` for thresholds.

---

## End-of-session interaction

```
Session complete

Duration: 61 min
Volume: 7,840 kg
Completed: 18 of 19 working sets
Session RPE: 8
Two exercises progressed
Estimated recovery: 48–72 hours

How do you feel?

[Better than expected]  [As expected]  [More fatigued]  [Something hurts]
```

Then one short optional question:

```
Anything worth remembering?
```

Example response: "incline dumbbells felt much better at a lower bench angle"

Cognix stores this as an exercise preference or technique observation, not as a freeform instruction that changes the programme.

---

## Initial bot commands

| Command | Purpose |
|---|---|
| `/start` | Greet and connect account |
| `/today` | Show today's planned workout and readiness summary |
| `/workout` | Begin the session |
| `/status` | Current session state or last session summary |
| `/weight` | Log today's body weight |
| `/checkin` | Morning subjective check-in |
| `/history` | Recent session log |
| `/swap` | Request exercise substitution |
| `/stop` | End session early and save what was completed |
| `/help` | List commands |
| `/privacy` | Show active data sources and recent LLM payload summary |

---

## Initial feedback buttons

| Button | Meaning |
|---|---|
| Completed | Set done as prescribed |
| Easy | Completed, felt significantly below target RIR |
| As expected | Completed, felt on target |
| Hard | Completed, felt at or above target RIR |
| Failed | Did not complete prescribed reps |
| Pain | Stopped due to pain; triggers pain flow |
| Skip | Skip this set without recording |
| Swap | Request a substitute exercise |

---

## What Telegram is NOT

- Not a free-form chatbot
- Not a way to override deterministic safety rules via natural language
- Not the system of record (Cognix database is)
- Not the analytics interface (Cognix web app is)

Telegram is input and execution. Cognix web app is configuration and analysis.
