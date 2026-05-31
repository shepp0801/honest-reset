import { GOALS_UPDATED_EVENT } from './plannerConstants'

export const DEFAULT_STEP_GOAL = 8000

export type WeightGoalType = 'lose' | 'maintain' | 'gain'

export type ExtendedHealthGoals = {
  targetWeightLbs: number | null
  weightGoalType: WeightGoalType | null
  weeklyPaceLbs: number | null
  targetSystolic: number | null
  targetDiastolic: number | null
  fastingGlucoseMin: number | null
  fastingGlucoseMax: number | null
  targetSleepHours: number | null
  targetBedtime: string | null
  dailyStepGoal: number | null
  workoutsPerWeek: number | null
  activityMinutesPerDay: number | null
  energyTarget: number | null
  moodTarget: number | null
  stressTarget: number | null
}

export const WEEKLY_PACE_OPTIONS = [
  { value: 0.5, label: '0.5 lbs/week' },
  { value: 1, label: '1 lb/week' },
  { value: 1.5, label: '1.5 lbs/week' },
  { value: 2, label: '2 lbs/week' },
] as const

const HEALTH_GOALS_KEY = 'honest-reset-health-goals'

export const EMPTY_HEALTH_GOALS: ExtendedHealthGoals = {
  targetWeightLbs: null,
  weightGoalType: null,
  weeklyPaceLbs: null,
  targetSystolic: null,
  targetDiastolic: null,
  fastingGlucoseMin: null,
  fastingGlucoseMax: null,
  targetSleepHours: null,
  targetBedtime: null,
  dailyStepGoal: null,
  workoutsPerWeek: null,
  activityMinutesPerDay: null,
  energyTarget: null,
  moodTarget: null,
  stressTarget: null,
}

function goalsKey(profileId?: string) {
  return profileId ? `${HEALTH_GOALS_KEY}-${profileId}` : HEALTH_GOALS_KEY
}

function notifyGoalsUpdated() {
  window.dispatchEvent(new Event(GOALS_UPDATED_EVENT))
}

function positiveOrNull(value: unknown): number | null {
  const n = Number(value)
  if (value == null || value === '' || Number.isNaN(n) || n <= 0) return null
  return n
}

function scaleOrNull(value: unknown): number | null {
  const n = Number(value)
  if (value == null || value === '' || Number.isNaN(n) || n < 1 || n > 10) return null
  return Math.round(n)
}

export function parseStoredHealthGoals(raw: string | null): ExtendedHealthGoals {
  if (!raw) return { ...EMPTY_HEALTH_GOALS }
  try {
    const parsed = JSON.parse(raw) as Partial<ExtendedHealthGoals>
    const weightGoalType = parsed.weightGoalType
    const validType =
      weightGoalType === 'lose' || weightGoalType === 'maintain' || weightGoalType === 'gain'
        ? weightGoalType
        : null
    return {
      targetWeightLbs: positiveOrNull(parsed.targetWeightLbs),
      weightGoalType: validType,
      weeklyPaceLbs: positiveOrNull(parsed.weeklyPaceLbs),
      targetSystolic: positiveOrNull(parsed.targetSystolic),
      targetDiastolic: positiveOrNull(parsed.targetDiastolic),
      fastingGlucoseMin: positiveOrNull(parsed.fastingGlucoseMin),
      fastingGlucoseMax: positiveOrNull(parsed.fastingGlucoseMax),
      targetSleepHours: positiveOrNull(parsed.targetSleepHours),
      targetBedtime:
        typeof parsed.targetBedtime === 'string' && parsed.targetBedtime.trim()
          ? parsed.targetBedtime.trim()
          : null,
      dailyStepGoal: positiveOrNull(parsed.dailyStepGoal),
      workoutsPerWeek: positiveOrNull(parsed.workoutsPerWeek),
      activityMinutesPerDay: positiveOrNull(parsed.activityMinutesPerDay),
      energyTarget: scaleOrNull(parsed.energyTarget),
      moodTarget: scaleOrNull(parsed.moodTarget),
      stressTarget: scaleOrNull(parsed.stressTarget),
    }
  } catch {
    return { ...EMPTY_HEALTH_GOALS }
  }
}

export function getHealthGoals(profileId?: string): ExtendedHealthGoals {
  const scopedKey = goalsKey(profileId)
  const stored =
    localStorage.getItem(scopedKey) ?? (profileId ? localStorage.getItem(HEALTH_GOALS_KEY) : null)
  return parseStoredHealthGoals(stored)
}

export function setHealthGoals(goals: ExtendedHealthGoals, profileId?: string) {
  localStorage.setItem(goalsKey(profileId), JSON.stringify(goals))
  notifyGoalsUpdated()
}

export function getDailyStepGoal(profileId?: string): number {
  const stored = getHealthGoals(profileId).dailyStepGoal
  return stored ?? DEFAULT_STEP_GOAL
}

/** Values explicitly saved for chart reference lines (null = no line). */
export function getChartHealthGoals(profileId?: string) {
  const g = getHealthGoals(profileId)
  return {
    targetWeightLbs: g.targetWeightLbs,
    targetSystolic: g.targetSystolic,
    targetDiastolic: g.targetDiastolic,
    dailyStepGoal: g.dailyStepGoal,
  }
}

export function resetExtendedHealthGoals(profileId?: string) {
  setHealthGoals(
    {
      ...EMPTY_HEALTH_GOALS,
      dailyStepGoal: DEFAULT_STEP_GOAL,
    },
    profileId,
  )
}

export function healthGoalsToFormState(
  goals: ExtendedHealthGoals,
  stepGoalDisplay: number,
): Record<string, string> {
  return {
    targetWeight: goals.targetWeightLbs?.toString() ?? '',
    weightGoalType: goals.weightGoalType ?? '',
    weeklyPace: goals.weeklyPaceLbs?.toString() ?? '',
    targetSystolic: goals.targetSystolic?.toString() ?? '',
    targetDiastolic: goals.targetDiastolic?.toString() ?? '',
    fastingGlucoseMin: goals.fastingGlucoseMin?.toString() ?? '',
    fastingGlucoseMax: goals.fastingGlucoseMax?.toString() ?? '',
    targetSleepHours: goals.targetSleepHours?.toString() ?? '',
    targetBedtime: goals.targetBedtime ?? '',
    dailyStepGoal: String(stepGoalDisplay),
    workoutsPerWeek: goals.workoutsPerWeek?.toString() ?? '',
    activityMinutesPerDay: goals.activityMinutesPerDay?.toString() ?? '',
    energyTarget: goals.energyTarget?.toString() ?? '',
    moodTarget: goals.moodTarget?.toString() ?? '',
    stressTarget: goals.stressTarget?.toString() ?? '',
  }
}

export function formStateToHealthGoals(form: {
  targetWeight: string
  weightGoalType: string
  weeklyPace: string
  targetSystolic: string
  targetDiastolic: string
  fastingGlucoseMin: string
  fastingGlucoseMax: string
  targetSleepHours: string
  targetBedtime: string
  dailyStepGoal: string
  workoutsPerWeek: string
  activityMinutesPerDay: string
  energyTarget: string
  moodTarget: string
  stressTarget: string
}): ExtendedHealthGoals {
  const weightGoalType = form.weightGoalType as WeightGoalType | ''
  const validType =
    weightGoalType === 'lose' || weightGoalType === 'maintain' || weightGoalType === 'gain'
      ? weightGoalType
      : null
  const weeklyPace = positiveOrNull(form.weeklyPace)
  return {
    targetWeightLbs: positiveOrNull(form.targetWeight),
    weightGoalType: validType,
    weeklyPaceLbs:
      validType === 'lose' || validType === 'gain' ? weeklyPace : null,
    targetSystolic: positiveOrNull(form.targetSystolic),
    targetDiastolic: positiveOrNull(form.targetDiastolic),
    fastingGlucoseMin: positiveOrNull(form.fastingGlucoseMin),
    fastingGlucoseMax: positiveOrNull(form.fastingGlucoseMax),
    targetSleepHours: positiveOrNull(form.targetSleepHours),
    targetBedtime: form.targetBedtime.trim() || null,
    dailyStepGoal: positiveOrNull(form.dailyStepGoal) ?? DEFAULT_STEP_GOAL,
    workoutsPerWeek: positiveOrNull(form.workoutsPerWeek),
    activityMinutesPerDay: positiveOrNull(form.activityMinutesPerDay),
    energyTarget: scaleOrNull(form.energyTarget),
    moodTarget: scaleOrNull(form.moodTarget),
    stressTarget: scaleOrNull(form.stressTarget),
  }
}
