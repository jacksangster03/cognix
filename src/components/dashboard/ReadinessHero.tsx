"use client"

import { cn } from "@/lib/utils"
import { FlaskConical } from "lucide-react"
import { ModeBadge } from "./ModeBadge"
import { APP_META } from "@/lib/constants"
import type { ReadinessScores, Mode } from "@/lib/types"
import type { DataSources } from "@/lib/ai/brief-schema"

interface ReadinessHeroProps {
  scores: ReadinessScores
  mode: Mode
  headline: string
  isDemo?: boolean
  dataSources?: DataSources
}

function scoreColour(score: number): string {
  if (score >= 67) return "text-emerald-400"
  if (score >= 34) return "text-amber-400"
  return "text-red-400"
}

function scoreRingColour(score: number): string {
  if (score >= 67) return "stroke-emerald-400"
  if (score >= 34) return "stroke-amber-400"
  return "stroke-red-400"
}

function ScoreRing({ score }: { score: number }) {
  const r = 44
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference

  return (
    <svg width="120" height="120" className="-rotate-90">
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        className="text-zinc-800"
      />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={cn("transition-all duration-700", scoreRingColour(score))}
      />
    </svg>
  )
}

export function ReadinessHero({ scores, mode, headline, isDemo, dataSources }: ReadinessHeroProps) {
  const mockBiometrics = dataSources?.whoop === "mock"
  const realCheckin = dataSources?.checkin === "user"

  return (
    <div className="px-6 py-6 border-b border-zinc-800">
      {/* Title row */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-sm font-semibold tracking-widest text-zinc-400 uppercase">
          {APP_META.name}
        </h1>
        {mockBiometrics ? (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-amber-800/50 text-amber-500/70 bg-amber-950/20">
            <FlaskConical size={9} />
            {realCheckin ? "manual + mock biometrics" : "demo mode"}
          </span>
        ) : isDemo ? (
          <span className="text-[10px] px-2 py-0.5 rounded border border-zinc-700 text-zinc-500">
            Demo mode
          </span>
        ) : null}
      </div>
      <p className="text-xs text-zinc-600 mb-5">{APP_META.tagline}</p>

      {/* Score + mode row */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <ScoreRing score={scores.overall} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-2xl font-bold", scoreColour(scores.overall))}>
              {scores.overall}
            </span>
            <span className="text-[9px] text-zinc-600 uppercase tracking-wider">readiness</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <ModeBadge mode={mode} size="lg" />
          <p className="text-sm text-zinc-400 max-w-xs leading-snug">{headline}</p>
        </div>
      </div>
    </div>
  )
}
