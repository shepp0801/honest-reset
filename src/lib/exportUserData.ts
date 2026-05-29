import { supabase } from './supabase'
import { getMacroGoals, getWaterGoalOz } from './plannerConstants'
import type {
  BloodPressureReading,
  DailyLog,
  FoodEntry,
  HealthProfile,
  LabValue,
  Medication,
  MedicationCheckin,
  MedicationItem,
  Supplement,
  WeeklyCheckin,
  Workout,
} from '../types/database'

export interface UserDataExport {
  exportedAt: string
  accountOwnerId: string
  profiles: HealthProfile[]
  preferences: {
    theme: string | null
    goalsByProfile: Record<
      string,
      { waterGoalOz: number; macroGoals: ReturnType<typeof getMacroGoals> }
    >
  }
  data: {
    daily_logs: DailyLog[]
    food_entries: FoodEntry[]
    lab_values: LabValue[]
    workouts: Workout[]
    blood_pressure_readings: BloodPressureReading[]
    medication_items: MedicationItem[]
    medication_checkins: MedicationCheckin[]
    weekly_checkins: WeeklyCheckin[]
    supplements: Supplement[]
    medications: Medication[]
  }
}

const EXPORT_TABLES = [
  'daily_logs',
  'food_entries',
  'lab_values',
  'workouts',
  'blood_pressure_readings',
  'medication_items',
  'medication_checkins',
  'weekly_checkins',
  'supplements',
  'medications',
] as const

export async function fetchUserDataExport(
  accountOwnerId: string,
  profileIds: string[],
): Promise<UserDataExport> {
  const profilesRes = await supabase
    .from('health_profiles')
    .select('*')
    .eq('account_owner_id', accountOwnerId)
    .order('is_primary', { ascending: false })

  const profiles = (profilesRes.data ?? []) as HealthProfile[]

  const queries = EXPORT_TABLES.map((table) =>
    supabase
      .from(table)
      .select('*')
      .in('user_id', profileIds)
      .order('created_at', { ascending: true }),
  )

  const results = await Promise.all(queries)

  const firstError = results.find((r) => r.error)?.error
  if (firstError) throw new Error(firstError.message)

  const goalsByProfile: UserDataExport['preferences']['goalsByProfile'] = {}
  for (const profileId of profileIds) {
    goalsByProfile[profileId] = {
      waterGoalOz: getWaterGoalOz(profileId),
      macroGoals: getMacroGoals(profileId),
    }
  }

  return {
    exportedAt: new Date().toISOString(),
    accountOwnerId,
    profiles,
    preferences: {
      theme: localStorage.getItem('theme'),
      goalsByProfile,
    },
    data: {
      daily_logs: (results[0].data ?? []) as DailyLog[],
      food_entries: (results[1].data ?? []) as FoodEntry[],
      lab_values: (results[2].data ?? []) as LabValue[],
      workouts: (results[3].data ?? []) as Workout[],
      blood_pressure_readings: (results[4].data ?? []) as BloodPressureReading[],
      medication_items: (results[5].data ?? []) as MedicationItem[],
      medication_checkins: (results[6].data ?? []) as MedicationCheckin[],
      weekly_checkins: (results[7].data ?? []) as WeeklyCheckin[],
      supplements: (results[8].data ?? []) as Supplement[],
      medications: (results[9].data ?? []) as Medication[],
    },
  }
}

export function downloadJsonExport(payload: UserDataExport) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const date = payload.exportedAt.slice(0, 10)
  anchor.href = url
  anchor.download = `honest-reset-export-${date}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function deleteOwnAccount(): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('delete_own_account')
  return { error: error?.message ?? null }
}

export function clearLocalAppData() {
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (
      key &&
      (key.startsWith('honest-reset-') || key === 'theme')
    ) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key))
}
