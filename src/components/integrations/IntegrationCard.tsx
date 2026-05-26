import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FutureIntegration } from "@/lib/types"

interface IntegrationCardProps {
  integration: FutureIntegration
}

const complexityColour = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-red-400",
}

export function IntegrationCard({ integration: intg }: IntegrationCardProps) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm text-zinc-200 font-semibold">{intg.name}</CardTitle>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
              {intg.phase}
            </Badge>
            <span className={`text-[10px] font-medium ${complexityColour[intg.api_complexity]}`}>
              {intg.api_complexity} complexity
            </span>
          </div>
        </div>
        <p className="text-xs text-zinc-500 mt-1">{intg.description}</p>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">What it adds</p>
          <ul className="space-y-0.5">
            {intg.what_it_adds.slice(0, 3).map((item) => (
              <li key={item} className="text-xs text-zinc-500 flex items-start gap-1.5">
                <span className="mt-1 w-1 h-1 rounded-full bg-zinc-700 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-600">
          <span>{intg.oauth_required ? "OAuth required" : "No auth needed"}</span>
          <span>{intg.estimated_effort}</span>
        </div>
      </CardContent>
    </Card>
  )
}
