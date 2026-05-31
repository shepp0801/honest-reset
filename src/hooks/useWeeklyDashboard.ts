import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  addWeeksISO,
  getWeekEndISO,
  getWeekStartISO,
  todayISO,
} from '../lib/date'
import { computeWeeklyStats, isCheckinComplete } from '../lib/weeklyCheckin'
import type { DailyLog, MedicationCheckin, MedicationItem, WeeklyCheckin } from '../types/database'
import type { WeeklyStats } from '../lib/weeklyCheckin'

export interface WeeklyDashboardData {
  weekStart: string
  weekEnd: string
  checkin: WeeklyCheckin | null
  isComplete: boolean
  stats: WeeklyStats
}

export function useWeeklyDashboard(userId: string | undefined, weekStart?: string) {
  const [data, setData] = useState<WeeklyDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const activeWeekStart = weekStart ?? getWeekStartISO(todayISO())

  const fetchData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    const weekEnd = getWeekEndISO(activeWeekStart)

    const [checkinRes, logsRes, medItemsRes, checkinsRes] = await Promise.all([
      supabase
        .from('weekly_checkins')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', activeWeekStart)
        .maybeSingle(),
      supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', activeWeekStart)
        .lte('log_date', weekEnd),
      supabase
        .from('medication_items')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true),
      supabase
        .from('medication_checkins')
        .select('*')
        .eq('user_id', userId)
        .gte('taken_date', activeWeekStart)
        .lte('taken_date', weekEnd),
    ])

    if (checkinRes.error || logsRes.error || medItemsRes.error || checkinsRes.error) {
      setError(
        checkinRes.error?.message ??
          logsRes.error?.message ??
          medItemsRes.error?.message ??
          checkinsRes.error?.message ??
          'Failed to load weekly data',
      )
      setLoading(false)
      return
    }

    const checkin = (checkinRes.data as WeeklyCheckin | null) ?? null
    const logs = (logsRes.data as DailyLog[]) ?? []
    const medItems = (medItemsRes.data as MedicationItem[]) ?? []
    const medCheckins = (checkinsRes.data as MedicationCheckin[]) ?? []

    setData({
      weekStart: activeWeekStart,
      weekEnd,
      checkin,
      isComplete: isCheckinComplete(checkin),
      stats: computeWeeklyStats(
        logs,
        medItems,
        medCheckins,
        activeWeekStart,
        weekEnd,
        todayISO(),
      ),
    })
    setLoading(false)
  }, [userId, activeWeekStart])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData, activeWeekStart }
}

export { addWeeksISO, getWeekStartISO }
