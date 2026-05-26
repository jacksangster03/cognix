import type { Mode } from "./types"

// ─── Mode definitions ─────────────────────────────────────────────────────────

export const MODE_CONFIG: Record<Mode, {
  label: string
  colour: string
  bg: string
  border: string
  description: string
  training_guidance: string
}> = {
  Push: {
    label: "Push",
    colour: "text-emerald-400",
    bg: "bg-emerald-950/40",
    border: "border-emerald-500/30",
    description: "Optimal recovery and readiness. Train hard.",
    training_guidance: "Full intensity session. Progressive overload if programme allows.",
  },
  Normal: {
    label: "Normal",
    colour: "text-sky-400",
    bg: "bg-sky-950/40",
    border: "border-sky-500/30",
    description: "Good baseline. Train as planned.",
    training_guidance: "Planned session. Avoid chasing PRs if not feeling it.",
  },
  Moderate: {
    label: "Moderate",
    colour: "text-amber-400",
    bg: "bg-amber-950/40",
    border: "border-amber-500/30",
    description: "Mixed signals. Reduce volume or intensity.",
    training_guidance: "60-75% effort. Drop sets by one, reduce weight 10%. Cut if pain worsens.",
  },
  Deload: {
    label: "Deload",
    colour: "text-orange-400",
    bg: "bg-orange-950/40",
    border: "border-orange-500/30",
    description: "Body needs a break. Light movement only.",
    training_guidance: "Mobility, Zone 2 walk, or short light session. Nothing above RPE 5.",
  },
  Rest: {
    label: "Rest",
    colour: "text-red-400",
    bg: "bg-red-950/40",
    border: "border-red-500/30",
    description: "Recovery is the priority today.",
    training_guidance: "No structured training. Walk, stretch. Prioritise sleep and nutrition.",
  },
}

// ─── Score thresholds ─────────────────────────────────────────────────────────

export const SCORE_THRESHOLDS = {
  recovery: {
    high: 67,
    moderate: 34,
  },
  sleep_performance: {
    good: 85,
    acceptable: 70,
    poor: 55,
  },
  hrv_deviation_warning_pct: -15,    // HRV more than 15% below baseline triggers warning
  rhr_deviation_warning_pct: 6,      // RHR more than 6% above baseline triggers warning
  pain_rest_threshold: 7,            // pain >= 7 forces Rest or Deload
  pain_moderate_cap: 5,              // pain >= 5 caps at Moderate
  soreness_warning: 4,               // soreness >= 4 reduces score
  stress_warning: 4,                 // stress >= 4 reduces score
  acwr_optimal_low: 0.8,
  acwr_optimal_high: 1.3,
  acwr_high_risk: 1.5,
} as const

// ─── Storage keys ─────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  settings: "cognix:settings",
  checkins: "cognix:checkins",
  training_sessions: "cognix:training_sessions",
  experiments: "cognix:experiments",
  demo_mode: "cognix:demo_mode",
  brief_cache: "cognix:brief_cache",
} as const

// ─── App metadata ─────────────────────────────────────────────────────────────

export const APP_META = {
  name: "Cognix",
  tagline: "Biometric and behavioural signals, translated into daily action.",
  version: "0.1.0",
  disclaimer:
    "Cognix is a personal performance tool. It is not a medical device. Nothing here constitutes medical advice.",
} as const

// ─── Navigation routes ────────────────────────────────────────────────────────

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/checkin", label: "Check-in", icon: "ClipboardList" },
  { href: "/training", label: "Training", icon: "Dumbbell" },
  { href: "/planner", label: "Planner", icon: "CalendarClock" },
  { href: "/progress", label: "Progress", icon: "TrendingUp" },
  { href: "/experiments", label: "Experiments", icon: "FlaskConical" },
  { href: "/integrations", label: "Integrations", icon: "Puzzle" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const

// ─── Caffeine half-life hours ─────────────────────────────────────────────────

export const CAFFEINE_HALF_LIFE_HOURS = 5.5

// ─── Default user settings ────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  name: "",
  goal_phase: "recomp" as const,
  bodyweight_kg: 80,
  protein_target_g: 160,
  water_target_litres: 3.0,
  preferred_training_time: "evening" as const,
  caffeine_cutoff_hour: 14,
  timezone: "Europe/Madrid",
  demo_mode: true,
}
