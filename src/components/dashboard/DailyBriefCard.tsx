"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DailyRecommendation } from "@/lib/types"

interface DailyBriefCardProps {
  recommendation: DailyRecommendation
}

export function DailyBriefCard({ recommendation: rec }: DailyBriefCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between py-3 px-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <CardTitle className="text-sm text-zinc-300 font-medium">Daily Intelligence Brief</CardTitle>
        {expanded ? (
          <ChevronUp size={14} className="text-zinc-500" />
        ) : (
          <ChevronDown size={14} className="text-zinc-500" />
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="px-4 pb-4 space-y-3">
          <BriefSection label="Training" text={rec.training} />
          <BriefSection label="Nutrition" text={rec.nutrition} />
          <BriefSection label="Hydration" text={rec.hydration} />
          <BriefSection label="Caffeine" text={rec.caffeine} />
          <BriefSection label="Supplements" text={rec.supplements} />
          <BriefSection label="Sleep prep" text={rec.sleep} />
          {rec.reasons.length > 0 && (
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Why</span>
              <ul className="mt-1 space-y-0.5">
                {rec.reasons.map((r, i) => (
                  <li key={i} className="text-xs text-zinc-500 flex items-start gap-1.5">
                    <span className="mt-1 w-1 h-1 rounded-full bg-zinc-600 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function BriefSection({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
      <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">{text}</p>
    </div>
  )
}
