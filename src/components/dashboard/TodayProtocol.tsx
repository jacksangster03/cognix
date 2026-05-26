import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DailyRecommendation } from "@/lib/types"

interface TodayProtocolProps {
  recommendation: DailyRecommendation
}

export function TodayProtocol({ recommendation: rec }: TodayProtocolProps) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm text-zinc-300 font-medium">Today&apos;s Protocol</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* One priority */}
        <div className="rounded-md bg-zinc-800/60 border border-zinc-700/50 px-3 py-2.5 mb-3">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">One priority</span>
          <p className="text-sm text-zinc-100 mt-0.5 font-medium">{rec.one_priority}</p>
        </div>

        {/* Protocol items */}
        <div className="space-y-2">
          <ProtocolItem icon="🏋️" label="Training" value={rec.mode === "Rest" ? "Rest day" : rec.mode === "Deload" ? "Deload" : "Train"} />
          <ProtocolItem icon="🥩" label="Protein focus" value={rec.nutrition.split(".")[0]} />
          <ProtocolItem icon="💧" label="Hydration" value={rec.hydration.split(".")[0]} />
          <ProtocolItem icon="☕" label="Caffeine" value={rec.caffeine.split(".")[0]} />
          <ProtocolItem icon="🌙" label="Sleep prep" value={rec.sleep.split(".")[0]} />
        </div>
      </CardContent>
    </Card>
  )
}

function ProtocolItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-sm mt-0.5">{icon}</span>
      <div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
        <p className="text-xs text-zinc-400 leading-snug">{value}</p>
      </div>
    </div>
  )
}
