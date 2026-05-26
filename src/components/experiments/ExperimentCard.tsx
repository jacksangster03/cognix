"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Experiment } from "@/lib/types"

interface ExperimentCardProps {
  experiment: Experiment
  onStart?: (id: string) => void
  onStop?: (id: string) => void
}

const statusColour = {
  idle: "text-zinc-500 border-zinc-700",
  active: "text-emerald-400 border-emerald-800",
  completed: "text-sky-400 border-sky-800",
  abandoned: "text-zinc-600 border-zinc-800",
}

export function ExperimentCard({ experiment: exp, onStart, onStop }: ExperimentCardProps) {
  const isActive = exp.status === "active"

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm text-zinc-200 font-semibold">{exp.name}</CardTitle>
          <Badge variant="outline" className={`text-[10px] capitalize ${statusColour[exp.status]}`}>
            {exp.status}
          </Badge>
        </div>
        <p className="text-xs text-zinc-500 mt-1">{exp.description}</p>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        <div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Hypothesis</p>
          <p className="text-xs text-zinc-500 italic mt-0.5">{exp.hypothesis}</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-zinc-600">
          <span>{exp.duration_days} days</span>
          <span>Track: {exp.metric_target}</span>
        </div>
        <div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Protocol</p>
          <ul className="space-y-0.5">
            {exp.protocol.map((step, i) => (
              <li key={i} className="text-xs text-zinc-500 flex items-start gap-1.5">
                <span className="text-zinc-700 font-mono">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
        {exp.status === "idle" && onStart && (
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={() => onStart(exp.id)}
          >
            Start experiment
          </Button>
        )}
        {isActive && onStop && (
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2 border-red-900 text-red-400 hover:bg-red-950/30"
            onClick={() => onStop(exp.id)}
          >
            Stop experiment
          </Button>
        )}
        {isActive && exp.started_at && (
          <p className="text-[10px] text-zinc-600">
            Started: {new Date(exp.started_at).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
