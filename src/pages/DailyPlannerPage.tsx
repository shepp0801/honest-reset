import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useActiveProfileId } from '../context/ProfileContext'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { ScaleRow } from '../components/ScaleRow'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import {
  addDaysISO,
  calcSleepHours,
  formatPlannerNavDate,
  todayISO,
  toRecordedAtISO,
} from '../lib/date'
import { MedChecklist } from '../components/meds/MedChecklist'
import { MEAL_SLOTS, type MealType } from '../lib/plannerConstants'
import { useWaterGoal } from '../hooks/useWaterGoal'
import { syncMedicationCheckins } from '../lib/medicationCheckins'
import { supabase } from '../lib/supabase'
import { INTENSITIES, WORKOUT_TYPES, type WorkoutIntensity, type WorkoutType } from '../lib/workoutOptions'
import type { DailyLog, FoodEntry, MedicationCheckin, MedicationItem, Workout } from '../types/database'

type MealForm = {
  meal_name: string
  calories: string
  protein_g: string
  carbs_g: string
  fat_g: string
}

type WorkoutForm = {
  exercise_name: string
  workout_type: WorkoutType
  duration_minutes: string
  intensity: WorkoutIntensity
  sets: string
  reps: string
  weight_lbs: string
  distance_miles: string
}

function emptyMeal(): MealForm {
  return { meal_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' }
}

function emptyWorkout(): WorkoutForm {
  return {
    exercise_name: '',
    workout_type: 'Other',
    duration_minutes: '',
    intensity: 'Moderate',
    sets: '',
    reps: '',
    weight_lbs: '',
    distance_miles: '',
  }
}

function numOrNull(v: string): number | null {
  if (v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

function intOrNull(v: string): number | null {
  const n = numOrNull(v)
  return n == null ? null : Math.round(n)
}

function timeFromDb(t: string | null): string {
  if (!t) return ''
  return t.slice(0, 5)
}

function mealHasData(m: MealForm): boolean {
  return (
    m.meal_name.trim() !== '' ||
    m.calories !== '' ||
    m.protein_g !== '' ||
    m.carbs_g !== '' ||
    m.fat_g !== ''
  )
}

function initialMeals(): Record<MealType, MealForm> {
  return {
    breakfast: emptyMeal(),
    lunch: emptyMeal(),
    dinner: emptyMeal(),
    snack1: emptyMeal(),
    snack2: emptyMeal(),
  }
}

function workoutHasData(w: WorkoutForm): boolean {
  return w.exercise_name.trim() !== ''
}

type PlannerSnapshotInput = {
  weight: string
  systolic: string
  diastolic: string
  bloodGlucose: string
  restingHr: string
  meals: Record<MealType, MealForm>
  waterOz: string
  bedtime: string
  wakeTime: string
  sleepHours: string
  sleepQuality: number | null
  workouts: WorkoutForm[]
  checkedMedIds: string[]
  energy: number | null
  mood: number | null
  stress: number | null
  notes: string
}

function buildPlannerSnapshot(input: PlannerSnapshotInput): string {
  return JSON.stringify({
    ...input,
    checkedMedIds: [...input.checkedMedIds].sort(),
  })
}

function vitalsComplete(input: PlannerSnapshotInput): boolean {
  return (
    input.weight !== '' ||
    input.systolic !== '' ||
    input.diastolic !== '' ||
    input.bloodGlucose !== '' ||
    input.restingHr !== ''
  )
}

function vitalsSummary(input: PlannerSnapshotInput): string {
  const parts: string[] = []
  if (input.weight) parts.push(`${input.weight} lbs`)
  if (input.systolic && input.diastolic) parts.push(`${input.systolic}/${input.diastolic}`)
  else if (input.systolic) parts.push(`${input.systolic} sys`)
  else if (input.diastolic) parts.push(`${input.diastolic} dia`)
  if (input.bloodGlucose) parts.push(`${input.bloodGlucose} mg/dL glucose`)
  if (input.restingHr) parts.push(`${input.restingHr} BPM`)
  return parts.join(' · ') || 'Nothing logged yet'
}

function mealsComplete(input: PlannerSnapshotInput): boolean {
  return Object.values(input.meals).some(mealHasData)
}

function mealsSummary(totals: { calories: number; protein: number }): string {
  if (totals.calories <= 0 && totals.protein <= 0) return 'Nothing logged yet'
  const parts: string[] = []
  if (totals.calories > 0) parts.push(`${Math.round(totals.calories)} cal`)
  if (totals.protein > 0) parts.push(`${Math.round(totals.protein)}g protein`)
  return parts.join(' · ')
}

function waterComplete(waterOz: string): boolean {
  return waterOz !== ''
}

function waterSummary(waterOz: string, waterPct: number, waterGoal: number): string {
  if (waterOz === '') return 'Nothing logged yet'
  const oz = numOrNull(waterOz) ?? 0
  return `${oz} oz (${waterPct}% of ${waterGoal} oz goal)`
}

function sleepComplete(input: PlannerSnapshotInput): boolean {
  return (
    input.bedtime !== '' ||
    input.wakeTime !== '' ||
    input.sleepHours !== '' ||
    input.sleepQuality != null
  )
}

function sleepSummary(input: PlannerSnapshotInput): string {
  const parts: string[] = []
  if (input.sleepHours) parts.push(`${input.sleepHours} hrs`)
  else if (input.bedtime && input.wakeTime) parts.push(`${input.bedtime}–${input.wakeTime}`)
  if (input.sleepQuality != null) parts.push(`quality ${input.sleepQuality}/10`)
  return parts.join(' · ') || 'Nothing logged yet'
}

function exerciseComplete(workouts: WorkoutForm[]): boolean {
  return workouts.some(workoutHasData)
}

function exerciseSummary(workouts: WorkoutForm[]): string {
  const logged = workouts.filter(workoutHasData)
  if (!logged.length) return 'Nothing logged yet'
  const names = logged.map((w) => w.exercise_name.trim()).filter(Boolean)
  const count = logged.length
  const label = count === 1 ? '1 workout' : `${count} workouts`
  return names.length ? `${label} · ${names.join(', ')}` : label
}

function medsComplete(total: number, done: number): boolean {
  return total > 0 && done === total
}

function medsSummary(total: number, done: number): string {
  if (total === 0) return 'No items on your list'
  return `${done}/${total} taken`
}

function feelComplete(input: PlannerSnapshotInput): boolean {
  return (
    input.energy != null ||
    input.mood != null ||
    input.stress != null ||
    input.notes.trim() !== ''
  )
}

function feelSummary(input: PlannerSnapshotInput): string {
  const parts: string[] = []
  if (input.energy != null) parts.push(`Energy ${input.energy}`)
  if (input.mood != null) parts.push(`Mood ${input.mood}`)
  if (input.stress != null) parts.push(`Stress ${input.stress}`)
  if (input.notes.trim()) parts.push('Notes added')
  return parts.join(' · ') || 'Nothing logged yet'
}

export function DailyPlannerPage() {
  const { user } = useAuth()
  const profileId = useActiveProfileId()
  const [logDate, setLogDate] = useState(todayISO)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [weight, setWeight] = useState('')
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [bloodGlucose, setBloodGlucose] = useState('')
  const [restingHr, setRestingHr] = useState('')

  const [meals, setMeals] = useState(initialMeals)

  const [waterOz, setWaterOz] = useState('')

  const [bedtime, setBedtime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [sleepHours, setSleepHours] = useState('')
  const [sleepHoursManual, setSleepHoursManual] = useState(false)
  const [sleepQuality, setSleepQuality] = useState<number | null>(null)

  const [workouts, setWorkouts] = useState<WorkoutForm[]>([emptyWorkout()])
  const [medItems, setMedItems] = useState<MedicationItem[]>([])
  const [checkedMedIds, setCheckedMedIds] = useState<string[]>([])

  const [energy, setEnergy] = useState<number | null>(null)
  const [mood, setMood] = useState<number | null>(null)
  const [stress, setStress] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null)

  const waterGoal = useWaterGoal()

  const snapshotInput: PlannerSnapshotInput = useMemo(
    () => ({
      weight,
      systolic,
      diastolic,
      bloodGlucose,
      restingHr,
      meals,
      waterOz,
      bedtime,
      wakeTime,
      sleepHours,
      sleepQuality,
      workouts,
      checkedMedIds,
      energy,
      mood,
      stress,
      notes,
    }),
    [
      weight,
      systolic,
      diastolic,
      bloodGlucose,
      restingHr,
      meals,
      waterOz,
      bedtime,
      wakeTime,
      sleepHours,
      sleepQuality,
      workouts,
      checkedMedIds,
      energy,
      mood,
      stress,
      notes,
    ],
  )

  const currentSnapshot = useMemo(() => buildPlannerSnapshot(snapshotInput), [snapshotInput])

  const hasUnsavedChanges = savedSnapshot !== null && currentSnapshot !== savedSnapshot

  const mealTotals = useMemo(() => {
    let calories = 0
    let protein = 0
    let carbs = 0
    let fat = 0
    for (const slot of Object.values(meals)) {
      calories += numOrNull(slot.calories) ?? 0
      protein += numOrNull(slot.protein_g) ?? 0
      carbs += numOrNull(slot.carbs_g) ?? 0
      fat += numOrNull(slot.fat_g) ?? 0
    }
    return { calories, protein, carbs, fat }
  }, [meals])

  const waterPct = useMemo(() => {
    const oz = numOrNull(waterOz) ?? 0
    return waterGoal > 0 ? Math.min(100, Math.round((oz / waterGoal) * 100)) : 0
  }, [waterOz, waterGoal])

  const checkedMedSet = useMemo(() => new Set(checkedMedIds), [checkedMedIds])
  const medicationItems = useMemo(
    () => medItems.filter((item) => item.item_type === 'Medication'),
    [medItems],
  )
  const supplementItems = useMemo(
    () => medItems.filter((item) => item.item_type === 'Supplement'),
    [medItems],
  )
  const medChecklistTotal = medItems.length
  const medChecklistDone = checkedMedIds.length

  useEffect(() => {
    if (sleepHoursManual) return
    const calc = calcSleepHours(bedtime, wakeTime)
    if (calc != null) setSleepHours(String(calc))
  }, [bedtime, wakeTime, sleepHoursManual])

  const loadIdRef = useRef(0)

  const loadDay = useCallback(async () => {
    if (!user || !profileId) return
    const loadId = ++loadIdRef.current
    setLoading(true)
    setError('')

    const uid = profileId
    const [logRes, foodRes, workoutRes, medItemsRes, checkinsRes] = await Promise.all([
      supabase.from('daily_logs').select('*').eq('user_id', uid).eq('log_date', logDate).maybeSingle(),
      supabase.from('food_entries').select('*').eq('user_id', uid).eq('log_date', logDate),
      supabase.from('workouts').select('*').eq('user_id', uid).eq('log_date', logDate),
      supabase
        .from('medication_items')
        .select('*')
        .eq('user_id', uid)
        .eq('active', true)
        .order('name', { ascending: true }),
      supabase.from('medication_checkins').select('*').eq('user_id', uid).eq('taken_date', logDate),
    ])

    if (
      logRes.error ||
      foodRes.error ||
      workoutRes.error ||
      medItemsRes.error ||
      checkinsRes.error
    ) {
      if (loadId === loadIdRef.current) {
        setError('Could not load data for this day.')
        setLoading(false)
      }
      return
    }

    if (loadId !== loadIdRef.current) return

    const log = logRes.data as DailyLog | null
    setWeight(log?.weight_lbs?.toString() ?? '')
    setSystolic(log?.systolic_bp?.toString() ?? '')
    setDiastolic(log?.diastolic_bp?.toString() ?? '')
    setBloodGlucose(log?.blood_glucose?.toString() ?? '')
    setRestingHr(log?.resting_heart_rate?.toString() ?? '')
    setWaterOz(log?.water_oz?.toString() ?? '')
    setBedtime(timeFromDb(log?.bedtime ?? null))
    setWakeTime(timeFromDb(log?.wake_time ?? null))
    setSleepHours(log?.sleep_hours?.toString() ?? '')
    setSleepHoursManual(!!log?.sleep_hours)
    setSleepQuality(log?.sleep_quality ?? null)
    setEnergy(log?.energy_level ?? null)
    setMood(log?.mood ?? null)
    setStress(log?.stress_level ?? null)
    setNotes(log?.notes ?? '')

    const nextMeals = initialMeals()
    for (const f of (foodRes.data ?? []) as FoodEntry[]) {
      const type = (f.meal_type as MealType | null) ?? null
      if (type && type in nextMeals) {
        nextMeals[type] = {
          meal_name: f.meal_name,
          calories: f.calories?.toString() ?? '',
          protein_g: f.protein_g?.toString() ?? '',
          carbs_g: f.carbs_g?.toString() ?? '',
          fat_g: f.fat_g?.toString() ?? '',
        }
      }
    }
    setMeals(nextMeals)

    const wks = (workoutRes.data ?? []) as Workout[]
    const loadedWorkouts = wks.length
      ? wks.map((w) => ({
          exercise_name: w.exercise_name,
          workout_type: (w.workout_type as WorkoutType) ?? 'Other',
          duration_minutes: w.duration_minutes?.toString() ?? '',
          intensity: (w.intensity as WorkoutIntensity) ?? 'Moderate',
          sets: w.sets?.toString() ?? '',
          reps: w.reps?.toString() ?? '',
          weight_lbs: w.weight_lbs?.toString() ?? '',
          distance_miles: w.distance_miles?.toString() ?? '',
        }))
      : [emptyWorkout()]
    setWorkouts(loadedWorkouts)

    setMedItems((medItemsRes.data as MedicationItem[]) ?? [])
    const loadedCheckedIds = ((checkinsRes.data as MedicationCheckin[]) ?? []).map((c) => c.item_id)
    setCheckedMedIds(loadedCheckedIds)

    setSavedSnapshot(
      buildPlannerSnapshot({
        weight: log?.weight_lbs?.toString() ?? '',
        systolic: log?.systolic_bp?.toString() ?? '',
        diastolic: log?.diastolic_bp?.toString() ?? '',
        bloodGlucose: log?.blood_glucose?.toString() ?? '',
        restingHr: log?.resting_heart_rate?.toString() ?? '',
        meals: nextMeals,
        waterOz: log?.water_oz?.toString() ?? '',
        bedtime: timeFromDb(log?.bedtime ?? null),
        wakeTime: timeFromDb(log?.wake_time ?? null),
        sleepHours: log?.sleep_hours?.toString() ?? '',
        sleepQuality: log?.sleep_quality ?? null,
        workouts: loadedWorkouts,
        checkedMedIds: loadedCheckedIds,
        energy: log?.energy_level ?? null,
        mood: log?.mood ?? null,
        stress: log?.stress_level ?? null,
        notes: log?.notes ?? '',
      }),
    )

    setLoading(false)
  }, [user, profileId, logDate])

  useEffect(() => {
    setSuccess('')
    setSavedSnapshot(null)
    loadDay()
  }, [loadDay])

  const today = todayISO()
  const isSelectedToday = logDate === today
  const canGoForward = logDate < today

  function goToPreviousDay() {
    setLogDate((d) => addDaysISO(d, -1))
  }

  function goToNextDay() {
    if (!canGoForward) return
    setLogDate((d) => addDaysISO(d, 1))
  }

  function goToToday() {
    setLogDate(todayISO())
  }

  const saveAll = useCallback(async () => {
    if (!user || !profileId || saving) return
    setSaving(true)
    setError('')
    setSuccess('')

    const uid = profileId
    const errors: string[] = []

    const logPayload = {
      user_id: uid,
      log_date: logDate,
      weight_lbs: numOrNull(weight),
      systolic_bp: intOrNull(systolic),
      diastolic_bp: intOrNull(diastolic),
      blood_glucose: numOrNull(bloodGlucose),
      resting_heart_rate: intOrNull(restingHr),
      water_oz: numOrNull(waterOz),
      bedtime: bedtime ? `${bedtime}:00` : null,
      wake_time: wakeTime ? `${wakeTime}:00` : null,
      sleep_hours: numOrNull(sleepHours),
      sleep_quality: sleepQuality,
      energy_level: energy,
      mood,
      stress_level: stress,
      notes: notes.trim() || null,
    }

    const { error: logErr } = await supabase
      .from('daily_logs')
      .upsert(logPayload, { onConflict: 'user_id,log_date' })
    if (logErr) errors.push(`Daily log: ${logErr.message}`)

    const { error: delFoodErr } = await supabase
      .from('food_entries')
      .delete()
      .eq('user_id', uid)
      .eq('log_date', logDate)
    if (delFoodErr) errors.push(`Meals: ${delFoodErr.message}`)
    else {
      const foodRows = MEAL_SLOTS.filter(({ type }) => mealHasData(meals[type])).map(({ type }) => {
        const m = meals[type]
        return {
          user_id: uid,
          log_date: logDate,
          meal_type: type,
          meal_name: m.meal_name.trim() || MEAL_SLOTS.find((s) => s.type === type)!.label,
          calories: numOrNull(m.calories),
          protein_g: numOrNull(m.protein_g),
          carbs_g: numOrNull(m.carbs_g),
          fat_g: numOrNull(m.fat_g),
        }
      })
      if (foodRows.length) {
        const { error: foodErr } = await supabase.from('food_entries').insert(foodRows)
        if (foodErr) errors.push(`Meals: ${foodErr.message}`)
      }
    }

    const { error: delWErr } = await supabase
      .from('workouts')
      .delete()
      .eq('user_id', uid)
      .eq('log_date', logDate)
    if (delWErr) errors.push(`Exercise: ${delWErr.message}`)
    else {
      const workoutRows = workouts
        .filter((w) => w.exercise_name.trim())
        .map((w) => ({
          user_id: uid,
          log_date: logDate,
          exercise_name: w.exercise_name.trim(),
          workout_type: w.workout_type,
          duration_minutes: intOrNull(w.duration_minutes),
          intensity: w.intensity,
          sets: w.workout_type === 'Strength' ? intOrNull(w.sets) : null,
          reps: w.workout_type === 'Strength' ? intOrNull(w.reps) : null,
          weight_lbs: w.workout_type === 'Strength' ? numOrNull(w.weight_lbs) : null,
          distance_miles:
            w.workout_type === 'Cardio' || w.workout_type === 'Walking'
              ? numOrNull(w.distance_miles)
              : null,
          heart_rate_avg: null,
          heart_rate_max: null,
          notes: null,
        }))
      if (workoutRows.length) {
        const { error: wErr } = await supabase.from('workouts').insert(workoutRows)
        if (wErr) errors.push(`Exercise: ${wErr.message}`)
      }
    }

    const checkinErr = await syncMedicationCheckins(
      uid,
      logDate,
      checkedMedSet,
      medItems.map((item) => item.id),
    )
    if (checkinErr) errors.push(`Meds & supplements: ${checkinErr}`)

    const sys = intOrNull(systolic)
    const dia = intOrNull(diastolic)
    if (sys != null && dia != null) {
      const recordedAt = toRecordedAtISO(logDate, '12:00')
      const { data: existingBp } = await supabase
        .from('blood_pressure_readings')
        .select('id')
        .eq('user_id', uid)
        .gte('recorded_at', `${logDate}T00:00:00`)
        .lte('recorded_at', `${logDate}T23:59:59`)
        .limit(1)
        .maybeSingle()

      const bpPayload = {
        user_id: uid,
        recorded_at: recordedAt,
        systolic: sys,
        diastolic: dia,
        pulse: intOrNull(restingHr),
        notes: null,
      }
      if (existingBp?.id) {
        const { error: bpUp } = await supabase
          .from('blood_pressure_readings')
          .update(bpPayload)
          .eq('id', existingBp.id)
        if (bpUp) errors.push(`Blood pressure sync: ${bpUp.message}`)
      } else {
        const { error: bpIns } = await supabase.from('blood_pressure_readings').insert(bpPayload)
        if (bpIns) errors.push(`Blood pressure sync: ${bpIns.message}`)
      }
    }

    setSaving(false)
    if (errors.length) {
      setError(errors.join(' '))
    } else {
      setSuccess(`Saved everything for ${formatPlannerNavDate(logDate)}.`)
      await loadDay()
    }
  }, [
    user,
    profileId,
    saving,
    logDate,
    weight,
    systolic,
    diastolic,
    bloodGlucose,
    restingHr,
    waterOz,
    bedtime,
    wakeTime,
    sleepHours,
    sleepQuality,
    energy,
    mood,
    stress,
    notes,
    meals,
    workouts,
    checkedMedSet,
    medItems,
    loadDay,
  ])

  const handleSectionCollapsed = useCallback(() => {
    if (hasUnsavedChanges && !saving) void saveAll()
  }, [hasUnsavedChanges, saving, saveAll])

  useEffect(() => {
    if (loading || !hasUnsavedChanges || saving) return
    const timer = window.setTimeout(() => {
      void saveAll()
    }, 2000)
    return () => window.clearTimeout(timer)
  }, [currentSnapshot, loading, hasUnsavedChanges, saving, saveAll])

  function updateMeal(type: MealType, patch: Partial<MealForm>) {
    setMeals((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }))
  }

  function updateWorkout(index: number, patch: Partial<WorkoutForm>) {
    setWorkouts((prev) => prev.map((w, i) => (i === index ? { ...w, ...patch } : w)))
  }

  function toggleMedCheck(itemId: string) {
    setCheckedMedIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    )
  }

  return (
    <div className="pb-28">
      <header className="mb-4 space-y-3">
        <h1 className="font-display text-xl font-bold text-[var(--color-text)]">Daily Log</h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous day"
            onClick={goToPreviousDay}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-xl text-[var(--color-text)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-sage)_12%,transparent)]"
          >
            ←
          </button>

          <p className="min-w-0 flex-1 text-center font-display text-sm font-semibold leading-snug text-[var(--color-text)] sm:text-base">
            {formatPlannerNavDate(logDate)}
          </p>

          <button
            type="button"
            aria-label="Next day"
            onClick={goToNextDay}
            disabled={!canGoForward}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-xl transition-colors enabled:text-[var(--color-text)] enabled:hover:bg-[color-mix(in_srgb,var(--color-sage)_12%,transparent)] disabled:cursor-not-allowed disabled:border-[var(--color-border)] disabled:bg-[color-mix(in_srgb,var(--color-muted)_8%,var(--color-surface))] disabled:text-[var(--color-muted)] disabled:opacity-60"
          >
            →
          </button>
        </div>

        {!isSelectedToday && (
          <div className="flex justify-center">
            <Button type="button" variant="secondary" className="px-4 py-1.5 text-sm" onClick={goToToday}>
              Today
            </Button>
          </div>
        )}
      </header>

      <Alert type="error" message={error} onDismiss={() => setError('')} />
      <Alert type="success" message={success} onDismiss={() => setSuccess('')} />

      {loading ? (
        <LoadingSpinner label="Loading this day..." />
      ) : (
      <div className="space-y-3">
        <CollapsibleSection
          title="Vitals"
          summary={vitalsSummary(snapshotInput)}
          isComplete={vitalsComplete(snapshotInput)}
          onCollapsed={handleSectionCollapsed}
        >
          <div className="space-y-4 pt-3">
            <Input label="Weight (lbs)" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Systolic" type="number" value={systolic} onChange={(e) => setSystolic(e.target.value)} />
              <Input label="Diastolic" type="number" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} />
            </div>
            <Input label="Blood glucose (mg/dL)" type="number" value={bloodGlucose} onChange={(e) => setBloodGlucose(e.target.value)} />
            <Input label="Resting heart rate (BPM)" type="number" value={restingHr} onChange={(e) => setRestingHr(e.target.value)} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Meals"
          summary={mealsSummary(mealTotals)}
          isComplete={mealsComplete(snapshotInput)}
          onCollapsed={handleSectionCollapsed}
        >
          <div className="space-y-6 pt-3">
            {MEAL_SLOTS.map(({ type, label }) => (
              <div key={type} className="space-y-3 rounded-xl bg-[color-mix(in_srgb,var(--color-sage)_6%,transparent)] p-3">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">{label}</h3>
                <Input
                  label="Meal name / description"
                  value={meals[type].meal_name}
                  onChange={(e) => updateMeal(type, { meal_name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Input label="Calories" type="number" value={meals[type].calories} onChange={(e) => updateMeal(type, { calories: e.target.value })} />
                  <Input label="Protein (g)" type="number" value={meals[type].protein_g} onChange={(e) => updateMeal(type, { protein_g: e.target.value })} />
                  <Input label="Carbs (g)" type="number" value={meals[type].carbs_g} onChange={(e) => updateMeal(type, { carbs_g: e.target.value })} />
                  <Input label="Fat (g)" type="number" value={meals[type].fat_g} onChange={(e) => updateMeal(type, { fat_g: e.target.value })} />
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Daily totals</p>
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div>
                  <span className="text-[var(--color-muted)]">Calories</span>
                  <p className="font-semibold text-[var(--color-text)]">{Math.round(mealTotals.calories)}</p>
                </div>
                <div>
                  <span className="text-[var(--color-muted)]">Protein</span>
                  <p className="font-semibold text-[var(--color-text)]">{Math.round(mealTotals.protein)}g</p>
                </div>
                <div>
                  <span className="text-[var(--color-muted)]">Carbs</span>
                  <p className="font-semibold text-[var(--color-text)]">{Math.round(mealTotals.carbs)}g</p>
                </div>
                <div>
                  <span className="text-[var(--color-muted)]">Fat</span>
                  <p className="font-semibold text-[var(--color-text)]">{Math.round(mealTotals.fat)}g</p>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Water"
          summary={waterSummary(waterOz, waterPct, waterGoal)}
          isComplete={waterComplete(waterOz)}
          onCollapsed={handleSectionCollapsed}
        >
          <div className="space-y-3 pt-3">
            <Input label="Water intake (oz)" type="number" step="0.1" value={waterOz} onChange={(e) => setWaterOz(e.target.value)} />
            <div>
              <div className="mb-1 flex justify-between text-xs text-[var(--color-muted)]">
                <span>{numOrNull(waterOz) ?? 0} oz</span>
                <span>{waterPct}% of {waterGoal} oz goal</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-sage)_18%,transparent)]">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                  style={{ width: `${waterPct}%` }}
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Sleep"
          summary={sleepSummary(snapshotInput)}
          isComplete={sleepComplete(snapshotInput)}
          onCollapsed={handleSectionCollapsed}
        >
          <div className="space-y-4 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Bedtime" type="time" value={bedtime} onChange={(e) => { setBedtime(e.target.value); setSleepHoursManual(false) }} />
              <Input label="Wake time" type="time" value={wakeTime} onChange={(e) => { setWakeTime(e.target.value); setSleepHoursManual(false) }} />
            </div>
            <Input
              label="Sleep hours"
              type="number"
              step="0.1"
              value={sleepHours}
              onChange={(e) => { setSleepHours(e.target.value); setSleepHoursManual(true) }}
            />
            <ScaleRow label="Sleep quality" value={sleepQuality} onChange={setSleepQuality} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Exercise"
          summary={exerciseSummary(workouts)}
          isComplete={exerciseComplete(workouts)}
          onCollapsed={handleSectionCollapsed}
        >
          <div className="space-y-4 pt-3">
            {workouts.map((w, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-[var(--color-border)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Workout {index + 1}</span>
                  {workouts.length > 1 && (
                    <Button type="button" variant="ghost" className="text-xs text-red-600" onClick={() => setWorkouts((prev) => prev.filter((_, i) => i !== index))}>
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select label="Type" options={WORKOUT_TYPES} value={w.workout_type} onChange={(e) => updateWorkout(index, { workout_type: e.target.value as WorkoutType })} />
                  <Input label="Exercise name" value={w.exercise_name} onChange={(e) => updateWorkout(index, { exercise_name: e.target.value })} />
                  <Input label="Duration (min)" type="number" value={w.duration_minutes} onChange={(e) => updateWorkout(index, { duration_minutes: e.target.value })} />
                  <Select label="Intensity" options={INTENSITIES} value={w.intensity} onChange={(e) => updateWorkout(index, { intensity: e.target.value as WorkoutIntensity })} />
                  {w.workout_type === 'Strength' && (
                    <>
                      <Input label="Sets" type="number" value={w.sets} onChange={(e) => updateWorkout(index, { sets: e.target.value })} />
                      <Input label="Reps" type="number" value={w.reps} onChange={(e) => updateWorkout(index, { reps: e.target.value })} />
                      <Input label="Weight (lbs)" type="number" value={w.weight_lbs} onChange={(e) => updateWorkout(index, { weight_lbs: e.target.value })} />
                    </>
                  )}
                  {(w.workout_type === 'Cardio' || w.workout_type === 'Walking') && (
                    <Input label="Distance (miles)" type="number" step="0.01" value={w.distance_miles} onChange={(e) => updateWorkout(index, { distance_miles: e.target.value })} />
                  )}
                </div>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={() => setWorkouts((prev) => [...prev, emptyWorkout()])}>
              Add another exercise
            </Button>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Medications & Supplements"
          summary={medsSummary(medChecklistTotal, medChecklistDone)}
          isComplete={medsComplete(medChecklistTotal, medChecklistDone)}
          onCollapsed={handleSectionCollapsed}
        >
          <div className="space-y-5 pt-3">
            {medChecklistTotal > 0 && (
              <p className="text-sm text-[var(--color-muted)]">
                {medChecklistDone}/{medChecklistTotal} taken — check each box when you&apos;ve had it, then tap Save All.
              </p>
            )}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">Medications</h3>
              <MedChecklist
                items={medicationItems}
                checkedIds={checkedMedSet}
                onToggle={toggleMedCheck}
                emptyMessage="No medications on your list. Add them on the"
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">Supplements</h3>
              <MedChecklist
                items={supplementItems}
                checkedIds={checkedMedSet}
                onToggle={toggleMedCheck}
                emptyMessage="No supplements on your list. Add them on the"
              />
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="How I Feel Today"
          summary={feelSummary(snapshotInput)}
          isComplete={feelComplete(snapshotInput)}
          onCollapsed={handleSectionCollapsed}
        >
          <div className="space-y-5 pt-3">
            <ScaleRow label="Energy level" value={energy} onChange={setEnergy} />
            <ScaleRow label="Mood" value={mood} onChange={setMood} />
            <ScaleRow label="Stress level" value={stress} onChange={setStress} variant="inverted" />
            <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </CollapsibleSection>
      </div>
      )}

      <div className="pointer-events-none fixed bottom-[calc(3.25rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-20 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:bottom-0 md:left-64 md:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto mx-auto max-w-4xl rounded-2xl bg-[color-mix(in_srgb,var(--color-surface-elevated)_96%,transparent)] px-1 py-3 shadow-[0_-10px_28px_-6px_rgba(42,32,28,0.18)] backdrop-blur-md">
          <Button
            type="button"
            fullWidth
            disabled={saving || !hasUnsavedChanges}
            onClick={saveAll}
            className="relative"
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              {saving ? 'Saving...' : 'Save All'}
              {hasUnsavedChanges && !saving ? (
                <span className="text-base font-bold leading-none" aria-label="Unsaved changes">
                  *
                </span>
              ) : null}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}
