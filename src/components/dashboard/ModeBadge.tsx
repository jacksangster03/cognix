import { cn } from "@/lib/utils"
import { MODE_CONFIG } from "@/lib/constants"
import type { Mode } from "@/lib/types"

interface ModeBadgeProps {
  mode: Mode
  size?: "sm" | "md" | "lg"
}

export function ModeBadge({ mode, size = "md" }: ModeBadgeProps) {
  const conf = MODE_CONFIG[mode]

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full border tracking-wide",
        conf.colour,
        conf.bg,
        conf.border,
        size === "sm" && "text-xs px-2 py-0.5",
        size === "md" && "text-sm px-3 py-1",
        size === "lg" && "text-base px-4 py-1.5",
      )}
    >
      {mode}
    </span>
  )
}
