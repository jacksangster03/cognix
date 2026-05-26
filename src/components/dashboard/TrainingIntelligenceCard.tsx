"use client"

import { Dumbbell } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TrainingIntelligence } from "@/lib/ai/brief-schema"

interface Props {
  intelligence: TrainingIntelligence
}

export function TrainingIntelligenceCard({ intelligence: t }: Props) {
  const { coverage_score, missing_groups, overrepresented_groups, top_deficit, conflicts_today, days_since_last_session, weekly_session_count } = t

  const scoreColour =
    coverage_score >= 70 ? "text-emerald-400"
    : coverage_score >= 40 ? "text-amber-400"
    : "text-zinc-500"

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Dumbbell size={12} className="text-zinc-500" />
          <CardTitle className="text-sm text-zinc-300 font-medium">Training Intelligence</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className={`text-lg font-semibold ${scoreColour}`}>{coverage_score}%</p>
            <p className="text-[10px] text-zinc-600">Coverage</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-zinc-200">{weekly_session_count}</p>
            <p className="text-[10px] text-zinc-600">Sessions (7d)</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-zinc-200">
              {days_since_last_session >= 999 ? "—" : `${days_since_last_session}d`}
            </p>
            <p className="text-[10px] text-zinc-600">Since last</p>
          </div>
        </div>

        {/* Conflicts */}
        {conflicts_today.length > 0 && (
          <div className="text-[10px] text-amber-500/80 bg-amber-950/25 border border-amber-800/30 rounded px-2.5 py-1.5">
            <span className="font-medium">Overlap: </span>
            {conflicts_today.slice(0, 3).map((c) => `${c.group} (${c.hours_ago}h ago)`).join(", ")} trained recently.
          </div>
        )}

        {/* Top deficit */}
        {top_deficit && (
          <div className="space-y-0.5">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Priority this week</p>
            <p className="text-xs text-zinc-300">{top_deficit.suggestion}</p>
            <p className="text-[10px] text-zinc-600">{top_deficit.group} is {top_deficit.deficit_sets} sets below target</p>
          </div>
        )}

        {/* Missing groups */}
        {missing_groups.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Undertrained this week</p>
            <div className="flex flex-wrap gap-1">
              {missing_groups.map((g) => (
                <span key={g} className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-500">
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Overrepresented */}
        {overrepresented_groups.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">High volume — consider deload</p>
            <div className="flex flex-wrap gap-1">
              {overrepresented_groups.map((g) => (
                <span key={g} className="text-[10px] px-1.5 py-0.5 rounded border border-amber-800/40 text-amber-500/70">
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}

        {coverage_score >= 70 && missing_groups.length === 0 && conflicts_today.length === 0 && (
          <p className="text-[10px] text-emerald-400/70">Weekly coverage on track. Keep it up.</p>
        )}
      </CardContent>
    </Card>
  )
}
