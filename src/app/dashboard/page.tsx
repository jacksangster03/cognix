"use client"

import { useMemo } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { PageHeader } from "@/components/layout/PageHeader"
import { ReadinessHero } from "@/components/dashboard/ReadinessHero"
import { MetricTile } from "@/components/dashboard/MetricTile"
import { DailyBriefCard } from "@/components/dashboard/DailyBriefCard"
import { TodayProtocol } from "@/components/dashboard/TodayProtocol"
import { WhyCookedCard } from "@/components/dashboard/WhyCookedCard"
import { DataConfidenceCard } from "@/components/dashboard/DataConfidenceCard"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { TrendStrip } from "@/components/dashboard/TrendStrip"
import { getTodayMockWhoop, MOCK_WHOOP_HISTORY } from "@/lib/mock-whoop"
import { MOCK_CHECKIN_HISTORY, MOCK_TRAINING_HISTORY } from "@/lib/mock-history"
import { calculateReadinessScores, determineMode } from "@/lib/scoring"
import { buildDailyRecommendation } from "@/lib/recommendations"
import { buildConfidence } from "@/lib/confidence"
import { DEFAULT_SETTINGS } from "@/lib/constants"
import { loadSettings, loadTodayCheckIn, loadRecentSessions, loadDemoMode } from "@/lib/storage"
import { buildBriefContext, getDataStateLabel } from "@/lib/ai/build-brief-context"
import { FlaskConical } from "lucide-react"

function msToHours(ms: number): string {
  return (ms / 3600000).toFixed(1)
}

function scoreStatus(score: number): "good" | "moderate" | "poor" {
  if (score >= 67) return "good"
  if (score >= 34) return "moderate"
  return "poor"
}

export default function DashboardPage() {
  const { settings, demoMode, whoop, checkin, sessions, checkinFromDemo, sessionsFromDemo } = useMemo(() => {
    const dm = loadDemoMode()
    const s = loadSettings()
    const c = loadTodayCheckIn()
    const sess = loadRecentSessions(28)

    const usingMockCheckin = dm
    const usingMockSessions = dm && sess.length === 0

    return {
      settings: s.name ? s : DEFAULT_SETTINGS,
      demoMode: dm,
      whoop: dm ? getTodayMockWhoop() : null,
      checkin: dm ? (MOCK_CHECKIN_HISTORY[MOCK_CHECKIN_HISTORY.length - 1] ?? c) : c,
      sessions: usingMockSessions ? MOCK_TRAINING_HISTORY : sess,
      checkinFromDemo: usingMockCheckin,
      sessionsFromDemo: usingMockSessions,
    }
  }, [])

  const scores = calculateReadinessScores(
    whoop,
    checkin,
    sessions,
    !!settings.name,
    settings.caffeine_cutoff_hour,
  )

  const mode = determineMode(scores, checkin)
  const recommendation = buildDailyRecommendation(scores, checkin, whoop, sessions, settings)
  const confidence = buildConfidence(whoop, checkin, sessions, !!settings.name)

  const todayISO = new Date().toISOString().split("T")[0]
  const briefContext = buildBriefContext(todayISO, scores, checkin, whoop, sessions, settings, {
    isDemoMode: demoMode,
    whoopIsReal: false,   // flip to true in v0.4 when WHOOP OAuth is connected
    checkinFromDemo,
    sessionsFromDemo,
  })

  // Build trend data from mock history
  const trendData = MOCK_WHOOP_HISTORY.slice(-14).map((d) => ({
    date: d.date,
    recovery: d.recovery_score,
    hrv: Math.round(d.hrv_rmssd_milli),
    sleep: d.sleep_performance_pct,
  }))

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <AppShell>
      <ReadinessHero
        scores={scores}
        mode={mode}
        headline={recommendation.headline}
        provenance={briefContext.provenance}
      />

      <div className="px-6 py-4 space-y-5 pb-24 lg:pb-6">
        <PageHeader
          title={today}
          subtitle={`${settings.name ? `Hi ${settings.name}.` : ""} Here is your daily readiness report.`}
        />

        {/* Data source notice */}
        {(briefContext.provenance.usesMockBiometrics || briefContext.provenance.usesDemoHistory) && (() => {
          const p = briefContext.provenance
          const label = getDataStateLabel(p)
          let detail: string
          if (p.isDemoMode) {
            detail = "Demo mode: check-in history, training sessions and biometric readings are all seeded demo data. Go to Settings to use your own data."
          } else if (p.usesDemoHistory && p.usesMockBiometrics) {
            detail = "Demo history and mock biometrics: session and check-in data are examples; WHOOP readings are simulated."
          } else if (p.usesMockBiometrics && !p.usesDemoHistory) {
            detail = "Your check-ins and sessions are real. Recovery, HRV and sleep readings are simulated until a wearable is connected."
          } else {
            detail = label
          }
          return (
            <div className="flex items-start gap-1.5 text-[10px] text-amber-500/80 bg-amber-950/30 border border-amber-800/40 rounded-md px-2.5 py-1.5">
              <FlaskConical size={11} className="flex-shrink-0 mt-0.5" />
              <span>{detail}</span>
            </div>
          )
        })()}

        {/* Metric tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <MetricTile
            label="Recovery"
            value={whoop?.recovery_score ?? "—"}
            unit="%"
            subtext="WHOOP score"
            status={whoop ? scoreStatus(whoop.recovery_score) : "neutral"}
          />
          <MetricTile
            label="HRV"
            value={whoop ? Math.round(whoop.hrv_rmssd_milli) : "—"}
            unit="ms"
            subtext={whoop ? `Baseline ${Math.round(whoop.hrv_30d_mean)}ms` : "No data"}
            status={
              whoop
                ? whoop.hrv_rmssd_milli >= whoop.hrv_30d_mean * 0.95
                  ? "good"
                  : whoop.hrv_rmssd_milli >= whoop.hrv_30d_mean * 0.80
                  ? "moderate"
                  : "poor"
                : "neutral"
            }
          />
          <MetricTile
            label="Sleep"
            value={whoop ? msToHours(whoop.sleep_total_ms) : "—"}
            unit="h"
            subtext={whoop ? `${whoop.sleep_performance_pct}% performance` : "No data"}
            status={whoop ? scoreStatus(whoop.sleep_performance_pct) : "neutral"}
          />
          <MetricTile
            label="Strain"
            value={whoop ? whoop.strain_score.toFixed(1) : "—"}
            unit="/21"
            subtext="Yesterday"
            status="neutral"
          />
          <MetricTile
            label="Protein"
            value={checkin?.protein ?? "—"}
            subtext="Rough band"
            status={
              checkin?.protein === "Good" || checkin?.protein === "High" ? "good"
              : checkin?.protein === "Okay" ? "moderate"
              : checkin?.protein === "Low" ? "poor"
              : "neutral"
            }
          />
          <MetricTile
            label="Caffeine risk"
            value={scores.caffeine}
            unit="/100"
            subtext="Sleep impact score"
            status={scoreStatus(scores.caffeine)}
          />
        </div>

        {/* Quick actions */}
        <div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Quick actions</p>
          <QuickActions />
        </div>

        {/* Brief + protocol */}
        <DailyBriefCard recommendation={recommendation} briefContext={briefContext} />
        <TodayProtocol recommendation={recommendation} />
        <WhyCookedCard recommendation={recommendation} />

        {/* Trends */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-4 space-y-4">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">7-day trends</p>
          <TrendStrip
            data={trendData.map((d) => ({ date: d.date, value: d.recovery }))}
            label="Recovery"
            colour="#34d399"
          />
          <TrendStrip
            data={trendData.map((d) => ({ date: d.date, value: d.hrv }))}
            label="HRV (ms)"
            colour="#60a5fa"
          />
          <TrendStrip
            data={trendData.map((d) => ({ date: d.date, value: d.sleep }))}
            label="Sleep performance"
            colour="#a78bfa"
          />
        </div>

        {/* Data confidence */}
        <DataConfidenceCard confidence={confidence} />
      </div>
    </AppShell>
  )
}
