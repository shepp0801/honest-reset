import { resetExtendedHealthGoals } from './healthGoals'

export const DEFAULT_WATER_GOAL_OZ = 64
export const DEFAULT_MACRO_GOALS = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
} as const

export type MacroGoals = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

const WATER_KEY = 'honest-reset-water-goal-oz'
const MACRO_KEY = 'honest-reset-macro-goals'
export const GOALS_UPDATED_EVENT = 'honest-reset-goals-updated'
export const PROFILE_CHANGED_EVENT = 'honest-reset-profile-changed'

function waterKey(profileId?: string) {
  return profileId ? `${WATER_KEY}-${profileId}` : WATER_KEY
}

function macroKey(profileId?: string) {
  return profileId ? `${MACRO_KEY}-${profileId}` : MACRO_KEY
}

function notifyGoalsUpdated() {
  window.dispatchEvent(new Event(GOALS_UPDATED_EVENT))
}

export function getWaterGoalOz(profileId?: string): number {
  const scopedKey = waterKey(profileId)
  const stored = localStorage.getItem(scopedKey) ?? (profileId ? localStorage.getItem(WATER_KEY) : null)
  if (!stored) return DEFAULT_WATER_GOAL_OZ
  const n = Number(stored)
  return Number.isNaN(n) || n <= 0 ? DEFAULT_WATER_GOAL_OZ : n
}

export function setWaterGoalOz(ounces: number, profileId?: string) {
  localStorage.setItem(waterKey(profileId), String(ounces))
  notifyGoalsUpdated()
}

export function getMacroGoals(profileId?: string): MacroGoals {
  const scopedKey = macroKey(profileId)
  const stored = localStorage.getItem(scopedKey) ?? (profileId ? localStorage.getItem(MACRO_KEY) : null)
  if (!stored) return { ...DEFAULT_MACRO_GOALS }
  try {
    const parsed = JSON.parse(stored) as Partial<MacroGoals>
    return {
      calories: positiveOrDefault(parsed.calories, DEFAULT_MACRO_GOALS.calories),
      protein: positiveOrDefault(parsed.protein, DEFAULT_MACRO_GOALS.protein),
      carbs: positiveOrDefault(parsed.carbs, DEFAULT_MACRO_GOALS.carbs),
      fat: positiveOrDefault(parsed.fat, DEFAULT_MACRO_GOALS.fat),
    }
  } catch {
    return { ...DEFAULT_MACRO_GOALS }
  }
}

export function setMacroGoals(goals: MacroGoals, profileId?: string) {
  localStorage.setItem(macroKey(profileId), JSON.stringify(goals))
  notifyGoalsUpdated()
}

export function resetGoalsToDefaults(profileId?: string) {
  localStorage.removeItem(waterKey(profileId))
  localStorage.removeItem(macroKey(profileId))
  if (!profileId) {
    localStorage.removeItem(WATER_KEY)
    localStorage.removeItem(MACRO_KEY)
  }
  resetExtendedHealthGoals(profileId)
  notifyGoalsUpdated()
}

function positiveOrDefault(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isNaN(n) || n <= 0 ? fallback : n
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack1' | 'snack2'

export const MEAL_SLOTS: { type: MealType; label: string }[] = [
  { type: 'breakfast', label: 'Breakfast' },
  { type: 'lunch', label: 'Lunch' },
  { type: 'dinner', label: 'Dinner' },
  { type: 'snack1', label: 'Snack 1' },
  { type: 'snack2', label: 'Snack 2' },
]
