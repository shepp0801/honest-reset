import { supabase } from './supabase'
import { daysAgoISO, formatShortDate, todayISO } from './date'
import { isA1cTest } from './labMatrix'
import type {
  BloodPressureReading,
  DailyLog,
  LabValue,
  MedicationCheckin,
  MedicationItem,
  Reflection,
  WeeklyCheckin,
} from '../types/database'
import { computeWeeklyStats } from './weeklyCheckin'
import { getWeekEndISO, getWeekStartISO } from './date'

export interface VisitSummaryData {
  generatedDate: string
  periodLabel: string
  weightLatest: number | null
  weightChange30d: number | null
  bpLatest: { systolic: number; diastolic: number; date: string } | null
  a1cLatest: { value: number; date: string } | null
  recentLabs: { testName: string; value: number; unit: string | null; date: string }[]
  avgSleep30d: number | null
  avgEnergy30d: number | null
  avgMood30d: number | null
  avgStress30d: number | null
  medAdherencePct: number | null
  activeMeds: { name: string; dosage: string | null; type: string }[]
  weeklyCheckin: WeeklyCheckin | null
  weekStats: ReturnType<typeof computeWeeklyStats>
  reflections30d: Reflection[]
}

function avg(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v != null)
  if (!valid.length) return null
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
}

export async function fetchVisitSummary(userId: string): Promise<VisitSummaryData> {
  const from30 = daysAgoISO(30)
  const weekStart = getWeekStartISO()
  const weekEnd = getWeekEndISO(weekStart)

  const [
    logsRes,
    labsRes,
    bpRes,
    medItemsRes,
    checkinsRes,
    weekCheckinRes,
    reflectionsRes,
  ] = await Promise.all([
    supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', from30)
      .order('log_date', { ascending: true }),
    supabase
      .from('lab_values')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_date', { ascending: false }),
    supabase
      .from('blood_pressure_readings')
      .select('*')
      .eq('user_id', userId)
      .gte('recorded_at', `${from30}T00:00:00`)
      .order('recorded_at', { ascending: false })
      .limit(1),
    supabase
      .from('medication_items')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .order('name'),
    supabase
      .from('medication_checkins')
      .select('*')
      .eq('user_id', userId)
      .gte('taken_date', from30),
    supabase
      .from('weekly_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .maybeSingle(),
    supabase
      .from('reflections')
      .select('*')
      .eq('user_id', userId)
      .gte('reflection_date', from30)
      .order('reflection_date', { ascending: true }),
  ])

  const logs = (logsRes.data ?? []) as DailyLog[]
  const labs = (labsRes.data ?? []) as LabValue[]
  const bpReadings = (bpRes.data ?? []) as BloodPressureReading[]
  const medItems = (medItemsRes.data ?? []) as MedicationItem[]
  const checkins = (checkinsRes.data ?? []) as MedicationCheckin[]
  const weekCheckin = (weekCheckinRes.data as WeeklyCheckin | null) ?? null

  const weightLogs = logs.filter((l) => l.weight_lbs != null)
  const weightLatest = weightLogs.length
    ? Number(weightLogs[weightLogs.length - 1].weight_lbs)
    : null
  let weightChange30d: number | null = null
  if (weightLogs.length >= 2) {
    const first = Number(weightLogs[0].weight_lbs)
    const last = Number(weightLogs[weightLogs.length - 1].weight_lbs)
    weightChange30d = Math.round((last - first) * 10) / 10
  }

  const bp = bpReadings[0]
  const bpLatest = bp
    ? {
        systolic: bp.systolic,
        diastolic: bp.diastolic,
        date: formatShortDate(bp.recorded_at.slice(0, 10)),
      }
    : null

  const a1cLab = labs.find((l) => isA1cTest(l.test_name))
  const a1cLatest = a1cLab
    ? { value: Number(a1cLab.value), date: formatShortDate(a1cLab.recorded_date) }
    : null

  const latestByTest = new Map<string, LabValue>()
  for (const lab of labs) {
    if (isA1cTest(lab.test_name)) continue
    const key = lab.test_name.toLowerCase()
    if (!latestByTest.has(key)) latestByTest.set(key, lab)
  }
  const recentLabs = [...latestByTest.values()]
    .slice(0, 8)
    .map((l) => ({
      testName: l.test_name,
      value: Number(l.value),
      unit: l.unit,
      date: formatShortDate(l.recorded_date),
    }))

  let medAdherencePct: number | null = null
  if (medItems.length > 0) {
    const expected = medItems.length * 30
    medAdherencePct = Math.round((checkins.length / expected) * 100)
  }

  const weekLogs = logs.filter((l) => l.log_date >= weekStart && l.log_date <= weekEnd)
  const weekCheckins = checkins.filter(
    (c) => c.taken_date >= weekStart && c.taken_date <= weekEnd,
  )

  return {
    generatedDate: formatShortDate(todayISO()),
    periodLabel: `Last 30 days (through ${formatShortDate(todayISO())})`,
    weightLatest,
    weightChange30d,
    bpLatest,
    a1cLatest,
    recentLabs,
    avgSleep30d: avg(logs.map((l) => l.sleep_hours)),
    avgEnergy30d: avg(logs.map((l) => l.energy_level)),
    avgMood30d: avg(logs.map((l) => l.mood)),
    avgStress30d: avg(logs.map((l) => l.stress_level)),
    medAdherencePct,
    activeMeds: medItems.map((m) => ({
      name: m.name,
      dosage: m.dosage,
      type: m.item_type,
    })),
    weeklyCheckin: weekCheckin,
    weekStats: computeWeeklyStats(weekLogs, medItems, weekCheckins, weekStart, weekEnd),
    reflections30d: ((reflectionsRes.data ?? []) as Reflection[]).filter(
      (r) => r.body?.trim() || r.mood_tag,
    ),
  }
}
