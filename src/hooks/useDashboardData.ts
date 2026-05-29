import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { daysAgoISO, formatChartDate, todayISO } from '../lib/date'
import type { BpChartPoint } from '../components/charts/BpTrendChart'
import type { ChartPoint } from '../components/charts/TrendChart'
import type { BloodPressureReading, DailyLog, FoodEntry, LabValue } from '../types/database'

export interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface DashboardSummary {
  /** Most recent weight from any daily log */
  lastWeightLbs: number | null
  /** Steps from today's daily log only */
  todaySteps: number | null
  /** Water from today's daily log only */
  todayWaterOz: number | null
  /** Sum of food entry calories for today only */
  todayCalories: number
  todayMacros: MacroTotals
}

export interface DashboardData {
  summary: DashboardSummary
  weightChart: ChartPoint[]
  stepsChart: ChartPoint[]
  a1cChart: ChartPoint[]
  bloodPressureChart: BpChartPoint[]
}

export function useDashboardData(userId: string | undefined) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    const today = todayISO()
    const from30 = daysAgoISO(30)

    const from30Start = `${from30}T00:00:00`

    const [dailyRes, labsRes, lastWeightRes, todayFoodRes, bpRes] = await Promise.all([
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
        .ilike('test_name', '%a1c%')
        .order('recorded_date', { ascending: true }),
      supabase
        .from('daily_logs')
        .select('weight_lbs')
        .eq('user_id', userId)
        .not('weight_lbs', 'is', null)
        .order('log_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('food_entries')
        .select('calories, protein_g, carbs_g, fat_g')
        .eq('user_id', userId)
        .eq('log_date', today),
      supabase
        .from('blood_pressure_readings')
        .select('*')
        .eq('user_id', userId)
        .gte('recorded_at', from30Start)
        .order('recorded_at', { ascending: true }),
    ])

    if (
      dailyRes.error ||
      labsRes.error ||
      lastWeightRes.error ||
      todayFoodRes.error ||
      bpRes.error
    ) {
      setError(
        dailyRes.error?.message ??
          labsRes.error?.message ??
          lastWeightRes.error?.message ??
          todayFoodRes.error?.message ??
          bpRes.error?.message ??
          'Failed to load dashboard',
      )
      setLoading(false)
      return
    }

    const logs = (dailyRes.data ?? []) as DailyLog[]
    const labs = (labsRes.data ?? []) as LabValue[]
    const bpReadings = (bpRes.data ?? []) as BloodPressureReading[]

    const todayLog = logs.find((l) => l.log_date === today)
    const todayFoods = (todayFoodRes.data ?? []) as Pick<
      FoodEntry,
      'calories' | 'protein_g' | 'carbs_g' | 'fat_g'
    >[]
    const todayCalories = todayFoods.reduce((sum, f) => sum + (f.calories ?? 0), 0)
    const todayMacros: MacroTotals = todayFoods.reduce(
      (acc, f) => ({
        calories: acc.calories + (f.calories ?? 0),
        protein: acc.protein + (f.protein_g ?? 0),
        carbs: acc.carbs + (f.carbs_g ?? 0),
        fat: acc.fat + (f.fat_g ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
    const lastWeight = lastWeightRes.data?.weight_lbs ?? null

    const weightChart: ChartPoint[] = logs
      .filter((l) => l.weight_lbs != null)
      .map((l) => ({
        date: l.log_date,
        label: formatChartDate(l.log_date),
        value: Number(l.weight_lbs),
      }))

    const stepsChart: ChartPoint[] = logs
      .filter((l) => l.steps != null)
      .map((l) => ({
        date: l.log_date,
        label: formatChartDate(l.log_date),
        value: Number(l.steps),
      }))

    const bloodPressureChart: BpChartPoint[] = bpReadings.map((r) => ({
      date: r.recorded_at,
      label: formatChartDate(r.recorded_at.slice(0, 10)),
      systolic: r.systolic,
      diastolic: r.diastolic,
    }))

    const a1cChart: ChartPoint[] = labs.map((l) => ({
      date: l.recorded_date,
      label: formatChartDate(l.recorded_date),
      value: Number(l.value),
    }))

    setData({
      summary: {
        lastWeightLbs: lastWeight != null ? Number(lastWeight) : null,
        todaySteps: todayLog?.steps ?? null,
        todayWaterOz: todayLog?.water_oz ?? null,
        todayCalories,
        todayMacros,
      },
      weightChart,
      stepsChart,
      a1cChart,
      bloodPressureChart,
    })
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
