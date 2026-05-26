"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardList,
  Dumbbell,
  CalendarClock,
  TrendingUp,
  FlaskConical,
  Puzzle,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/checkin", label: "Check-in", Icon: ClipboardList },
  { href: "/training", label: "Training", Icon: Dumbbell },
  { href: "/planner", label: "Planner", Icon: CalendarClock },
  { href: "/progress", label: "Progress", Icon: TrendingUp },
  { href: "/experiments", label: "Experiments", Icon: FlaskConical },
  { href: "/integrations", label: "Integrations", Icon: Puzzle },
  { href: "/settings", label: "Settings", Icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-zinc-950 border-t border-zinc-800 flex justify-around py-2">
      {NAV.slice(0, 5).map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded text-[10px] transition-colors",
              active ? "text-zinc-100" : "text-zinc-600 hover:text-zinc-400"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        )
      })}
    </div>
  )
}
