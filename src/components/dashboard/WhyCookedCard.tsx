import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DailyRecommendation } from "@/lib/types"

interface WhyCookedCardProps {
  recommendation: DailyRecommendation
}

export function WhyCookedCard({ recommendation: rec }: WhyCookedCardProps) {
  const hasRisk = rec.main_risk !== "No critical flags today."

  return (
    <Card className={`border-zinc-800 ${hasRisk ? "bg-red-950/20" : "bg-zinc-900/50"}`}>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-1.5">
          {hasRisk && <AlertTriangle size={13} className="text-red-400" />}
          <span className={hasRisk ? "text-red-300" : "text-zinc-300"}>
            {hasRisk ? "Why the caution?" : "All clear"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-xs leading-relaxed text-zinc-400">{rec.main_risk}</p>
      </CardContent>
    </Card>
  )
}
