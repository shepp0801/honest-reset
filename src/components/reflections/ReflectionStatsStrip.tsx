import { Link } from 'react-router-dom'
import type { DailyLog } from '../../types/database'

function formatStat(label: string, value: string, logDate: string) {
  return (
    <Link
      to={`/?date=${logDate}`}
      className="rounded-xl bg-[color-mix(in_srgb,var(--color-sage)_10%,var(--color-surface))] px-3 py-2 text-center transition-colors hover:bg-[color-mix(in_srgb,var(--color-sage)_16%,var(--color-surface))]"
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-[var(--color-text)]">{value}</p>
    </Link>
  )
}

function dashStat(label: string) {
  return (
    <div className="rounded-xl bg-[color-mix(in_srgb,var(--color-sage)_10%,var(--color-surface))] px-3 py-2 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-[var(--color-muted)]">—</p>
    </div>
  )
}

interface ReflectionStatsStripProps {
  log: DailyLog | null
  logDate: string
}

export function ReflectionStatsStrip({ log, logDate }: ReflectionStatsStripProps) {
  const weight =
    log?.weight_lbs != null ? `${Math.round(log.weight_lbs * 10) / 10} lbs` : null
  const sleep = log?.sleep_hours != null ? `${log.sleep_hours}h` : null
  const energy = log?.energy_level != null ? String(log.energy_level) : null
  const mood = log?.mood != null ? String(log.mood) : null
  const steps =
    log?.steps != null ? Number(log.steps).toLocaleString() : null

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {weight ? formatStat('Weight', weight, logDate) : dashStat('Weight')}
      {sleep ? formatStat('Sleep', sleep, logDate) : dashStat('Sleep')}
      {energy ? formatStat('Energy', energy, logDate) : dashStat('Energy')}
      {mood ? formatStat('Mood', mood, logDate) : dashStat('Mood')}
      {steps ? formatStat('Steps', steps, logDate) : dashStat('Steps')}
    </div>
  )
}
