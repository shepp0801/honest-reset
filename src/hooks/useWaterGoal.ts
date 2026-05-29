import { useEffect, useState } from 'react'
import { GOALS_UPDATED_EVENT, PROFILE_CHANGED_EVENT, getWaterGoalOz } from '../lib/plannerConstants'
import { useActiveProfileId } from '../context/ProfileContext'

export function useWaterGoal() {
  const profileId = useActiveProfileId()
  const [goal, setGoal] = useState(() => getWaterGoalOz(profileId))

  useEffect(() => {
    const refresh = () => setGoal(getWaterGoalOz(profileId))
    window.addEventListener(GOALS_UPDATED_EVENT, refresh)
    window.addEventListener(PROFILE_CHANGED_EVENT, refresh)
    refresh()
    return () => {
      window.removeEventListener(GOALS_UPDATED_EVENT, refresh)
      window.removeEventListener(PROFILE_CHANGED_EVENT, refresh)
    }
  }, [profileId])

  return goal
}
