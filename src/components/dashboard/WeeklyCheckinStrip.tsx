import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { formatWeekRange } from '../../lib/date'
import type { WeeklyDashboardData } from '../../hooks/useWeeklyDashboard'

interface WeeklyCheckinStripProps {
  data: WeeklyDashboardData
  compact?: boolean
}

function StatPill({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <div
      className={`rounded-xl bg-[color-mix(in_srgb,var(--color-sage)_10%,var(--color-surface))] text-center ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}`}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  )
}

export function WeeklyCheckinStrip({ data, compact = false }: WeeklyCheckinStripProps) {
  const { checkin, isComplete, stats, weekStart } = data
  const preview = checkin?.focus_next_week?.trim() || checkin?.went_well?.trim()

  return (
    <Card className={`border-l-[4px] border-l-[var(--color-terracotta)] ${compact ? 'p-3' : ''}`}>
      <div
        className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${compact ? 'lg:flex-row lg:items-center lg:gap-3' : ''}`}
      >
        <div className={`min-w-0 flex-1 ${compact ? 'lg:flex lg:items-center lg:gap-4' : ''}`}>
          <div className={compact ? 'lg:shrink-0' : ''}>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-terracotta)]">
              Weekly Haven check-in
            </p>
            <p
              className={`mt-1 font-display font-semibold text-[var(--color-text)] ${compact ? 'text-base lg:mt-0 lg:text-sm' : 'text-lg'}`}
            >
              Week of {formatWeekRange(weekStart)}
            </p>
          </div>
          {!compact ? (
            <>
              {isComplete ? (
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  <span className="font-medium text-[var(--color-sage)]">Complete.</span>
                  {preview && (
                    <>
                      {' '}
                      Focus: &ldquo;{preview.length > 80 ? `${preview.slice(0, 80)}…` : preview}
                      &rdquo;
                    </>
                  )}
                </p>
              ) : (
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  Take five minutes to reflect — what worked, what felt hard, and one focus for
                  next week. No perfection required.
                </p>
              )}
            </>
          ) : (
            <>
              {isComplete ? (
                <p className="mt-2 text-sm text-[var(--color-muted)] lg:hidden">
                  <span className="font-medium text-[var(--color-sage)]">Complete.</span>
                  {preview && (
                    <>
                      {' '}
                      Focus: &ldquo;{preview.length > 80 ? `${preview.slice(0, 80)}…` : preview}
                      &rdquo;
                    </>
                  )}
                </p>
              ) : (
                <p className="mt-2 text-sm text-[var(--color-muted)] lg:hidden">
                  Take five minutes to reflect — what worked, what felt hard, and one focus for
                  next week. No perfection required.
                </p>
              )}
            </>
          )}
          {compact && isComplete && preview && (
            <p className="mt-2 hidden text-xs text-[var(--color-muted)] lg:mt-0 lg:block lg:truncate">
              Focus: &ldquo;{preview.length > 60 ? `${preview.slice(0, 60)}…` : preview}&rdquo;
            </p>
          )}
        </div>
        <Link to="/check-in" className="shrink-0">
          <Button
            type="button"
            variant={isComplete ? 'secondary' : 'primary'}
            className={compact ? 'lg:px-3 lg:py-1.5 lg:text-xs' : ''}
          >
            {isComplete ? 'Review check-in' : 'Start check-in'}
          </Button>
        </Link>
      </div>

      <div
        className={`grid grid-cols-2 gap-2 sm:grid-cols-4 ${compact ? 'mt-3 lg:mt-2 lg:grid-cols-6' : 'mt-4 lg:grid-cols-6'}`}
      >
        <StatPill compact={compact} label="Days logged" value={String(stats.daysLogged)} />
        <StatPill
          compact={compact}
          label="Avg sleep"
          value={stats.avgSleepHours != null ? `${stats.avgSleepHours}h` : '—'}
        />
        <StatPill
          compact={compact}
          label="Avg energy"
          value={stats.avgEnergy != null ? String(stats.avgEnergy) : '—'}
        />
        <StatPill
          compact={compact}
          label="Avg mood"
          value={stats.avgMood != null ? String(stats.avgMood) : '—'}
        />
        {stats.latestWeight != null && (
          <StatPill compact={compact} label="Weight" value={`${stats.latestWeight} lbs`} />
        )}
        <StatPill compact={compact} label="Meds today" value={stats.medsTodayDisplay} />
      </div>
    </Card>
  )
}
