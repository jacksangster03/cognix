import { cn } from "@/lib/utils"

interface MetricTileProps {
  label: string
  value: string | number
  unit?: string
  subtext?: string
  status?: "good" | "moderate" | "poor" | "neutral"
  compact?: boolean
}

const statusColour = {
  good: "text-emerald-400",
  moderate: "text-amber-400",
  poor: "text-red-400",
  neutral: "text-zinc-300",
}

export function MetricTile({
  label,
  value,
  unit,
  subtext,
  status = "neutral",
  compact = false,
}: MetricTileProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800 bg-zinc-900/50 flex flex-col",
        compact ? "px-3 py-3" : "px-4 py-4"
      )}
    >
      <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
        {label}
      </span>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={cn("font-semibold", compact ? "text-xl" : "text-2xl", statusColour[status])}>
          {value}
        </span>
        {unit && (
          <span className="text-xs text-zinc-600">{unit}</span>
        )}
      </div>
      {subtext && (
        <span className="text-[10px] text-zinc-600 mt-0.5 leading-tight">{subtext}</span>
      )}
    </div>
  )
}
