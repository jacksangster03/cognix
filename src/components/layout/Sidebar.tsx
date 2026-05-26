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
import { APP_META } from "@/lib/constants"

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

export function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col w-full bg-zinc-950 border-r border-zinc-800 px-3 py-6">
      {/* Logo */}
      <div className="px-3 mb-8">
        <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
          {APP_META.name}
        </span>
        <p className="text-[10px] text-zinc-600 mt-0.5 leading-tight">{APP_META.version}</p>
      </div>

      {/* Nav items */}
      <ul className="space-y-0.5 flex-1">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Bottom disclaimer */}
      <p className="px-3 text-[10px] text-zinc-700 leading-tight">
        Personal performance tool. Not medical advice.
      </p>
    </nav>
  )
}
