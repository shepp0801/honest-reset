import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useActiveProfileId } from '../context/ProfileContext'
import { supabase } from '../lib/supabase'
import {
  addWeeksISO,
  formatWeekRange,
  getWeekStartISO,
  todayISO,
} from '../lib/date'
import { CHECKIN_PROMPTS, isCheckinComplete } from '../lib/weeklyCheckin'
import { useWeeklyDashboard } from '../hooks/useWeeklyDashboard'
import { WeeklyCheckinStrip } from '../components/dashboard/WeeklyCheckinStrip'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Textarea } from '../components/ui/Textarea'
import type { WeeklyCheckin } from '../types/database'

export function WeeklyCheckinPage() {
  const { user } = useAuth()
  const profileId = useActiveProfileId()
  const [weekStart, setWeekStart] = useState(() => getWeekStartISO(todayISO()))
  const { data, loading, error, refetch } = useWeeklyDashboard(profileId, weekStart)

  const [wentWell, setWentWell] = useState('')
  const [wasHard, setWasHard] = useState('')
  const [focusNextWeek, setFocusNextWeek] = useState('')
  const [providerNotes, setProviderNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [success, setSuccess] = useState('')

  const populateForm = useCallback((checkin: WeeklyCheckin | null) => {
    setWentWell(checkin?.went_well ?? '')
    setWasHard(checkin?.was_hard ?? '')
    setFocusNextWeek(checkin?.focus_next_week ?? '')
    setProviderNotes(checkin?.provider_notes ?? '')
  }, [])

  useEffect(() => {
    populateForm(data?.checkin ?? null)
  }, [data?.checkin, populateForm])

  const currentWeekStart = getWeekStartISO(todayISO())
  const canGoForward = weekStart < currentWeekStart

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !profileId) return

    if (!wentWell.trim() && !wasHard.trim() && !focusNextWeek.trim()) {
      setSaveError('Please fill in at least one reflection field.')
      return
    }

    setSaving(true)
    setSaveError('')
    setSuccess('')

    const payload = {
      user_id: profileId,
      week_start: weekStart,
      went_well: wentWell.trim() || null,
      was_hard: wasHard.trim() || null,
      focus_next_week: focusNextWeek.trim() || null,
      provider_notes: providerNotes.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { error: saveErr } = data?.checkin
      ? await supabase
          .from('weekly_checkins')
          .update(payload)
          .eq('id', data.checkin.id)
          .eq('user_id', profileId)
      : await supabase.from('weekly_checkins').insert(payload)

    if (saveErr) {
      setSaveError(saveErr.message)
    } else {
      setSuccess('Your honest check-in is saved.')
      await refetch()
    }
    setSaving(false)
  }

  if (loading && !data) return <LoadingSpinner label="Loading check-in…" />

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">
            Weekly check-in
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            An honest pause — especially for the shifts of perimenopause and midlife health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => setWeekStart((w) => addWeeksISO(w, -1))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] text-lg hover:bg-[color-mix(in_srgb,var(--color-sage)_12%,transparent)]"
          >
            ←
          </button>
          <span className="min-w-[10rem] text-center text-sm font-medium text-[var(--color-text)]">
            {formatWeekRange(weekStart)}
          </span>
          <button
            type="button"
            aria-label="Next week"
            disabled={!canGoForward}
            onClick={() => canGoForward && setWeekStart((w) => addWeeksISO(w, 1))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] text-lg disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-[color-mix(in_srgb,var(--color-sage)_12%,transparent)]"
          >
            →
          </button>
        </div>
      </header>

      <Alert type="error" message={error || saveError} onDismiss={() => setSaveError('')} />
      <Alert type="success" message={success} onDismiss={() => setSuccess('')} />

      {data && <WeeklyCheckinStrip data={data} />}

      <Card>
        <CardTitle>
          {isCheckinComplete(data?.checkin ?? null) ? 'Update your reflection' : "This week's reflection"}
        </CardTitle>
        <form onSubmit={handleSubmit} className="space-y-5">
          {(Object.keys(CHECKIN_PROMPTS) as (keyof typeof CHECKIN_PROMPTS)[]).map((key) => {
            const prompt = CHECKIN_PROMPTS[key]
            const valueMap = {
              wentWell,
              wasHard,
              focusNextWeek,
              providerNotes,
            }
            const setMap = {
              wentWell: setWentWell,
              wasHard: setWasHard,
              focusNextWeek: setFocusNextWeek,
              providerNotes: setProviderNotes,
            }
            return (
              <div key={key}>
                <Textarea
                  label={prompt.label}
                  value={valueMap[key]}
                  onChange={(e) => setMap[key](e.target.value)}
                  placeholder={prompt.placeholder}
                />
                <p className="mt-1 text-xs text-[var(--color-muted)]">{prompt.hint}</p>
              </div>
            )
          })}
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save check-in'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
