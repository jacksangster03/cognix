"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { saveCheckIn } from "@/lib/storage"
import { DEFAULT_SUPPLEMENT_NAMES } from "@/data/default-supplements"
import type {
  DailyCheckIn,
  ProteinBand,
  CalorieBand,
  HydrationBand,
  CaffeineAmount,
  LastCaffeineTimeBand,
} from "@/lib/types"

function SliderField({
  label,
  value,
  onChange,
  min = 1,
  max = 5,
  leftLabel,
  rightLabel,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  leftLabel?: string
  rightLabel?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label className="text-sm text-zinc-300">{label}</Label>
        <span className="text-sm font-semibold text-zinc-200">{value}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={(vals) => onChange(Array.isArray(vals) ? vals[0] : (vals as number))}
        className="w-full"
      />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-[10px] text-zinc-600">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  )
}

export default function CheckInPage() {
  const router = useRouter()
  const today = new Date().toISOString().split("T")[0]

  const [sleepQuality, setSleepQuality] = useState(3)
  const [mood, setMood] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [stress, setStress] = useState(3)
  const [soreness, setSoreness] = useState(2)
  const [painScore, setPainScore] = useState(0)
  const [painArea, setPainArea] = useState("")
  const [plannedWorkout, setPlannedWorkout] = useState("")
  const [protein, setProtein] = useState<ProteinBand>("Okay")
  const [calories, setCalories] = useState<CalorieBand>("About right")
  const [hydration, setHydration] = useState<HydrationBand>("Okay")
  const [caffeineAmount, setCaffeineAmount] = useState<CaffeineAmount>("Moderate")
  const [lastCaffeineTime, setLastCaffeineTime] = useState<LastCaffeineTimeBand>("Before 12")
  const [supplementsTaken, setSupplementsTaken] = useState<string[]>(["Creatine", "Vitamin D3", "Omega-3"])
  const [notes, setNotes] = useState("")
  const [saved, setSaved] = useState(false)

  function toggleSupplement(name: string) {
    setSupplementsTaken((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    )
  }

  function handleSubmit() {
    const checkin: DailyCheckIn = {
      id: `checkin-${today}`,
      date: today,
      created_at: new Date().toISOString(),
      sleep_quality: sleepQuality,
      mood,
      energy,
      stress,
      soreness,
      pain_score: painScore,
      pain_area: painArea || undefined,
      planned_workout: plannedWorkout || undefined,
      protein,
      calories,
      hydration,
      caffeine_amount: caffeineAmount,
      last_caffeine_time: lastCaffeineTime,
      supplements_taken: supplementsTaken,
      notes: notes || undefined,
    }
    saveCheckIn(checkin)
    setSaved(true)
    setTimeout(() => router.push("/dashboard"), 1000)
  }

  return (
    <AppShell>
      <PageHeader
        title="Daily Check-in"
        subtitle="Log how you feel today. Rough is fine — accuracy beats precision here."
      />
      <div className="px-6 pb-24 lg:pb-8 space-y-4">

        {/* Wellbeing */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4 space-y-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Wellbeing</p>
            <SliderField label="Sleep quality" value={sleepQuality} onChange={setSleepQuality} leftLabel="Poor" rightLabel="Excellent" />
            <SliderField label="Mood" value={mood} onChange={setMood} leftLabel="Low" rightLabel="Great" />
            <SliderField label="Energy" value={energy} onChange={setEnergy} leftLabel="Exhausted" rightLabel="High" />
            <SliderField label="Stress" value={stress} onChange={setStress} leftLabel="Calm" rightLabel="Very stressed" />
            <SliderField label="Soreness" value={soreness} onChange={setSoreness} leftLabel="None" rightLabel="Very sore" />
          </CardContent>
        </Card>

        {/* Pain */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4 space-y-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Pain</p>
            <SliderField label="Pain score" value={painScore} onChange={setPainScore} min={0} max={10} leftLabel="None" rightLabel="Severe" />
            {painScore >= 3 && (
              <div className="space-y-1.5">
                <Label className="text-sm text-zinc-400">Pain area (optional)</Label>
                <Textarea
                  value={painArea}
                  onChange={(e) => setPainArea(e.target.value)}
                  placeholder="e.g. lower back, left knee"
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
                  rows={2}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nutrition */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4 space-y-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Rough nutrition</p>

            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-400">Protein band</Label>
              <Select value={protein} onValueChange={(v) => setProtein(v as ProteinBand)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="Low">Low (under target)</SelectItem>
                  <SelectItem value="Okay">Okay (roughly half)</SelectItem>
                  <SelectItem value="Good">Good (near or at target)</SelectItem>
                  <SelectItem value="High">High (over target)</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-400">Calories</Label>
              <Select value={calories} onValueChange={(v) => setCalories(v as CalorieBand)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="Under">Under (deficit)</SelectItem>
                  <SelectItem value="About right">About right (maintenance)</SelectItem>
                  <SelectItem value="Over">Over (surplus)</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-400">Hydration</Label>
              <Select value={hydration} onValueChange={(v) => setHydration(v as HydrationBand)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="Low">Low (under 1.5L)</SelectItem>
                  <SelectItem value="Okay">Okay (1.5-2.5L)</SelectItem>
                  <SelectItem value="Good">Good (2.5L+)</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Caffeine */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4 space-y-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Caffeine</p>
            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-400">Amount</Label>
              <Select value={caffeineAmount} onValueChange={(v) => setCaffeineAmount(v as CaffeineAmount)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Low">Low (1 coffee)</SelectItem>
                  <SelectItem value="Moderate">Moderate (2-3 coffees)</SelectItem>
                  <SelectItem value="High">High (4+ coffees)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-400">Last caffeine time</Label>
              <Select value={lastCaffeineTime} onValueChange={(v) => setLastCaffeineTime(v as LastCaffeineTimeBand)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="None">None today</SelectItem>
                  <SelectItem value="Before 12">Before 12:00</SelectItem>
                  <SelectItem value="12 to 14">12:00 to 14:00</SelectItem>
                  <SelectItem value="14 to 16">14:00 to 16:00</SelectItem>
                  <SelectItem value="After 16">After 16:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Supplements */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4 space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Supplements taken today</p>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_SUPPLEMENT_NAMES.slice(0, 8).map((name) => (
                <label key={name} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={supplementsTaken.includes(name)}
                    onCheckedChange={() => toggleSupplement(name)}
                    className="border-zinc-600"
                  />
                  <span className="text-xs text-zinc-400">{name}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Planned workout + notes */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-400">Planned workout (optional)</Label>
              <Textarea
                value={plannedWorkout}
                onChange={(e) => setPlannedWorkout(e.target.value)}
                placeholder="e.g. Push A, rest day, legs"
                className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
                rows={1}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-400">Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything else relevant"
                className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSubmit}
          className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold"
          disabled={saved}
        >
          {saved ? "Saved. Returning to dashboard..." : "Save check-in"}
        </Button>
      </div>
    </AppShell>
  )
}
