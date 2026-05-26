import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { DataConfidence } from "@/lib/types"

interface DataConfidenceCardProps {
  confidence: DataConfidence
}

export function DataConfidenceCard({ confidence }: DataConfidenceCardProps) {
  const colourClass =
    confidence.overall >= 80 ? "text-emerald-400"
    : confidence.overall >= 50 ? "text-amber-400"
    : "text-red-400"

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm text-zinc-300 font-medium">Data Confidence</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-xl font-semibold ${colourClass}`}>
            {confidence.confidence_label}
          </span>
          <span className="text-xs text-zinc-500">{confidence.overall}%</span>
        </div>
        <Progress value={confidence.overall} className="h-1.5 bg-zinc-800" />

        {/* Signal status */}
        <div className="space-y-1.5">
          <SignalRow label="WHOOP data" ok={confidence.whoop_connected} />
          <SignalRow label="Today's check-in" ok={confidence.has_checkin_today} />
          <SignalRow label="Training history" ok={confidence.has_training_history} />
          <SignalRow label="User settings" ok={confidence.has_settings} />
        </div>

        {confidence.missing_signals.length > 0 && (
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Missing</p>
            {confidence.missing_signals.map((s) => (
              <p key={s} className="text-[11px] text-zinc-600">{s}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SignalRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-xs font-medium ${ok ? "text-emerald-400" : "text-zinc-600"}`}>
        {ok ? "✓" : "—"}
      </span>
    </div>
  )
}
