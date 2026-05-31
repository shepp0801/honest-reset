import { useEffect, useState } from 'react'
import { getChartHealthGoals, type ExtendedHealthGoals, getHealthGoals } from '../lib/healthGoals'
import { GOALS_UPDATED_EVENT, PROFILE_CHANGED_EVENT } from '../lib/plannerConstants'
import { useActiveProfileId } from '../context/ProfileContext'

export function useHealthGoals() {
  const profileId = useActiveProfileId()
  const [goals, setGoals] = useState<ExtendedHealthGoals>(() => getHealthGoals(profileId))
  const [chartGoals, setChartGoals] = useState(() => getChartHealthGoals(profileId))

  useEffect(() => {
    const refresh = () => {
      setGoals(getHealthGoals(profileId))
      setChartGoals(getChartHealthGoals(profileId))
    }
    window.addEventListener(GOALS_UPDATED_EVENT, refresh)
    window.addEventListener(PROFILE_CHANGED_EVENT, refresh)
    refresh()
    return () => {
      window.removeEventListener(GOALS_UPDATED_EVENT, refresh)
      window.removeEventListener(PROFILE_CHANGED_EVENT, refresh)
    }
  }, [profileId])

  return { goals, chartGoals }
}
