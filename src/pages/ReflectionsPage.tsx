import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ReflectionStatsStrip } from '../components/reflections/ReflectionStatsStrip'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useActiveProfileId, useProfile } from '../context/ProfileContext'
import {
  addDaysISO,
  formatPlannerNavDate,
  formatShortDate,
  todayISO,
} from '../lib/date'
import { getReflectionPromptForDate } from '../lib/reflectionPrompts'
import {
  MOOD_TAGS,
  fetchReflection,
  fetchReflectionList,
  isMoodTag,
  migrateDailyLogNotesToReflection,
  saveReflection,
  truncateReflectionPreview,
} from '../lib/reflections'
import { supabase } from '../lib/supabase'
import type { DailyLog, MoodTag, Reflection } from '../types/database'

function moodPillClass(selected: boolean): string {
  return `rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
    selected
      ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-sm'
      : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-sage)_12%,transparent)]'
  }`
}

export function ReflectionsPage() {
  const profileId = useActiveProfileId()
  const { activeProfile } = useProfile()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialDate = searchParams.get('date')
  const [reflectionDate, setReflectionDate] = useState(() =>
    initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? initialDate : todayISO(),
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [error, setError] = useState('')
  const [body, setBody] = useState('')
  const [moodTag, setMoodTag] = useState<MoodTag | null>(null)
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null)
  const [pastEntries, setPastEntries] = useState<Reflection[]>([])
  const [showPastMobile, setShowPastMobile] = useState(false)

  const loadIdRef = useRef(0)
  const saveRef = useRef<() => Promise<void>>(async () => {})
  const skipAutoSaveRef = useRef(true)

  const today = todayISO()
  const canGoForward = reflectionDate < today
  const prompt = getReflectionPromptForDate(reflectionDate)

  const loadDay = useCallback(async () => {
    if (!profileId) return
    const loadId = ++loadIdRef.current
    setLoading(true)
    setError('')

    const [logRes, reflectionRes, listRes] = await Promise.all([
      supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', profileId)
        .eq('log_date', reflectionDate)
        .maybeSingle(),
      supabase
        .from('reflections')
        .select('*')
        .eq('user_id', profileId)
        .eq('reflection_date', reflectionDate)
        .maybeSingle(),
      supabase
        .from('reflections')
        .select('*')
        .eq('user_id', profileId)
        .order('reflection_date', { ascending: false }),
    ])

    if (logRes.error || reflectionRes.error || listRes.error) {
      if (loadId === loadIdRef.current) {
        setError('Could not load reflection for this day.')
        setLoading(false)
      }
      return
    }

    if (loadId !== loadIdRef.current) return

    const log = logRes.data as DailyLog | null
    if (log?.notes?.trim()) {
      await migrateDailyLogNotesToReflection(profileId, reflectionDate, log.notes)
      const migrated = await fetchReflection(profileId, reflectionDate)
      applyEntry(migrated, log)
    } else {
      applyEntry((reflectionRes.data as Reflection | null) ?? null, log)
    }

    setPastEntries((listRes.data as Reflection[]) ?? [])
    skipAutoSaveRef.current = true
    setLoading(false)
  }, [profileId, reflectionDate])

  function applyEntry(reflection: Reflection | null, log: DailyLog | null) {
    setBody(reflection?.body ?? '')
    const tag = reflection?.mood_tag
    setMoodTag(tag && isMoodTag(tag) ? tag : null)
    setDailyLog(log)
  }

  useEffect(() => {
    void loadDay()
  }, [loadDay])

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (reflectionDate === todayISO()) next.delete('date')
        else next.set('date', reflectionDate)
        return next
      },
      { replace: true },
    )
  }, [reflectionDate, setSearchParams])

  const persistReflection = useCallback(async () => {
    if (!profileId || saving) return
    setSaving(true)
    setError('')
    try {
      await saveReflection(profileId, reflectionDate, body, moodTag)
      setSavedFlash(true)
      const list = await fetchReflectionList(profileId)
      setPastEntries(list)
      window.setTimeout(() => setSavedFlash(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save reflection.')
    } finally {
      setSaving(false)
    }
  }, [profileId, reflectionDate, body, moodTag, saving])

  saveRef.current = persistReflection

  useEffect(() => {
    if (loading) return
    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false
      return
    }
    const timer = window.setTimeout(() => {
      void saveRef.current()
    }, 2000)
    return () => window.clearTimeout(timer)
  }, [body, moodTag, reflectionDate, loading])

  function goToPreviousDay() {
    setReflectionDate((d) => addDaysISO(d, -1))
  }

  function goToNextDay() {
    if (!canGoForward) return
    setReflectionDate((d) => addDaysISO(d, 1))
  }

  function goToToday() {
    setReflectionDate(todayISO())
  }

  function selectPastEntry(entry: Reflection) {
    setReflectionDate(entry.reflection_date)
    setShowPastMobile(false)
  }

  const pastList = (
    <Card className="flex max-h-[32rem] flex-col border-l-[4px] border-l-[var(--color-sage)] lg:max-h-none lg:h-full">
      <h2 className="shrink-0 font-display text-lg font-semibold text-[var(--color-text)]">
        Past reflections
      </h2>
      {pastEntries.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-muted)]">No past entries yet.</p>
      ) : (
        <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {pastEntries.map((entry) => {
            const selected = entry.reflection_date === reflectionDate
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => selectPastEntry(entry)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    selected
                      ? 'border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,var(--color-surface-elevated))]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[color-mix(in_srgb,var(--color-sage)_8%,transparent)]'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--color-text)]">
                      {formatShortDate(entry.reflection_date)}
                    </span>
                    {entry.mood_tag ? (
                      <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-on-accent)]">
                        {entry.mood_tag}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {truncateReflectionPreview(entry.body)}
                  </p>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )

  const editor = (
    <Card className="border-l-[4px] border-l-[var(--color-terracotta)]">
      <ReflectionStatsStrip log={dailyLog} logDate={reflectionDate} />

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          How are you feeling?
        </p>
        <div className="flex flex-wrap gap-2">
          {MOOD_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={moodPillClass(moodTag === tag)}
              onClick={() => setMoodTag((current) => (current === tag ? null : tag))}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-sage)_6%,var(--color-surface-elevated))] px-3 py-2.5">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Today&apos;s prompt
        </p>
        <p className="mt-1 font-display text-sm italic text-[var(--color-text)]">{prompt}</p>
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium text-[var(--color-text)]">
          Your reflection
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="This is your space. Write whatever feels true today."
          rows={12}
          className="min-h-[220px] w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-sage)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-sage)_35%,transparent)]"
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" disabled={saving} onClick={() => void persistReflection()}>
          {saving ? 'Saving...' : 'Save reflection'}
        </Button>
        {savedFlash ? (
          <span className="text-sm text-[var(--color-muted)]">Saved</span>
        ) : null}
        <Link
          to={`/?date=${reflectionDate}`}
          className="text-sm font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
        >
          Open Daily Log for this day
        </Link>
      </div>
    </Card>
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">Reflections</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          A private journal for honest notes — separate from your daily vitals and check-ins.
          {activeProfile && !activeProfile.is_primary && (
            <>
              {' '}
              Entries apply to{' '}
              <span className="font-medium">{activeProfile.display_name}</span>&apos;s profile.
            </>
          )}
        </p>
      </div>

      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous day"
            onClick={goToPreviousDay}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-xl text-[var(--color-text)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-sage)_12%,transparent)]"
          >
            ←
          </button>

          <p className="min-w-0 flex-1 text-center font-display text-sm font-semibold leading-snug text-[var(--color-text)] sm:text-base">
            {formatPlannerNavDate(reflectionDate)}
          </p>

          <button
            type="button"
            aria-label="Next day"
            onClick={goToNextDay}
            disabled={!canGoForward}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-xl transition-colors enabled:text-[var(--color-text)] enabled:hover:bg-[color-mix(in_srgb,var(--color-sage)_12%,transparent)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            →
          </button>
        </div>

        {reflectionDate !== today && (
          <div className="flex justify-center">
            <Button type="button" variant="secondary" className="px-4 py-1.5 text-sm" onClick={goToToday}>
              Today
            </Button>
          </div>
        )}
      </header>

      <Alert type="error" message={error} onDismiss={() => setError('')} />

      {loading ? (
        <LoadingSpinner label="Loading reflection..." />
      ) : (
        <>
          <div className="lg:hidden">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowPastMobile((o) => !o)}
            >
              {showPastMobile ? 'Hide past reflections' : 'Past reflections'}
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
            <div className={showPastMobile ? 'hidden lg:block' : ''}>{editor}</div>
            <div className={`${showPastMobile ? 'block' : 'hidden'} lg:block`}>{pastList}</div>
          </div>
        </>
      )}
    </div>
  )
}
