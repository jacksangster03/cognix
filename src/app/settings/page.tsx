"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { loadSettings, saveSettings, loadDemoMode, saveDemoMode } from "@/lib/storage"
import { DEFAULT_SETTINGS } from "@/lib/constants"
import type { UserSettings } from "@/lib/types"

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [demoMode, setDemoMode] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const s = loadSettings()
    if (s) setSettings(s)
    setDemoMode(loadDemoMode())
  }, [])

  function update<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    saveSettings(settings)
    saveDemoMode(demoMode)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <AppShell>
      <PageHeader title="Settings" subtitle="Personal targets and preferences." />
      <div className="px-6 pb-24 lg:pb-8 space-y-4">

        {/* Demo mode */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-300 font-medium">Demo mode</p>
                <p className="text-xs text-zinc-500">Uses mock WHOOP data and sample history when no real data is logged.</p>
              </div>
              <Switch
                checked={demoMode}
                onCheckedChange={setDemoMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4 space-y-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Profile</p>

            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-400">Name</Label>
              <Input
                value={settings.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Your name"
                className="bg-zinc-800 border-zinc-700 text-zinc-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-400">Goal phase</Label>
              <Select value={settings.goal_phase} onValueChange={(v) => update("goal_phase", v as UserSettings["goal_phase"])}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="muscle_gain">Muscle gain</SelectItem>
                  <SelectItem value="fat_loss">Fat loss</SelectItem>
                  <SelectItem value="recomp">Recomp (muscle + fat loss)</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="endurance">Endurance</SelectItem>
                  <SelectItem value="health">General health</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-zinc-400">Bodyweight (kg)</Label>
                <Input
                  type="number"
                  value={settings.bodyweight_kg}
                  onChange={(e) => update("bodyweight_kg", parseFloat(e.target.value) || 80)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-zinc-400">Protein target (g)</Label>
                <Input
                  type="number"
                  value={settings.protein_target_g}
                  onChange={(e) => update("protein_target_g", parseInt(e.target.value) || 160)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-400">Water target (litres)</Label>
              <Input
                type="number"
                step="0.5"
                value={settings.water_target_litres}
                onChange={(e) => update("water_target_litres", parseFloat(e.target.value) || 3)}
                className="bg-zinc-800 border-zinc-700 text-zinc-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Training preferences */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4 space-y-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Training preferences</p>

            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-400">Preferred training time</Label>
              <Select value={settings.preferred_training_time} onValueChange={(v) => update("preferred_training_time", v as UserSettings["preferred_training_time"])}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="morning">Morning (before 10:00)</SelectItem>
                  <SelectItem value="lunch">Lunch (12:00-14:00)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (14:00-17:00)</SelectItem>
                  <SelectItem value="evening">Evening (17:00-20:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm text-zinc-400">Caffeine cutoff hour</Label>
                <span className="text-sm font-semibold text-zinc-200">{settings.caffeine_cutoff_hour}:00</span>
              </div>
              <Slider
                min={10}
                max={20}
                step={1}
                value={[settings.caffeine_cutoff_hour]}
                onValueChange={(vals) => update("caffeine_cutoff_hour", Array.isArray(vals) ? vals[0] : (vals as number))}
              />
              <div className="flex justify-between text-[10px] text-zinc-600">
                <span>10:00</span><span>20:00</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold"
          disabled={saved}
        >
          {saved ? "Settings saved!" : "Save settings"}
        </Button>

        <p className="text-[10px] text-zinc-700 text-center">
          All data stored locally in your browser. No account required.
        </p>
      </div>
    </AppShell>
  )
}
