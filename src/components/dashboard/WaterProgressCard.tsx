import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useWaterGoal } from '../../hooks/useWaterGoal'

interface WaterProgressCardProps {
  ounces: number
  waterAmount: string
  waterSaving: boolean
  onWaterAmountChange: (value: string) => void
  onAddWater: (ounces: number) => void
  onCustomAdd: () => void
  compact?: boolean
}

export function WaterProgressCard({
  ounces,
  waterAmount,
  waterSaving,
  onWaterAmountChange,
  onAddWater,
  onCustomAdd,
  compact = false,
}: WaterProgressCardProps) {
  const goal = useWaterGoal()
  const pct = goal > 0 ? Math.min(100, Math.round((ounces / goal) * 100)) : 0

  return (
    <Card className={`h-full border-t-[3px] border-t-[var(--color-sage)] ${compact ? 'p-3' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Water today
        </p>
        <Link
          to="/goals"
          className="shrink-0 text-xs font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
        >
          Edit goals
        </Link>
      </div>
      <p
        className={`font-display font-bold text-[var(--color-text)] ${compact ? 'mt-1 text-2xl' : 'mt-2 text-3xl'}`}
      >
        {Math.round(ounces * 10) / 10}
        <span className="ml-1 text-base font-normal text-[var(--color-muted)]">oz</span>
      </p>
      <p className={`text-sm text-[var(--color-muted)] ${compact ? 'mt-0.5' : 'mt-1'}`}>
        {pct}% of {goal} oz goal
      </p>
      <div
        className={`overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-sage)_18%,transparent)] ${compact ? 'mt-2 h-2' : 'mt-4 h-3'}`}
      >
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className={`border-t border-[var(--color-border)] ${compact ? 'mt-3 pt-3' : 'mt-5 pt-4'}`}>
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-sage)]">
          Quick add
        </p>
        <div className={`mt-2 ${compact ? 'flex flex-wrap items-center gap-2' : ''}`}>
          <div className={`grid grid-cols-3 gap-2 ${compact ? 'contents' : ''}`}>
            {[8, 12, 16].map((amount) => (
              <Button
                key={amount}
                type="button"
                variant="secondary"
                className={`px-2 py-2 text-xs ${compact ? 'shrink-0' : ''}`}
                disabled={waterSaving}
                onClick={() => onAddWater(amount)}
              >
                +{amount} oz
              </Button>
            ))}
          </div>
          <div className={`flex gap-2 ${compact ? 'min-w-[9rem] flex-1' : 'mt-2'}`}>
            <input
              aria-label="Custom water ounces"
              type="number"
              min="1"
              step="1"
              value={waterAmount}
              onChange={(e) => onWaterAmountChange(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-sage)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-sage)_35%,transparent)]"
            />
            <Button type="button" variant="primary" disabled={waterSaving} onClick={onCustomAdd}>
              Add
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
