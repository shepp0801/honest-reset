import type { DailyLog, MedicationCheckin, MedicationItem, WeeklyCheckin } from '../types/database'

export interface WeeklyStats {
  daysLogged: number
  avgSleepHours: number | null
  avgEnergy: number | null
  avgMood: number | null
  avgStress: number | null
  medAdherencePct: number | null
  medsTodayDisplay: string
  latestWeight: number | null
}

export function formatMedsTodayDisplay(
  medItems: MedicationItem[],
  checkins: MedicationCheckin[],
  today: string,
): string {
  const total = medItems.length
  if (total === 0) return '—'
  const done = checkins.filter((c) => c.taken_date === today).length
  if (done === 0) return '—'
  return `${done}/${total}`
}

export function computeWeeklyStats(
  logs: DailyLog[],
  medItems: MedicationItem[],
  checkins: MedicationCheckin[],
  weekStart: string,
  weekEnd: string,
  today: string,
): WeeklyStats {
  const weekLogs = logs.filter((l) => l.log_date >= weekStart && l.log_date <= weekEnd)

  const avg = (values: (number | null)[]) => {
    const valid = values.filter((v): v is number => v != null)
    if (!valid.length) return null
    return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
  }

  const weights = weekLogs.map((l) => l.weight_lbs).filter((w): w is number => w != null)
  const latestWeight = weights.length ? weights[weights.length - 1] : null

  let medAdherencePct: number | null = null
  if (medItems.length > 0) {
    const weekCheckins = checkins.filter(
      (c) => c.taken_date >= weekStart && c.taken_date <= weekEnd,
    )
    const daysInWeek = 7
    const expected = medItems.length * daysInWeek
    medAdherencePct = expected > 0 ? Math.round((weekCheckins.length / expected) * 100) : null
  }

  return {
    daysLogged: weekLogs.length,
    avgSleepHours: avg(weekLogs.map((l) => l.sleep_hours)),
    avgEnergy: avg(weekLogs.map((l) => l.energy_level)),
    avgMood: avg(weekLogs.map((l) => l.mood)),
    avgStress: avg(weekLogs.map((l) => l.stress_level)),
    medAdherencePct,
    medsTodayDisplay: formatMedsTodayDisplay(medItems, checkins, today),
    latestWeight,
  }
}

export function isCheckinComplete(checkin: WeeklyCheckin | null): boolean {
  if (!checkin) return false
  return Boolean(
    checkin.went_well?.trim() ||
      checkin.was_hard?.trim() ||
      checkin.focus_next_week?.trim(),
  )
}

export const CHECKIN_PROMPTS = {
  wentWell: {
    label: 'What went well this week?',
    hint: 'Sleep wins, movement, mood moments, boundaries — anything that felt like progress.',
    placeholder: 'e.g. Walked 4 days, slept better mid-week, said no to one thing that drained me…',
  },
  wasHard: {
    label: 'What felt hard or off?',
    hint: 'Hot flashes, fatigue, brain fog, stress, cravings — no judgment, just honest notes.',
    placeholder: 'e.g. Energy crashed Thu–Fri, hard to fall asleep, felt more irritable…',
  },
  focusNextWeek: {
    label: 'One honest focus for next week',
    hint: 'One small, realistic thing — not a full life overhaul.',
    placeholder: 'e.g. In bed by 10:30, protein at breakfast, 10-minute walk after lunch…',
  },
  providerNotes: {
    label: 'For your next provider visit (optional)',
    hint: 'Symptoms, questions, or patterns you want to mention at your appointment.',
    placeholder: 'e.g. Ask about sleep changes since starting HRT, night sweats 3x/week…',
  },
} as const
