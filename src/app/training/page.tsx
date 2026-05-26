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
import { AlertTriangle } from "lucide-react"
import { saveTrainingSession, loadTrainingSessions, loadDemoMode } from "@/lib/storage"
import { MOCK_TRAINING_HISTORY } from "@/lib/mock-history"
import {
  calculateTrainingLoad,
  getRecentSessions,
  calculateWeeklySetsByMuscleGroup,
  calculateMuscleCoverageScore,
  getMuscleGroupGaps,
  findOverrepresentedMuscleGroups,
  getTrainingConflictsForToday,
  WEEKLY_SET_TARGETS,
} from "@/lib/training"
import { inferMuscleGroupsFromText, getMuscleGroupLabel } from "@/lib/exercise-map"
import { parseExerciseText } from "@/lib/exercise-parser"
import type { TrainingSession, SessionType, MuscleGroup } from "@/lib/types"

const SESSION_TYPES: SessionType[] = ["Strength", "Cardio", "HIIT", "Mobility", "Sport", "Recovery", "Rest"]

function CoverageBar({ group, actual, min, max }: {
  group: MuscleGroup
  actual: number
  min: number
  max: number
}) {
  const pct = Math.min((actual / min) * 100, 100)
  const over = actual > max
  const met = actual >= min

  let barColour: string
  if (over) barColour = "bg-amber-500"
  else if (met) barColour = "bg-emerald-500"
  else if (pct > 50) barColour = "bg-sky-500"
  else barColour = "bg-zinc-700"

  let textColour: string
  if (over) textColour = "text-amber-400"
  else if (met) textColour = "text-emerald-400"
  else textColour = "text-zinc-500"

  return (
    <div className="space-y-0.5">
      <div className="flex justify-between items-center">
        <span className={`text-[10px] font-medium ${textColour}`}>{getMuscleGroupLabel(group)}</span>
        <span className="text-[10px] text-zinc-600">{actual}/{min}–{max}</span>
      </div>
      <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColour}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

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
  const weeklySets = calculateWeeklySetsByMuscleGroup(sessions)
  const coverageScore = calculateMuscleCoverageScore(weeklySets)
  const gaps = getMuscleGroupGaps(weeklySets)
  const overrep = findOverrepresentedMuscleGroups(weeklySets)
  const conflicts = getTrainingConflictsForToday(sessions, today)

  const parsedPreview = useMemo(() => parseExerciseText(exerciseText), [exerciseText])
  const inferredGroups = inferMuscleGroupsFromText(exerciseText)

  function handleSave() {
    const parsed = parseExerciseText(exerciseText)
    const session: TrainingSession = {
      id: `session-${Date.now()}`,
      date,
      session_type: sessionType,
      duration_minutes: duration,
      rpe,
      muscle_groups: inferredGroups.length > 0 ? inferredGroups : [],
      exercises_freeform: exerciseText || undefined,
      parsed_exercises: parsed.length > 0 ? parsed : undefined,
      notes: notes || undefined,
      pain_score: painScore > 0 ? painScore : undefined,
    }
    saveTrainingSession(session)
    setSaved(true)
    setExerciseText("")
    setNotes("")
    setTimeout(() => setSaved(false), 2000)
  }

  const acwrColour =
    load.acwr < 0.8 ? "text-sky-400"
    : load.acwr <= 1.3 ? "text-emerald-400"
    : load.acwr <= 1.5 ? "text-amber-400"
    : "text-red-400"

  const allMuscleGroups = (Object.keys(WEEKLY_SET_TARGETS) as MuscleGroup[]).filter(
    (g) => g !== "full_body",
  )

  return (
    <AppShell>
      <PageHeader title="Training" subtitle="Log sessions and track muscle coverage and load." />
      <div className="px-6 pb-24 lg:pb-8 space-y-4">

        {/* Load tiles */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">ACWR</p>
            <p className={`text-xl font-semibold mt-0.5 ${acwrColour}`}>{load.acwr}</p>
            <p className="text-[10px] text-zinc-600">0.8–1.3 optimal</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Acute</p>
            <p className="text-xl font-semibold text-zinc-200 mt-0.5">{load.acute}</p>
            <p className="text-[10px] text-zinc-600">7-day load</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Coverage</p>
            <p className={`text-xl font-semibold mt-0.5 ${coverageScore >= 70 ? "text-emerald-400" : coverageScore >= 40 ? "text-amber-400" : "text-zinc-400"}`}>
              {coverageScore}%
            </p>
            <p className="text-[10px] text-zinc-600">weekly target</p>
          </div>
        </div>

        {/* Conflicts */}
        {conflicts.length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-800/40 bg-amber-950/25 px-3 py-2.5">
            <AlertTriangle size={11} className="text-amber-500/80 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-[10px] text-amber-500/80 font-medium">Training overlap today</p>
              <p className="text-[10px] text-amber-500/60">
                {conflicts.slice(0, 3).map((c) => `${c.label} (${c.hoursAgo}h ago)`).join(", ")} trained recently. Consider avoiding these groups.
              </p>
            </div>
          </div>
        )}

        {/* Coverage heatmap */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Weekly muscle coverage</p>
              <span className="text-[10px] text-zinc-600">sets / min–max</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allMuscleGroups.map((group) => (
                <CoverageBar
                  key={group}
                  group={group}
                  actual={weeklySets[group] ?? 0}
                  min={WEEKLY_SET_TARGETS[group].min}
                  max={WEEKLY_SET_TARGETS[group].max}
                />
              ))}
            </div>

            {/* Gap suggestions */}
            {gaps.length > 0 && (
              <div className="border-t border-zinc-800 pt-2.5 space-y-1.5">
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Suggested add-ons</p>
                {gaps.slice(0, 3).map((g) => (
                  <div key={g.group} className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 w-20 flex-shrink-0">{g.label}</span>
                    <span className="text-[10px] text-zinc-600">{g.suggestion} (+{g.deficit} sets needed)</span>
                  </div>
                ))}
              </div>
            )}

            {/* Overrepresented */}
            {overrep.length > 0 && (
              <div className="border-t border-zinc-800 pt-2.5">
                <p className="text-[10px] text-amber-500/70">
                  High volume: {overrep.map((g) => getMuscleGroupLabel(g)).join(", ")} above weekly max. Consider deloading these.
                </p>
              </div>
            )}
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
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200">
                    <SelectValue />
                  </SelectTrigger>
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
              <Slider
                min={10} max={180} step={5}
                value={[duration]}
                onValueChange={(vals) => setDuration(Array.isArray(vals) ? vals[0] : (vals as number))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm text-zinc-400">RPE</Label>
                <span className="text-sm font-semibold text-zinc-200">{rpe}/10</span>
              </div>
              <Slider
                min={1} max={10} step={1}
                value={[rpe]}
                onValueChange={(vals) => setRpe(Array.isArray(vals) ? vals[0] : (vals as number))}
              />
              <div className="flex justify-between text-[10px] text-zinc-600">
                <span>Easy</span><span>Maximal</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-400">Exercises (freeform)</Label>
              <Textarea
                value={exerciseText}
                onChange={(e) => setExerciseText(e.target.value)}
                placeholder={"Bench press 4x8@80kg\nSquat 4x5@100kg\nLat pulldown 3x10"}
                className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm font-mono"
                rows={5}
              />

              {/* Parse preview */}
              {parsedPreview.length > 0 && (
                <div className="space-y-1 pt-1">
                  {parsedPreview.map((ex, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px]">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ex.confidence === "high" ? "bg-emerald-500" : ex.confidence === "medium" ? "bg-amber-500" : "bg-zinc-600"}`} />
                      <span className="text-zinc-400 min-w-0 flex-1 truncate">{ex.exerciseName || ex.raw}</span>
                      {ex.sets && ex.reps && (
                        <span className="text-zinc-600 flex-shrink-0">{ex.sets}×{ex.reps}</span>
                      )}
                      {ex.weightKg && (
                        <span className="text-zinc-600 flex-shrink-0">{ex.weightKg}kg</span>
                      )}
                      <span className="text-zinc-700 flex-shrink-0 truncate">
                        {ex.muscleGroups.slice(0, 2).map((g) => getMuscleGroupLabel(g)).join(", ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm text-zinc-400">Pain score (0 = none)</Label>
                <span className="text-sm font-semibold text-zinc-200">{painScore}/10</span>
              </div>
              <Slider
                min={0} max={10} step={1}
                value={[painScore]}
                onValueChange={(vals) => setPainScore(Array.isArray(vals) ? vals[0] : (vals as number))}
              />
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
            {recent.map((s) => {
              const groups = [
                ...s.muscle_groups,
                ...(s.exercises_freeform ? inferMuscleGroupsFromText(s.exercises_freeform) : []),
              ]
              const uniqueGroups = [...new Set(groups)] as MuscleGroup[]
              return (
                <div key={s.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-200">{s.session_type}</span>
                      <span className="text-[10px] text-zinc-600">{s.date}</span>
                    </div>
                    <span className="text-[10px] text-zinc-600">RPE {s.rpe} · {s.duration_minutes}min</span>
                  </div>
                  {uniqueGroups.length > 0 && (
                    <p className="text-[10px] text-zinc-600 mt-1">
                      {uniqueGroups.map((g) => getMuscleGroupLabel(g)).join(", ")}
                    </p>
                  )}
                  {s.parsed_exercises && s.parsed_exercises.length > 0 && (
                    <p className="text-[10px] text-zinc-700 mt-0.5 line-clamp-1">
                      {s.parsed_exercises.map((e) => e.exerciseName || e.raw).join(", ")}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </AppShell>
  )
}
