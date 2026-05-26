import Link from "next/link"
import { ClipboardList, Dumbbell, Beaker } from "lucide-react"
import { cn } from "@/lib/utils"

function ActionLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-700 text-zinc-300 bg-transparent hover:bg-zinc-800 transition-colors",
        className
      )}
    >
      {children}
    </Link>
  )
}

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionLink href="/checkin">
        <ClipboardList size={13} />
        Log Check-in
      </ActionLink>
      <ActionLink href="/training">
        <Dumbbell size={13} />
        Log Session
      </ActionLink>
      <ActionLink href="/experiments">
        <Beaker size={13} />
        Experiments
      </ActionLink>
    </div>
  )
}
