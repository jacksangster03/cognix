import type { FutureIntegration } from "./types"

// ─── Future integration catalogue ─────────────────────────────────────────────
// These are not yet built. They document the planned integration surface
// for the roadmap, portfolio narrative, and the /integrations UI page.

export const FUTURE_INTEGRATIONS: FutureIntegration[] = [
  {
    id: "whoop",
    name: "WHOOP",
    description: "Primary biometric data source: recovery, HRV, sleep, and strain.",
    what_it_adds: [
      "Real recovery score (0-100)",
      "HRV RMSSD in milliseconds vs 30-day baseline",
      "Resting heart rate vs baseline",
      "Deep sleep, REM sleep, and sleep efficiency",
      "Daily strain score and kilojoules burned",
      "Respiratory rate and SpO2",
    ],
    why_it_matters:
      "WHOOP is the cornerstone of the recommendation engine. All subjective scores become secondary to objective physiological data. The app works without it, but with it the confidence level goes from Moderate to Full.",
    phase: "v0.4",
    status: "planned",
    oauth_required: true,
    api_complexity: "medium",
    estimated_effort: "4-5 days",
    data_fields_unlocked: ["recovery_score", "hrv_rmssd_milli", "resting_heart_rate", "sleep_total_ms", "strain_score"],
    docs_url: "https://developer.whoop.com/docs",
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Cloud database and auth. Replaces localStorage for multi-device sync and persistence.",
    what_it_adds: [
      "Multi-device data sync",
      "Account-based auth (email, OAuth)",
      "Historical data beyond localStorage limits",
      "Row-level security per user",
      "Future multi-user / sharing features",
    ],
    why_it_matters:
      "Without Supabase, data lives only in one browser. With Supabase, Cognix becomes a real product: data persists, syncs, and can be accessed from any device.",
    phase: "v0.2",
    status: "planned",
    oauth_required: false,
    api_complexity: "low",
    estimated_effort: "3-4 days",
    data_fields_unlocked: ["persistent_history", "multi_device", "auth"],
    docs_url: "https://supabase.com/docs",
  },
  {
    id: "claude",
    name: "Claude / OpenAI",
    description: "LLM synthesis layer. Explains deterministic scores in natural language.",
    what_it_adds: [
      "Natural language daily brief",
      "Conversational 'Ask Cognix' interface",
      "Weekly coach report narrative",
      "Contextual experiment interpretation",
    ],
    why_it_matters:
      "The scoring engine produces numbers. The LLM translates them into language you act on. The key principle: deterministic code calculates, LLM explains. Never the other way round.",
    phase: "v0.3",
    status: "planned",
    oauth_required: false,
    api_complexity: "low",
    estimated_effort: "2-3 days",
    data_fields_unlocked: ["natural_language_brief", "ask_cognix", "weekly_report"],
    docs_url: "https://docs.anthropic.com",
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Schedule context. Identifies free time for workout slots and infers cognitive load.",
    what_it_adds: [
      "Real free time blocks for workout planner",
      "Meeting density as cognitive load proxy",
      "Auto-schedule workout slot suggestions",
    ],
    why_it_matters:
      "A 5-meeting day is functionally different from a free day, even if WHOOP says recovery is high. Calendar data makes training recommendations context-aware.",
    phase: "v0.5",
    status: "planned",
    oauth_required: true,
    api_complexity: "medium",
    estimated_effort: "3-4 days",
    data_fields_unlocked: ["free_slots", "meeting_load", "workout_planner"],
    docs_url: "https://developers.google.com/calendar",
  },
  {
    id: "strava",
    name: "Strava",
    description: "Outdoor activity data: running, cycling, MTB. Adds cardio load to training intelligence.",
    what_it_adds: [
      "Run and ride activity imports",
      "Strava suffer score as training load contribution",
      "Distance and elevation tracking",
      "Cardio-specific ACWR calculation",
    ],
    why_it_matters:
      "Manual training logs miss outdoor activity. Strava fills the gap for running and cycling, completing the training load picture.",
    phase: "v0.6",
    status: "planned",
    oauth_required: true,
    api_complexity: "medium",
    estimated_effort: "3-4 days",
    data_fields_unlocked: ["outdoor_activities", "cardio_load", "distance_tracking"],
    docs_url: "https://developers.strava.com",
  },
  {
    id: "weather",
    name: "Madrid Weather",
    description: "Local weather context for hydration and outdoor training adjustments.",
    what_it_adds: [
      "Temperature-adjusted hydration targets",
      "Outdoor training viability flag",
      "Heat/humidity impact on performance",
    ],
    why_it_matters:
      "Madrid summer (>35°C) materially changes hydration needs and outdoor workout recommendations. One API call per morning.",
    phase: "v0.5",
    status: "planned",
    oauth_required: false,
    api_complexity: "low",
    estimated_effort: "1 day",
    data_fields_unlocked: ["hydration_adjustment", "outdoor_flag"],
    docs_url: "https://openweathermap.org/api",
  },
  {
    id: "spotify",
    name: "Spotify",
    description: "Personalised playlist interventions for different training modes.",
    what_it_adds: [
      "Mode-matched playlist recommendations",
      "Pre-workout activation playlist",
      "Recovery and wind-down playlists",
      "Energy level-based queue adjustment",
    ],
    why_it_matters:
      "Music has a measurable effect on training performance and mood. Cognix can use mode and energy score to recommend the right playlist, not just any playlist.",
    phase: "v0.7",
    status: "planned",
    oauth_required: true,
    api_complexity: "medium",
    estimated_effort: "2-3 days",
    data_fields_unlocked: ["playlist_interventions", "mood_music"],
    docs_url: "https://developer.spotify.com/documentation/web-api",
  },
  {
    id: "apple_health",
    name: "Apple Health",
    description: "Fallback data source for HRV, steps, and passive health metrics on non-WHOOP devices.",
    what_it_adds: [
      "Passive HRV estimates",
      "Step count and active energy",
      "Resting heart rate (if tracked)",
    ],
    why_it_matters:
      "Useful for users without WHOOP. HealthKit requires an iOS native layer — web app only option is XML export upload.",
    phase: "v0.6",
    status: "planned",
    oauth_required: false,
    api_complexity: "high",
    estimated_effort: "5+ days (requires iOS native component)",
    data_fields_unlocked: ["passive_hrv", "step_count"],
    docs_url: "https://developer.apple.com/health-fitness/",
  },
  {
    id: "smart_scale",
    name: "Smart Scale (Withings / Garmin)",
    description: "Automated body composition tracking: weight, fat mass, muscle mass.",
    what_it_adds: [
      "Automated weight logging",
      "Body fat % trend",
      "Muscle mass trend",
    ],
    why_it_matters:
      "Removes the friction of manual body metric logging. Withings API is OAuth 2.0 and well-documented.",
    phase: "v0.6",
    status: "planned",
    oauth_required: true,
    api_complexity: "medium",
    estimated_effort: "2-3 days",
    data_fields_unlocked: ["weight_trend", "body_composition"],
    docs_url: "https://developer.withings.com",
  },
  {
    id: "polar",
    name: "Polar H10 / HRV Strap",
    description: "Chest-strap HRV measurement. Higher accuracy than wrist-based devices.",
    what_it_adds: [
      "Validated RMSSD HRV measurement",
      "Breath-by-breath respiratory data",
      "Exercise heart rate zones",
    ],
    why_it_matters:
      "For users without WHOOP, a chest strap provides superior HRV accuracy. Polar API (Polar Access Link) is available. Would need a DeviceProvider abstraction layer.",
    phase: "v0.6",
    status: "planned",
    oauth_required: true,
    api_complexity: "high",
    estimated_effort: "4-5 days",
    data_fields_unlocked: ["validated_hrv", "hr_zones"],
    docs_url: "https://www.polaraccesslink.com/",
  },
]

export function getIntegrationById(id: string): FutureIntegration | undefined {
  return FUTURE_INTEGRATIONS.find((i) => i.id === id)
}

export function getIntegrationsByPhase(phase: string): FutureIntegration[] {
  return FUTURE_INTEGRATIONS.filter((i) => i.phase === phase)
}
