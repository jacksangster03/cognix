"use client"

import { useMemo } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { TrendStrip } from "@/components/dashboard/TrendStrip"
import { MOCK_WHOOP_HISTORY } from "@/lib/mock-whoop"
import { MOCK_CHECKIN_HISTORY } from "@/lib/mock-history"
import { loadDemoMode } from "@/lib/storage"

export default function ProgressPage() {
  const { trendRecovery, trendHRV, trendSleep, trendCaffeine, trendProtein } = useMemo(() => {
    const dm = loadDemoMode()
    const history = dm ? MOCK_WHOOP_HISTORY : []
    const checkins = dm ? MOCK_CHECKIN_HISTORY : []

    const caffeineScoreMap: Record<string, number> = {
      "None": 100, "Before 12": 95, "12 to 14": 75, "14 to 16": 40, "After 16": 10,
    }
    const proteinScoreMap: Record<string, number> = {
      "Low": 25, "Okay": 60, "Good": 85, "High": 95, "Unknown": 50,
    }

    return {
      trendRecovery: history.map((d) => ({ date: d.date, value: d.recovery_score })),
      trendHRV: history.map((d) => ({ date: d.date, value: Math.round(d.hrv_rmssd_milli) })),
      trendSleep: history.map((d) => ({ date: d.date, value: d.sleep_performance_pct })),
      trendCaffeine: checkins.map((c) => ({
        date: c.date,
        value: caffeineScoreMap[c.last_caffeine_time] ?? 50,
      })),
      trendProtein: checkins.map((c) => ({
        date: c.date,
        value: proteinScoreMap[c.protein] ?? 50,
      })),
    }
  }, [])

  return (
    <AppShell>
      <PageHeader
        title="Progress"
        subtitle="Signal trends over time. Accuracy improves as data accumulates."
      />
      <div className="px-6 pb-24 lg:pb-8 space-y-4">

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4 space-y-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">30-day biometric trends</p>
            <TrendStrip data={trendRecovery} label="Recovery score" colour="#34d399" referenceValue={67} />
            <TrendStrip data={trendHRV} label="HRV (ms)" colour="#60a5fa" />
            <TrendStrip data={trendSleep} label="Sleep performance" colour="#a78bfa" referenceValue={80} />
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4 space-y-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Behavioural compliance</p>
            <TrendStrip data={trendCaffeine} label="Caffeine timing score" colour="#fbbf24" />
            <TrendStrip data={trendProtein} label="Protein adherence" colour="#f97316" />
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Coming in v0.3+</p>
            <ul className="space-y-1.5">
              {[
                "Training load trend (ACWR over time)",
                "Supplement compliance tracking (days hit / target)",
                "Correlation engine: caffeine timing vs sleep performance",
                "Experiment outcome tracking",
                "Body weight trend (once body metrics are logged)",
                "Weekly coach summary report",
              ].map((item, i) => (
                <li key={i} className="text-xs text-zinc-600 flex items-start gap-1.5">
                  <span className="mt-1 w-1 h-1 rounded-full bg-zinc-700 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
