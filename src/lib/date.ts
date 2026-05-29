export function todayISO(): string {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

export function formatDisplayDate(iso: string): string {
  const [y, m, day] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, day)
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatShortDate(iso: string): string {
  const [y, m, day] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, day)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

export function formatChartDate(iso: string): string {
  const [y, m, day] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, day)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function nowTimeLocal(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function toRecordedAtISO(date: string, time: string): string {
  const [y, m, day] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y, m - 1, day, hh, mm).toISOString()
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function isoToDateAndTime(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` }
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, day] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, day)
  date.setDate(date.getDate() + days)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

/** e.g. "Monday, May 26 2025" for Daily Planner header */
export function formatPlannerNavDate(iso: string): string {
  const [y, m, day] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, day)
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' })
  const month = date.toLocaleDateString(undefined, { month: 'long' })
  return `${weekday}, ${month} ${day} ${y}`
}

export function formatCompactNavDate(iso: string): string {
  const [y, m, day] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, day)
  const today = todayISO()
  const isToday = iso === today
  const weekday = date.toLocaleDateString(undefined, { weekday: isToday ? 'long' : 'short' })
  const rest = date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
  return isToday ? `Today · ${rest}` : `${weekday}, ${rest}`
}

/** Sleep hours from HH:MM bedtime and wake time; handles crossing midnight */
export function calcSleepHours(bedtime: string, wakeTime: string): number | null {
  if (!bedtime || !wakeTime) return null
  const [bh, bm] = bedtime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  let bedMins = bh * 60 + bm
  let wakeMins = wh * 60 + wm
  if (wakeMins <= bedMins) wakeMins += 24 * 60
  return Math.round(((wakeMins - bedMins) / 60) * 10) / 10
}

/** Monday of the week containing `iso` (local calendar) */
export function getWeekStartISO(iso: string = todayISO()): string {
  const [y, m, day] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, day)
  const dow = date.getDay()
  const toMonday = dow === 0 ? -6 : 1 - dow
  date.setDate(date.getDate() + toMonday)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

export function getWeekEndISO(weekStart: string): string {
  return addDaysISO(weekStart, 6)
}

export function formatWeekRange(weekStart: string): string {
  const end = getWeekEndISO(weekStart)
  const startLabel = formatShortDate(weekStart)
  const endLabel = formatShortDate(end)
  return `${startLabel} – ${endLabel}`
}

export function addWeeksISO(weekStart: string, weeks: number): string {
  return addDaysISO(weekStart, weeks * 7)
}
