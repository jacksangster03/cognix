"use client"

import { useState, useMemo } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { saveTrainingSession, loadTrainingSessions, loadDemoMode } from "@/lib/storage"
import { MOCK_TRAINING_HISTORY } from "@/lib/mock-history"
import { calculateTrainingLoad, getRecentSessions, findMissingThisWeek, calculateWeeklyMuscleCoverage } from "@/lib/training"
import { inferMuscleGroupsFromText, getMuscleGroupLabel } from "@/lib/exercise-map"
import type { TrainingSession, SessionType, MuscleGroup } from "@/lib/types"

const SESSION_TYPES: SessionType[] = ["Strength", "Cardio", "HIIT", "Mobility", "Sport", "Recovery", "Rest"]

export default function TrainingPage() {
  const today = new Date().toISOString().split("T")[0]
  const [date, setDate] = useState(today)
  const [sessionType, setSessionType] = useState<SessionType>("Strength")
  const [duration, setDuration] = useState(60)
  const [rpe, setRpe] = useState(7)
  const [exerciseText, setExerciseText] = useState("")
  const [notes, setNotes] = useState("")
  const [painScore, setPainScore] = useState(0)
  const [saved, setSaved] = useState(false)

  const sessions = useMemo(() => {
    const dm = loadDemoMode()
    const stored = loadTrainingSessions()
    return dm && stored.length === 0 ? MOCK_TRAINING_HISTORY : stored
  }, [saved])

  const recent = getRecentSessions(sessions, 14)
  const load = calculateTrainingLoad(sessions)
  const missingGroups = findMissingThisWeek(sessions)
  const coverage = calculateWeeklyMuscleCoverage(sessions)

  const inferredGroups = inferMuscleGroupsFromText(exerciseText)

  function handleSave() {
    const session: TrainingSession = {
      id: `session-${Date.now()}`,
      date,
      session_type: sessionType,
      duration_minutes: duration,
      rpe,
      muscle_groups: inferredGroups.length > 0 ? inferredGroups : [],
      exercises_freeform: exerciseText || undefined,
      notes: notes || undefined,
      pain_score: painScore > 0 ? painScore : undefined,
    }
    saveTrainingSession(session)
    setSaved(true)
    setExerciseText("")
    setNotes("")
    setTimeout(() => setSaved(false), 2000)
  }

  const acwrStatus =
    load.acwr < 0.8 ? "text-sky-400"
    : load.acwr <= 1.3 ? "text-emerald-400"
    : load.acwr <= 1.5 ? "text-amber-400"
    : "text-red-400"

  return (
    <AppShell>
      <PageHeader title="Training" subtitle="Log sessions and track muscle coverage and load." />
      <div className="px-6 pb-24 lg:pb-8 space-y-4">

        {/* Load summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">ACWR</p>
            <p className={`text-xl font-semibold mt-0.5 ${acwrStatus}`}>{load.acwr}</p>
            <p className="text-[10px] text-zinc-600">0.8-1.3 optimal</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Acute</p>
            <p className="text-xl font-semibold text-zinc-200 mt-0.5">{load.acute}</p>
            <p className="text-[10px] text-zinc-600">7-day load</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Chronic</p>
            <p className="text-xl font-semibold text-zinc-200 mt-0.5">{load.chronic}</p>
            <p className="text-[10px] text-zinc-600">28-day avg</p>
          </div>
        </div>

        {/* Muscle coverage */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4 space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">This week&apos;s muscle coverage</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(coverage).map(([group, count]) => (
                <Badge key={group} variant="outline" className="text-[10px] border-emerald-800 text-emerald-400">
                  {getMuscleGroupLabel(group as MuscleGroup)} ×{count}
                </Badge>
              ))}
              {missingGroups.map((group) => (
                <Badge key={group} variant="outline" className="text-[10px] border-zinc-700 text-zinc-600">
                  {getMuscleGroupLabel(group)} —
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Log form */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4 space-y-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Log a session</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-zinc-400">Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-zinc-400">Type</Label>
                <Select value={sessionType} onValueChange={(v) => setSessionType(v as SessionType)}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {SESSION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm text-zinc-400">Duration</Label>
                <span className="text-sm font-semibold text-zinc-200">{duration} min</span>
              </div>
              <Slider min={10} max={180} step={5} value={[duration]} onValueChange={(vals) => setDuration(Array.isArray(vals) ? vals[0] : (vals as number))} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm text-zinc-400">RPE</Label>
                <span className="text-sm font-semibold text-zinc-200">{rpe}/10</span>
              </div>
              <Slider min={1} max={10} step={1} value={[rpe]} onValueChange={(vals) => setRpe(Array.isArray(vals) ? vals[0] : (vals as number))} />
              <div className="flex justify-between text-[10px] text-zinc-600">
                <span>Easy</span><span>Maximal</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-400">Exercises (freeform)</Label>
              <Textarea
                value={exerciseText}
                onChange={(e) => setExerciseText(e.target.value)}
                placeholder={"Bench press 4x8@80kg\nSquat 4x5@100kg\nLatpulldown 3x10"}
                className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm font-mono"
                rows={5}
              />
              {inferredGroups.length > 0 && (
                <p className="text-[10px] text-zinc-600">
                  Detected: {inferredGroups.map((g) => getMuscleGroupLabel(g)).join(", ")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm text-zinc-400">Pain score (0 = none)</Label>
                <span className="text-sm font-semibold text-zinc-200">{painScore}/10</span>
              </div>
              <Slider min={0} max={10} step={1} value={[painScore]} onValueChange={(vals) => setPainScore(Array.isArray(vals) ? vals[0] : (vals as number))} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-400">Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How it felt, PRs, anything notable"
                className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
                rows={2}
              />
            </div>

            <Button
              onClick={handleSave}
              className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold"
              disabled={saved}
            >
              {saved ? "Session saved!" : "Save session"}
            </Button>
          </CardContent>
        </Card>

        {/* Recent sessions */}
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Recent sessions (14 days)</p>
          <div className="space-y-2">
            {recent.length === 0 && (
              <p className="text-xs text-zinc-600">No sessions logged yet.</p>
            )}
            {recent.map((s) => (
              <div key={s.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-200">{s.session_type}</span>
                    <span className="text-[10px] text-zinc-600">{s.date}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {s.duration_minutes}min · RPE {s.rpe} · Load {s.rpe * s.duration_minutes}
                  </p>
                  {s.exercises_freeform && (
                    <p className="text-[10px] text-zinc-700 mt-0.5 line-clamp-1">{s.exercises_freeform.split("\n")[0]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
