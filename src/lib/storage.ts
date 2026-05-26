"use client"

import { STORAGE_KEYS, DEFAULT_SETTINGS } from "./constants"
import type {
  UserSettings,
  DailyCheckIn,
  TrainingSession,
  Experiment,
} from "./types"
import type { CachedBrief } from "@/lib/ai/brief-schema"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.warn("Cognix: localStorage write failed for key", key)
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function loadSettings(): UserSettings {
  return safeGet<UserSettings>(STORAGE_KEYS.settings, {
    ...DEFAULT_SETTINGS,
  })
}

export function saveSettings(settings: UserSettings): void {
  safeSet(STORAGE_KEYS.settings, settings)
}

// ─── Check-ins ────────────────────────────────────────────────────────────────

export function loadCheckIns(): DailyCheckIn[] {
  return safeGet<DailyCheckIn[]>(STORAGE_KEYS.checkins, [])
}

export function saveCheckIn(checkin: DailyCheckIn): void {
  const existing = loadCheckIns()
  const idx = existing.findIndex((c) => c.date === checkin.date)
  if (idx >= 0) {
    existing[idx] = checkin
  } else {
    existing.push(checkin)
  }
  // Keep last 90 days
  const trimmed = existing
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-90)
  safeSet(STORAGE_KEYS.checkins, trimmed)
}

export function loadTodayCheckIn(): DailyCheckIn | null {
  const today = new Date().toISOString().split("T")[0]
  const all = loadCheckIns()
  return all.find((c) => c.date === today) ?? null
}

// ─── Training sessions ────────────────────────────────────────────────────────

export function loadTrainingSessions(): TrainingSession[] {
  return safeGet<TrainingSession[]>(STORAGE_KEYS.training_sessions, [])
}

export function saveTrainingSession(session: TrainingSession): void {
  const existing = loadTrainingSessions()
  const idx = existing.findIndex((s) => s.id === session.id)
  if (idx >= 0) {
    existing[idx] = session
  } else {
    existing.push(session)
  }
  const trimmed = existing
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-120)
  safeSet(STORAGE_KEYS.training_sessions, trimmed)
}

export function loadRecentSessions(days = 28): TrainingSession[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().split("T")[0]
  return loadTrainingSessions().filter((s) => s.date >= cutoffStr)
}

// ─── Experiments ─────────────────────────────────────────────────────────────

export function loadExperiments(): Experiment[] {
  return safeGet<Experiment[]>(STORAGE_KEYS.experiments, [])
}

export function saveExperiments(experiments: Experiment[]): void {
  safeSet(STORAGE_KEYS.experiments, experiments)
}

// ─── Demo mode ────────────────────────────────────────────────────────────────

export function loadDemoMode(): boolean {
  return safeGet<boolean>(STORAGE_KEYS.demo_mode, true)
}

export function saveDemoMode(enabled: boolean): void {
  safeSet(STORAGE_KEYS.demo_mode, enabled)
}

// ─── Brief cache ──────────────────────────────────────────────────────────────
// Caches one brief per day. A new call to /api/brief for the same date returns
// the cached version from localStorage rather than hitting the API again.

export function loadCachedBrief(date: string): CachedBrief | null {
  const all = safeGet<CachedBrief[]>(STORAGE_KEYS.brief_cache, [])
  return all.find((b) => b.date === date) ?? null
}

export function saveCachedBrief(cached: CachedBrief): void {
  const all = safeGet<CachedBrief[]>(STORAGE_KEYS.brief_cache, [])
  const idx = all.findIndex((b) => b.date === cached.date)
  if (idx >= 0) {
    all[idx] = cached
  } else {
    all.push(cached)
  }
  // Keep last 30 days only
  const trimmed = all.sort((a, b) => a.date.localeCompare(b.date)).slice(-30)
  safeSet(STORAGE_KEYS.brief_cache, trimmed)
}

// ─── Clear all data ───────────────────────────────────────────────────────────

export function clearAllData(): void {
  if (typeof window === "undefined") return
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
}
