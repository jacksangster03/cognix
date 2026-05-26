import type { MockWhoopDay } from "./types"

// ─── Mock WHOOP history (30 days) ─────────────────────────────────────────────
// Used when demo mode is on or no real WHOOP connection exists.
// Each value is realistic for a healthy 25-year-old male (80kg, moderate training).
// Replace with real WHOOP OAuth data in v0.4.

function isoDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split("T")[0]
}

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10
}

function generateMockDay(daysAgo: number, baseHRV = 58, baseRHR = 52): MockWhoopDay {
  const hrv = rand(baseHRV * 0.75, baseHRV * 1.25)
  const rhr = rand(baseRHR * 0.92, baseRHR * 1.10)
  const recovery = Math.round(
    Math.min(99, Math.max(1,
      ((hrv / baseHRV) * 50) + ((baseRHR / rhr) * 30) + rand(-10, 15)
    ))
  )
  const sleepTotal = rand(5.5, 8.5) * 3600000
  const sleepPerf = Math.round(rand(65, 95))

  return {
    date: isoDate(daysAgo),
    recovery_score: recovery,
    hrv_rmssd_milli: hrv,
    hrv_30d_mean: baseHRV,
    resting_heart_rate: rhr,
    rhr_30d_mean: baseRHR,
    sleep_total_ms: sleepTotal,
    sleep_rem_ms: sleepTotal * 0.22,
    sleep_sws_ms: sleepTotal * 0.18,
    sleep_light_ms: sleepTotal * 0.50,
    sleep_awake_ms: sleepTotal * 0.10,
    sleep_performance_pct: sleepPerf,
    sleep_consistency_pct: rand(55, 90),
    sleep_efficiency_pct: rand(78, 96),
    strain_score: rand(6, 16),
    kilojoules: rand(1500, 3500),
    score_state: "SCORED",
    respiratory_rate: rand(14, 18),
    spo2_pct: rand(96, 99),
    skin_temp_celsius: rand(33.5, 36.0),
  }
}

// Deterministic seed for reproducible demo (seeded off day index, not Math.random)
const SEED_HRV = 58
const SEED_RHR = 52

export const MOCK_WHOOP_HISTORY: MockWhoopDay[] = Array.from(
  { length: 30 },
  (_, i) => generateMockDay(29 - i, SEED_HRV, SEED_RHR)
)

export function getTodayMockWhoop(): MockWhoopDay {
  return MOCK_WHOOP_HISTORY[MOCK_WHOOP_HISTORY.length - 1]
}

export function getMockWhoopForDate(date: string): MockWhoopDay | undefined {
  return MOCK_WHOOP_HISTORY.find((d) => d.date === date)
}

export function getMockHRVBaseline(): number {
  const vals = MOCK_WHOOP_HISTORY.map((d) => d.hrv_rmssd_milli)
  return vals.reduce((a, b) => a + b, 0) / vals.length
}
