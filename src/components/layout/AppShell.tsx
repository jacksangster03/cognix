"use client"

import React from "react"
import { Sidebar } from "./Sidebar"
import { MobileNav } from "./MobileNav"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile nav */}
        <header className="lg:hidden border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-widest text-zinc-200 uppercase">
            Cognix
          </span>
          <MobileNav />
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
