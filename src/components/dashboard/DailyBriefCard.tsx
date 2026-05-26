"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronDown, ChevronUp, Sparkles, RefreshCw, FlaskConical } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { loadCachedBrief, saveCachedBrief } from "@/lib/storage"
import type { DailyRecommendation } from "@/lib/types"
import type { CognixBrief, BriefMetadata, BriefContext, CachedBrief, DataSources } from "@/lib/ai/brief-schema"

interface DailyBriefCardProps {
  recommendation: DailyRecommendation
  briefContext: BriefContext
}

type BriefState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; brief: CognixBrief; metadata: BriefMetadata }
  | { status: "error"; message: string }

function mapRecToBrief(rec: DailyRecommendation): CognixBrief {
  return {
    headline: rec.headline,
    overall_readout: rec.reasons.length > 0
      ? rec.reasons.join(". ") + "."
      : rec.headline,
    training_recommendation: rec.training,
    nutrition_guidance: rec.nutrition,
    hydration_guidance: rec.hydration,
    caffeine_guidance: rec.caffeine,
    supplement_notes: rec.supplements,
    sleep_focus: rec.sleep,
    main_risk: rec.main_risk,
    one_priority: rec.one_priority,
    data_confidence_note: "Using deterministic brief. Generate AI brief for a personalised explanation.",
  }
}

// ─── Demo data notice ─────────────────────────────────────────────────────────

function DemoNotice({ sources }: { sources: DataSources }) {
  const isFullDemo = sources.checkin === "demo" && sources.whoop === "mock"
  const isPartialDemo = sources.checkin === "user" && sources.whoop === "mock"

  if (sources.whoop !== "mock") return null

  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-800/40 bg-amber-950/25 px-3 py-2">
      <FlaskConical size={11} className="text-amber-500/80 flex-shrink-0 mt-0.5" />
      <p className="text-[10px] text-amber-500/80 leading-relaxed">
        {isPartialDemo
          ? "Partial demo data: your manual logs are real, but biometric data (recovery, HRV, sleep) is mock until a real wearable is connected."
          : isFullDemo
            ? "Demo data active: this brief uses mock WHOOP-style biometrics. Connect a real wearable to get a live physiological reading."
            : "Biometric data is currently mock. Connect a real wearable in Integrations for a live reading."}
      </p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DailyBriefCard({ recommendation: rec, briefContext }: DailyBriefCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [briefState, setBriefState] = useState<BriefState>({ status: "idle" })

  const today = briefContext.date

  useEffect(() => {
    const cached = loadCachedBrief(today)
    if (cached) {
      setBriefState({
        status: "ready",
        brief: cached.brief,
        metadata: { ...cached.metadata, cached: true },
      })
    }
  }, [today])

  const generateBrief = useCallback(async () => {
    setBriefState({ status: "loading" })
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(briefContext),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      const data = await res.json() as { brief: CognixBrief; metadata: BriefMetadata }
      const toCache: CachedBrief = {
        date: today,
        brief: data.brief,
        metadata: data.metadata,
        data_sources: briefContext.data_sources,
        is_demo: briefContext.is_demo,
      }
      saveCachedBrief(toCache)
      setBriefState({ status: "ready", brief: data.brief, metadata: data.metadata })
    } catch (err) {
      setBriefState({ status: "error", message: String(err) })
    }
  }, [briefContext, today])

  const displayBrief: CognixBrief =
    briefState.status === "ready" ? briefState.brief : mapRecToBrief(rec)

  const isLLM = briefState.status === "ready" && briefState.metadata.provider !== "deterministic"
  const isCached = briefState.status === "ready" && briefState.metadata.cached
  const isFallback = briefState.status === "ready" && briefState.metadata.fallback_used

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between py-3 px-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm text-zinc-300 font-medium">Daily Intelligence Brief</CardTitle>
          {isLLM && !isFallback && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-950/60 border border-violet-700/40 text-violet-400 font-medium">
              AI
            </span>
          )}
          {briefContext.data_sources.whoop === "mock" && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-800/40 text-amber-500/80 font-medium flex items-center gap-1">
              <FlaskConical size={8} />
              mock data
            </span>
          )}
          {isCached && (
            <span className="text-[9px] text-zinc-600">cached</span>
          )}
        </div>
        {expanded
          ? <ChevronUp size={14} className="text-zinc-500" />
          : <ChevronDown size={14} className="text-zinc-500" />}
      </CardHeader>

      {expanded && (
        <CardContent className="px-4 pb-4 space-y-3">
          {/* Demo data notice */}
          <DemoNotice sources={briefContext.data_sources} />

          {/* Generate button */}
          {briefState.status === "idle" || briefState.status === "error" ? (
            <div className="space-y-1.5">
              <button
                onClick={generateBrief}
                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                <Sparkles size={11} />
                Generate AI brief
              </button>
              {briefState.status === "error" && (
                <p className="text-[10px] text-red-500">{briefState.message}</p>
              )}
            </div>
          ) : briefState.status === "loading" ? (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 animate-pulse">
              <RefreshCw size={11} className="animate-spin" />
              Generating brief...
            </div>
          ) : (
            <button
              onClick={generateBrief}
              className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <RefreshCw size={9} />
              Regenerate
            </button>
          )}

          <BriefSection label="Today" text={displayBrief.headline} />
          <BriefSection label="Readout" text={displayBrief.overall_readout} />
          <BriefSection label="Training" text={displayBrief.training_recommendation} />
          <BriefSection label="Nutrition" text={displayBrief.nutrition_guidance} />
          <BriefSection label="Hydration" text={displayBrief.hydration_guidance} />
          <BriefSection label="Caffeine" text={displayBrief.caffeine_guidance} />
          <BriefSection label="Supplements" text={displayBrief.supplement_notes} />
          <BriefSection label="Sleep prep" text={displayBrief.sleep_focus} />
          <BriefSection label="Main risk" text={displayBrief.main_risk} />
          <BriefSection label="One priority" text={displayBrief.one_priority} highlight />
          <BriefSection label="Data note" text={displayBrief.data_confidence_note} dim />

          {briefState.status === "ready" && (
            <p className="text-[9px] text-zinc-700">
              {briefState.metadata.provider}
              {briefState.metadata.model !== "deterministic-v1" ? ` / ${briefState.metadata.model}` : ""}
              {isFallback ? " (fallback)" : ""}
              {isCached ? " / cached" : ""}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function BriefSection({
  label,
  text,
  highlight = false,
  dim = false,
}: {
  label: string
  text: string
  highlight?: boolean
  dim?: boolean
}) {
  return (
    <div>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
      <p className={`text-xs mt-0.5 leading-relaxed ${highlight ? "text-zinc-100 font-medium" : dim ? "text-zinc-600" : "text-zinc-300"}`}>
        {text}
      </p>
    </div>
  )
}
