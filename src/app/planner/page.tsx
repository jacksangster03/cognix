"use client"

import { useMemo } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { loadSettings, loadTodayCheckIn, loadRecentSessions, loadDemoMode } from "@/lib/storage"
import { MOCK_TRAINING_HISTORY } from "@/lib/mock-history"
import { getTodayMockWhoop } from "@/lib/mock-whoop"
import { calculateReadinessScores, determineMode } from "@/lib/scoring"
import { findBestWorkoutSlot, formatHour, MOCK_CALENDAR_BLOCKS } from "@/lib/planner"
import { DEFAULT_SETTINGS } from "@/lib/constants"

const PREFERRED_TIME_MAP: Record<string, number> = {
  morning: 8,
  lunch: 12,
  afternoon: 15,
  evening: 18,
}

export default function PlannerPage() {
  const { settings, mode, slot } = useMemo(() => {
    const dm = loadDemoMode()
    const s = loadSettings()
    const settings = s.name ? s : DEFAULT_SETTINGS
    const c = loadTodayCheckIn()
    const sessions = dm ? MOCK_TRAINING_HISTORY : loadRecentSessions(28)
    const whoop = dm ? getTodayMockWhoop() : null

    const scores = calculateReadinessScores(whoop, c, sessions, !!settings.name, settings.caffeine_cutoff_hour)
    const mode = determineMode(scores, c)
    const preferredHour = PREFERRED_TIME_MAP[settings.preferred_training_time] ?? 18
    const slot = findBestWorkoutSlot(mode, preferredHour, 60)

    return { settings, mode, slot }
  }, [])

  return (
    <AppShell>
      <PageHeader
        title="Workout Planner"
        subtitle="Best training slot based on today's readiness and schedule."
      />
      <div className="px-6 pb-24 lg:pb-8 space-y-4">

        {/* Recommendation */}
        {slot ? (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Recommended slot</p>
                <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px]">
                  Score: {slot.score}/100
                </Badge>
              </div>

              <div className="rounded-md bg-zinc-800/60 border border-zinc-700/50 px-3 py-3">
                <p className="text-xl font-semibold text-zinc-100">
                  {formatHour(slot.start_hour)} – {formatHour(slot.end_hour)}
                </p>
                <p className="text-sm text-zinc-400 mt-0.5">
                  {slot.recommended_session_type} · {slot.recommended_duration_minutes} min
                </p>
              </div>

              <p className="text-xs text-zinc-500 leading-relaxed">{slot.rationale}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <p className="text-sm text-zinc-500">No suitable free slots found in today&apos;s schedule.</p>
            </CardContent>
          </Card>
        )}

        {/* Today's schedule */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4 space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Today&apos;s schedule (mock)</p>
            <p className="text-[10px] text-zinc-600 mb-3">
              Replace with Google Calendar in v0.5.
            </p>
            <div className="space-y-1.5">
              {MOCK_CALENDAR_BLOCKS.map((block, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-xs ${
                    block.type === "free"
                      ? "border border-emerald-900/50 bg-emerald-950/20 text-emerald-400"
                      : block.type === "social"
                      ? "border border-zinc-700/50 bg-zinc-800/40 text-zinc-400"
                      : "border border-zinc-800/50 bg-zinc-900/30 text-zinc-500"
                  }`}
                >
                  <span>{block.label}</span>
                  <span className="font-mono text-[10px]">
                    {formatHour(block.start_hour)} – {formatHour(block.end_hour)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">How this works</p>
            <ul className="space-y-1.5">
              {[
                "Free slots are scored based on your preferred training time, duration available, and today's mode.",
                "Slots after 20:00 are penalised (interferes with sleep wind-down).",
                `Today's mode is ${mode}. This affects the recommended session type and duration.`,
                "In v0.5, this will use real Google Calendar data.",
              ].map((note, i) => (
                <li key={i} className="text-xs text-zinc-500 flex items-start gap-1.5">
                  <span className="mt-1 w-1 h-1 rounded-full bg-zinc-700 flex-shrink-0" />
                  {note}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
