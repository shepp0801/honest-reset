import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { GOALS_UPDATED_EVENT, PROFILE_CHANGED_EVENT, getMacroGoals } from '../../lib/plannerConstants'
import { useActiveProfileId } from '../../context/ProfileContext'

interface MacroProgressCardProps {
  calories: number
  protein: number
  carbs: number
  fat: number
  compact?: boolean
}

function MacroBar({
  label,
  current,
  goal,
  unit,
}: {
  label: string
  current: number
  goal: number
  unit: string
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-[var(--color-text)]">{label}</span>
        <span className="text-[var(--color-muted)]">
          {Math.round(current)}
          {unit} / {goal}
          {unit}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-sage)_18%,transparent)]">
        <div
          className="h-full rounded-full bg-[var(--color-sage)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function MacroProgressCard({
  calories,
  protein,
  carbs,
  fat,
  compact = false,
}: MacroProgressCardProps) {
  const profileId = useActiveProfileId()
  const [goals, setGoals] = useState(() => getMacroGoals(profileId))

  useEffect(() => {
    const refresh = () => setGoals(getMacroGoals(profileId))
    window.addEventListener(GOALS_UPDATED_EVENT, refresh)
    window.addEventListener(PROFILE_CHANGED_EVENT, refresh)
    refresh()
    return () => {
      window.removeEventListener(GOALS_UPDATED_EVENT, refresh)
      window.removeEventListener(PROFILE_CHANGED_EVENT, refresh)
    }
  }, [profileId])

  return (
    <Card className={`h-full border-t-[3px] border-t-[var(--color-terracotta)] ${compact ? 'p-3' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Today&apos;s macros
        </p>
        <Link
          to="/goals"
          className="shrink-0 text-xs font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
        >
          Edit goals
        </Link>
      </div>
      <div className={`space-y-3 ${compact ? 'mt-2 space-y-2' : 'mt-4'}`}>
        <MacroBar label="Calories" current={calories} goal={goals.calories} unit="" />
        <MacroBar label="Protein" current={protein} goal={goals.protein} unit="g" />
        <MacroBar label="Carbs" current={carbs} goal={goals.carbs} unit="g" />
        <MacroBar label="Fat" current={fat} goal={goals.fat} unit="g" />
      </div>
    </Card>
  )
}
