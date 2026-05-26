"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { PageHeader } from "@/components/layout/PageHeader"
import { ExperimentCard } from "@/components/experiments/ExperimentCard"
import { loadExperiments, saveExperiments } from "@/lib/storage"
import type { Experiment } from "@/lib/types"

const TEMPLATE_EXPERIMENTS: Experiment[] = [
  {
    id: "exp-caffeine-cutoff",
    name: "Caffeine before 14:00",
    description: "No caffeine after 14:00 for 14 consecutive days.",
    hypothesis: "Consistent early caffeine cutoff will improve sleep performance score by at least 5 points on average.",
    duration_days: 14,
    metric_target: "Sleep performance (WHOOP), sleep quality (check-in)",
    protocol: [
      "No caffeine (coffee, tea, pre-workout) after 14:00",
      "Log caffeine timing in daily check-in",
      "Note sleep quality each morning",
      "Compare sleep performance week 1 vs week 2",
    ],
    status: "idle",
  },
  {
    id: "exp-protein-high",
    name: "Protein Good/High for 14 days",
    description: "Hit protein target (Good or High band) every day for 14 days.",
    hypothesis: "Consistent high protein intake will improve subjective energy and reduce soreness scores.",
    duration_days: 14,
    metric_target: "Energy (check-in), soreness (check-in), subjective score",
    protocol: [
      "Front-load protein: 40-50g at breakfast",
      "Log protein band in daily check-in",
      "Track energy and soreness daily",
      "Compare first and last 7 days",
    ],
    status: "idle",
  },
  {
    id: "exp-hydration",
    name: "Hydration Good for 14 days",
    description: "Log Good hydration every day for 14 days.",
    hypothesis: "Consistent 3L+ hydration will improve energy, mood, and training performance.",
    duration_days: 14,
    metric_target: "Energy (check-in), mood (check-in)",
    protocol: [
      "Start with 500ml water on waking",
      "Drink 1L before lunch",
      "Log hydration band daily",
      "Add 0.5L on training days",
    ],
    status: "idle",
  },
  {
    id: "exp-no-phone-bed",
    name: "No phone before bed",
    description: "No phone or screens 60 minutes before sleep for 14 days.",
    hypothesis: "Removing pre-bed screen exposure will increase deep sleep by at least 10%.",
    duration_days: 14,
    metric_target: "Deep sleep (WHOOP SWS), sleep performance, sleep quality (check-in)",
    protocol: [
      "Set phone to Do Not Disturb at 21:30",
      "Read, walk, or stretch instead",
      "Log sleep quality in morning check-in",
      "Note any nighttime wake-ups",
    ],
    status: "idle",
  },
  {
    id: "exp-zone2",
    name: "Zone 2 twice per week",
    description: "Two Zone 2 cardio sessions per week for 4 weeks.",
    hypothesis: "Regular Zone 2 training will lower resting heart rate by 2-3 bpm over 4 weeks.",
    duration_days: 28,
    metric_target: "Resting HR (WHOOP), cardiovascular recovery score",
    protocol: [
      "2 sessions/week, 30-45 min each",
      "Keep heart rate at 60-70% of max (roughly 125-145 bpm)",
      "Walk, cycle, or treadmill",
      "Log as Cardio session type",
    ],
    status: "idle",
  },
  {
    id: "exp-magnesium",
    name: "Magnesium evening routine",
    description: "400mg magnesium glycinate 30 min before bed every night for 14 days.",
    hypothesis: "Evening magnesium will improve sleep onset, deep sleep, and next-day readiness.",
    duration_days: 14,
    metric_target: "Sleep performance (WHOOP), recovery score, sleep quality (check-in)",
    protocol: [
      "400mg magnesium glycinate at 21:30",
      "Log supplement in daily check-in",
      "Note time taken to fall asleep",
      "Track deep sleep and recovery trend",
    ],
    status: "idle",
  },
]

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([])

  useEffect(() => {
    const stored = loadExperiments()
    if (stored.length === 0) {
      setExperiments(TEMPLATE_EXPERIMENTS)
    } else {
      // Merge stored state with templates (preserve status/dates, use template content)
      const merged = TEMPLATE_EXPERIMENTS.map((tmpl) => {
        const saved = stored.find((s) => s.id === tmpl.id)
        return saved ? { ...tmpl, status: saved.status, started_at: saved.started_at, ended_at: saved.ended_at } : tmpl
      })
      setExperiments(merged)
    }
  }, [])

  function handleStart(id: string) {
    const updated = experiments.map((e) =>
      e.id === id ? { ...e, status: "active" as const, started_at: new Date().toISOString() } : e
    )
    setExperiments(updated)
    saveExperiments(updated)
  }

  function handleStop(id: string) {
    const updated = experiments.map((e) =>
      e.id === id ? { ...e, status: "abandoned" as const, ended_at: new Date().toISOString() } : e
    )
    setExperiments(updated)
    saveExperiments(updated)
  }

  const active = experiments.filter((e) => e.status === "active")
  const idle = experiments.filter((e) => e.status === "idle")

  return (
    <AppShell>
      <PageHeader
        title="Experiments"
        subtitle="Structured self-experiments with measurable hypotheses."
      />
      <div className="px-6 pb-24 lg:pb-8 space-y-4">
        <p className="text-xs text-zinc-600 leading-relaxed">
          Each experiment has a clear hypothesis, protocol, and target metric.
          Run one at a time to isolate the variable.
        </p>

        {active.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Active</p>
            <div className="space-y-3">
              {active.map((e) => (
                <ExperimentCard key={e.id} experiment={e} onStop={handleStop} />
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Available</p>
          <div className="space-y-3">
            {idle.map((e) => (
              <ExperimentCard key={e.id} experiment={e} onStart={handleStart} />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
