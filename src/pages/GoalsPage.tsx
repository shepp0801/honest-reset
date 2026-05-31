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
import {
  DEFAULT_STEP_GOAL,
  formStateToHealthGoals,
  getDailyStepGoal,
  getHealthGoals,
  healthGoalsToFormState,
  setHealthGoals,
  WEEKLY_PACE_OPTIONS,
  type WeightGoalType,
} from '../lib/healthGoals'
import { useActiveProfileId, useProfile } from '../context/ProfileContext'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'

const WEIGHT_GOAL_TYPES: { value: WeightGoalType; label: string }[] = [
  { value: 'lose', label: 'Lose' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain', label: 'Gain' },
]

type GoalsFormState = ReturnType<typeof healthGoalsToFormState> & {
  waterOz: string
  calories: string
  protein: string
  carbs: string
  fat: string
}

function loadFormState(profileId?: string): GoalsFormState {
  const macros = getMacroGoals(profileId)
  const health = getHealthGoals(profileId)
  const stepDisplay = health.dailyStepGoal ?? getDailyStepGoal(profileId)
  return {
    waterOz: String(getWaterGoalOz(profileId)),
    calories: String(macros.calories),
    protein: String(macros.protein),
    carbs: String(macros.carbs),
    fat: String(macros.fat),
    ...healthGoalsToFormState(health, stepDisplay),
  }
}

function parsePositive(value: string): number | null {
  const n = Number(value)
  if (value.trim() === '' || Number.isNaN(n) || n <= 0) {
    return null
  }
  return n
}

function parseScale(value: string): number | null {
  const n = Number(value)
  if (value.trim() === '' || Number.isNaN(n) || n < 1 || n > 10) return null
  return Math.round(n)
}

function GoalGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">{title}</h2>
      {children}
    </section>
  )
}

export function GoalsPage() {
  const profileId = useActiveProfileId()
  const { activeProfile } = useProfile()
  const [waterOz, setWaterOz] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [weightGoalType, setWeightGoalType] = useState<WeightGoalType | ''>('')
  const [weeklyPace, setWeeklyPace] = useState('')
  const [targetSystolic, setTargetSystolic] = useState('')
  const [targetDiastolic, setTargetDiastolic] = useState('')
  const [fastingGlucoseMin, setFastingGlucoseMin] = useState('')
  const [fastingGlucoseMax, setFastingGlucoseMax] = useState('')
  const [targetSleepHours, setTargetSleepHours] = useState('')
  const [targetBedtime, setTargetBedtime] = useState('')
  const [dailyStepGoal, setDailyStepGoal] = useState('')
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState('')
  const [activityMinutesPerDay, setActivityMinutesPerDay] = useState('')
  const [energyTarget, setEnergyTarget] = useState('')
  const [moodTarget, setMoodTarget] = useState('')
  const [stressTarget, setStressTarget] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function applyForm(form: GoalsFormState) {
    setWaterOz(form.waterOz)
    setCalories(form.calories)
    setProtein(form.protein)
    setCarbs(form.carbs)
    setFat(form.fat)
    setTargetWeight(form.targetWeight)
    setWeightGoalType(form.weightGoalType as WeightGoalType | '')
    setWeeklyPace(form.weeklyPace)
    setTargetSystolic(form.targetSystolic)
    setTargetDiastolic(form.targetDiastolic)
    setFastingGlucoseMin(form.fastingGlucoseMin)
    setFastingGlucoseMax(form.fastingGlucoseMax)
    setTargetSleepHours(form.targetSleepHours)
    setTargetBedtime(form.targetBedtime)
    setDailyStepGoal(form.dailyStepGoal)
    setWorkoutsPerWeek(form.workoutsPerWeek)
    setActivityMinutesPerDay(form.activityMinutesPerDay)
    setEnergyTarget(form.energyTarget)
    setMoodTarget(form.moodTarget)
    setStressTarget(form.stressTarget)
  }

  useEffect(() => {
    applyForm(loadFormState(profileId))
  }, [profileId])

  useEffect(() => {
    const refresh = () => applyForm(loadFormState(profileId))
    window.addEventListener(PROFILE_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(PROFILE_CHANGED_EVENT, refresh)
  }, [profileId])

  const showWeeklyPace = weightGoalType === 'lose' || weightGoalType === 'gain'

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
      setError('Water and macro goals must be positive numbers.')
      return
    }

    const energy = parseScale(energyTarget)
    const mood = parseScale(moodTarget)
    const stress = parseScale(stressTarget)
    if (
      (energyTarget.trim() !== '' && energy == null) ||
      (moodTarget.trim() !== '' && mood == null) ||
      (stressTarget.trim() !== '' && stress == null)
    ) {
      setError('Wellbeing targets must be whole numbers from 1 to 10.')
      return
    }

    const glucoseMin = parsePositive(fastingGlucoseMin)
    const glucoseMax = parsePositive(fastingGlucoseMax)
    if (
      (fastingGlucoseMin.trim() !== '' && glucoseMin == null) ||
      (fastingGlucoseMax.trim() !== '' && glucoseMax == null)
    ) {
      setError('Glucose range values must be positive numbers.')
      return
    }
    if (glucoseMin != null && glucoseMax != null && glucoseMin > glucoseMax) {
      setError('Fasting glucose minimum cannot be greater than maximum.')
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

    setHealthGoals(
      formStateToHealthGoals({
        targetWeight,
        weightGoalType,
        weeklyPace: showWeeklyPace ? weeklyPace : '',
        targetSystolic,
        targetDiastolic,
        fastingGlucoseMin,
        fastingGlucoseMax,
        targetSleepHours,
        targetBedtime,
        dailyStepGoal,
        workoutsPerWeek,
        activityMinutesPerDay,
        energyTarget,
        moodTarget,
        stressTarget,
      }),
      profileId,
    )

    setSuccess('Goals saved! Your Dashboard and Daily Log will use these targets.')
  }

  function handleReset() {
    if (
      !window.confirm(
        'Reset water, macro, and step goals to app defaults? All other goal fields will be cleared.',
      )
    ) {
      return
    }
    resetGoalsToDefaults(profileId)
    applyForm(loadFormState(profileId))
    setError('')
    setSuccess('Goals reset to defaults.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">Health Goals</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Set your personal targets. These power your dashboard charts and 30-day provider report.
          {activeProfile && !activeProfile.is_primary && (
            <>
              {' '}
              Goals apply to <span className="font-medium">{activeProfile.display_name}</span>
              &apos;s profile.
            </>
          )}
        </p>
      </div>

      <Alert type="error" message={error} onDismiss={() => setError('')} />
      <Alert type="success" message={success} onDismiss={() => setSuccess('')} />

      <form onSubmit={handleSubmit} className="space-y-8">
        <GoalGroup title="Body">
          <Card className="border-l-[4px] border-l-[var(--color-sage)]">
            <Input
              label="Target weight (lbs)"
              type="number"
              min="1"
              step="0.1"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
            />
            <div className="mt-4">
              <span className="mb-2 block text-sm font-medium text-[var(--color-text)]">Goal type</span>
              <div
                className="flex rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
                role="group"
                aria-label="Goal type"
              >
                {WEIGHT_GOAL_TYPES.map(({ value, label }) => {
                  const selected = weightGoalType === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setWeightGoalType(value)
                        if (value === 'maintain') setWeeklyPace('')
                      }}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                        selected
                          ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-sm'
                          : 'text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-sage)_12%,transparent)]'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
            {showWeeklyPace && (
              <div className="mt-4">
                <label htmlFor="weekly-pace" className="block">
                  <span className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                    Weekly pace
                  </span>
                  <select
                    id="weekly-pace"
                    value={weeklyPace}
                    onChange={(e) => setWeeklyPace(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-sage)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-sage)_35%,transparent)]"
                  >
                    <option value="">Select pace</option>
                    {WEEKLY_PACE_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </Card>
        </GoalGroup>

        <GoalGroup title="Nutrition">
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
              Shown on the Dashboard macro progress card. Defaults: {DEFAULT_MACRO_GOALS.calories}{' '}
              cal, {DEFAULT_MACRO_GOALS.protein}g protein, {DEFAULT_MACRO_GOALS.carbs}g carbs,{' '}
              {DEFAULT_MACRO_GOALS.fat}g fat.
            </p>
          </Card>
        </GoalGroup>

        <GoalGroup title="Vitals">
          <Card className="border-l-[4px] border-l-[var(--color-terracotta)]">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Target systolic (mmHg)"
                type="number"
                min="1"
                step="1"
                value={targetSystolic}
                onChange={(e) => setTargetSystolic(e.target.value)}
                placeholder="e.g. 120"
              />
              <Input
                label="Target diastolic (mmHg)"
                type="number"
                min="1"
                step="1"
                value={targetDiastolic}
                onChange={(e) => setTargetDiastolic(e.target.value)}
                placeholder="e.g. 80"
              />
            </div>
            <p className="mt-4 text-sm font-medium text-[var(--color-text)]">
              Fasting blood glucose target range
            </p>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              <Input
                label="Min (mg/dL)"
                type="number"
                min="1"
                step="1"
                value={fastingGlucoseMin}
                onChange={(e) => setFastingGlucoseMin(e.target.value)}
                placeholder="70"
              />
              <Input
                label="Max (mg/dL)"
                type="number"
                min="1"
                step="1"
                value={fastingGlucoseMax}
                onChange={(e) => setFastingGlucoseMax(e.target.value)}
                placeholder="99"
              />
            </div>
          </Card>
        </GoalGroup>

        <GoalGroup title="Sleep">
          <Card className="border-l-[4px] border-l-[var(--color-sage)]">
            <Input
              label="Target sleep hours"
              type="number"
              min="0.5"
              step="0.5"
              value={targetSleepHours}
              onChange={(e) => setTargetSleepHours(e.target.value)}
              placeholder="e.g. 7.5"
            />
            <div className="mt-4">
              <Input
                label="Target bedtime (optional)"
                type="time"
                value={targetBedtime}
                onChange={(e) => setTargetBedtime(e.target.value)}
              />
            </div>
          </Card>
        </GoalGroup>

        <GoalGroup title="Movement">
          <Card className="border-l-[4px] border-l-[var(--color-sage)]">
            <Input
              label="Daily step goal"
              type="number"
              min="1"
              step="1"
              value={dailyStepGoal}
              onChange={(e) => setDailyStepGoal(e.target.value)}
              placeholder={String(DEFAULT_STEP_GOAL)}
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label="Workouts per week"
                type="number"
                min="1"
                step="1"
                value={workoutsPerWeek}
                onChange={(e) => setWorkoutsPerWeek(e.target.value)}
                placeholder="e.g. 4"
              />
              <Input
                label="Minutes of activity per day"
                type="number"
                min="1"
                step="1"
                value={activityMinutesPerDay}
                onChange={(e) => setActivityMinutesPerDay(e.target.value)}
                placeholder="e.g. 30"
              />
            </div>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              Optional — use if you prefer time-based movement goals.
            </p>
          </Card>
        </GoalGroup>

        <GoalGroup title="Wellbeing">
          <Card className="border-l-[4px] border-l-[var(--color-terracotta)]">
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Energy target"
                type="number"
                min="1"
                max="10"
                step="1"
                value={energyTarget}
                onChange={(e) => setEnergyTarget(e.target.value)}
                placeholder="1–10"
              />
              <Input
                label="Mood target"
                type="number"
                min="1"
                max="10"
                step="1"
                value={moodTarget}
                onChange={(e) => setMoodTarget(e.target.value)}
                placeholder="1–10"
              />
              <Input
                label="Stress target"
                type="number"
                min="1"
                max="10"
                step="1"
                value={stressTarget}
                onChange={(e) => setStressTarget(e.target.value)}
                placeholder="1–10"
              />
            </div>
            <p className="mt-3 text-xs text-[var(--color-muted)]">
              Your daily average will be compared to these targets on your dashboard.
            </p>
          </Card>
        </GoalGroup>

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
