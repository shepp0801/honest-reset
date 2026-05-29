import { type FormEvent, useEffect, useState } from 'react'
import {
  DEFAULT_MACRO_GOALS,
  DEFAULT_WATER_GOAL_OZ,
  getMacroGoals,
  getWaterGoalOz,
  PROFILE_CHANGED_EVENT,
  resetGoalsToDefaults,
  setMacroGoals,
  setWaterGoalOz,
  type MacroGoals,
} from '../lib/plannerConstants'
import { useActiveProfileId, useProfile } from '../context/ProfileContext'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'

function loadFormState(profileId?: string) {
  const macros = getMacroGoals(profileId)
  return {
    waterOz: String(getWaterGoalOz(profileId)),
    calories: String(macros.calories),
    protein: String(macros.protein),
    carbs: String(macros.carbs),
    fat: String(macros.fat),
  }
}

function parsePositive(value: string): number | null {
  const n = Number(value)
  if (value.trim() === '' || Number.isNaN(n) || n <= 0) {
    return null
  }
  return n
}

export function GoalsPage() {
  const profileId = useActiveProfileId()
  const { activeProfile } = useProfile()
  const [waterOz, setWaterOz] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const form = loadFormState(profileId)
    setWaterOz(form.waterOz)
    setCalories(form.calories)
    setProtein(form.protein)
    setCarbs(form.carbs)
    setFat(form.fat)
  }, [profileId])

  useEffect(() => {
    const refresh = () => {
      const form = loadFormState(profileId)
      setWaterOz(form.waterOz)
      setCalories(form.calories)
      setProtein(form.protein)
      setCarbs(form.carbs)
      setFat(form.fat)
    }
    window.addEventListener(PROFILE_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(PROFILE_CHANGED_EVENT, refresh)
  }, [profileId])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const water = parsePositive(waterOz)
    const cal = parsePositive(calories)
    const pro = parsePositive(protein)
    const carb = parsePositive(carbs)
    const fatVal = parsePositive(fat)

    if (water == null || cal == null || pro == null || carb == null || fatVal == null) {
      setError('All goals must be positive numbers.')
      return
    }

    setWaterGoalOz(Math.round(water), profileId)
    setMacroGoals(
      {
        calories: Math.round(cal),
        protein: Math.round(pro),
        carbs: Math.round(carb),
        fat: Math.round(fatVal),
      } satisfies MacroGoals,
      profileId,
    )

    setSuccess('Goals saved! Your Dashboard and Daily Log will use these targets.')
  }

  function handleReset() {
    if (!window.confirm('Reset water and macro goals to the app defaults?')) return
    resetGoalsToDefaults(profileId)
    const form = loadFormState(profileId)
    setWaterOz(form.waterOz)
    setCalories(form.calories)
    setProtein(form.protein)
    setCarbs(form.carbs)
    setFat(form.fat)
    setError('')
    setSuccess('Goals reset to defaults.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">Daily goals</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Customize targets for water on the Daily Log and Dashboard, and macros on the Dashboard.
          {activeProfile && !activeProfile.is_primary && (
            <> Goals apply to <span className="font-medium">{activeProfile.display_name}</span>&apos;s profile.</>
          )}
        </p>
      </div>

      <Alert type="error" message={error} onDismiss={() => setError('')} />
      <Alert type="success" message={success} onDismiss={() => setSuccess('')} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="border-l-[4px] border-l-[var(--color-sage)]">
          <CardTitle>Water</CardTitle>
          <Input
            label="Daily water goal (oz)"
            type="number"
            min="1"
            step="1"
            value={waterOz}
            onChange={(e) => setWaterOz(e.target.value)}
            placeholder={String(DEFAULT_WATER_GOAL_OZ)}
          />
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Used on the Daily Log water section and Dashboard water card. Default:{' '}
            {DEFAULT_WATER_GOAL_OZ} oz.
          </p>
        </Card>

        <Card className="border-l-[4px] border-l-[var(--color-terracotta)]">
          <CardTitle>Macros</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Calories (kcal)"
              type="number"
              min="1"
              step="1"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
            <Input
              label="Protein (g)"
              type="number"
              min="1"
              step="1"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
            <Input
              label="Carbs (g)"
              type="number"
              min="1"
              step="1"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
            />
            <Input
              label="Fat (g)"
              type="number"
              min="1"
              step="1"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
            />
          </div>
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Shown on the Dashboard macro progress card. Defaults: {DEFAULT_MACRO_GOALS.calories} cal,{' '}
            {DEFAULT_MACRO_GOALS.protein}g protein, {DEFAULT_MACRO_GOALS.carbs}g carbs,{' '}
            {DEFAULT_MACRO_GOALS.fat}g fat.
          </p>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="submit">Save goals</Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            Reset to defaults
          </Button>
        </div>
      </form>
    </div>
  )
}
