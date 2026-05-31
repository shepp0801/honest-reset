import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../context/ProfileContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { GENDER_OPTIONS } from '../types/database'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export function SettingsPage() {
  const { user } = useAuth()
  const { settings, loading, refreshProfiles } = useProfile()
  const { theme, toggleTheme } = useTheme()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState('')
  const [age, setAge] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!settings) return
    setFirstName(settings.first_name ?? '')
    setLastName(settings.last_name ?? '')
    setGender(settings.gender ?? '')
    setAge(settings.age != null ? String(settings.age) : '')
    setMarketingOptIn(settings.marketing_opt_in ?? false)
  }, [settings])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return

    setError('')
    setSuccess('')

    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    if (!trimmedFirst || !trimmedLast) {
      setError('First and last name are required.')
      return
    }

    if (!gender.trim()) {
      setError('Please select a gender.')
      return
    }

    let ageValue: number | null = null
    if (age.trim() === '') {
      setError('Age is required so we can understand who uses the app.')
      return
    }
    const parsed = Number(age)
    if (Number.isNaN(parsed) || parsed < 18 || parsed > 120) {
      setError('Age must be between 18 and 120.')
      return
    }
    ageValue = Math.round(parsed)

    const genderValue = gender.trim() || null

    setSaving(true)

    const { error: saveError } = await supabase.from('account_settings').upsert(
      {
        account_owner_id: user.id,
        first_name: trimmedFirst,
        last_name: trimmedLast,
        gender: genderValue,
        age: ageValue,
        marketing_opt_in: marketingOptIn,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'account_owner_id' },
    )

    if (saveError) {
      setError(saveError.message)
    } else {
      const displayName = `${trimmedFirst} ${trimmedLast}`
      await supabase
        .from('health_profiles')
        .update({ display_name: displayName })
        .eq('account_owner_id', user.id)
        .eq('is_primary', true)

      setSuccess('Profile saved.')
      await refreshProfiles()
    }
    setSaving(false)
  }

  if (loading && !settings) return <LoadingSpinner label="Loading settings..." />

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Your account profile helps us understand who uses The Honest Reset. Email comes from your
          login and is used to identify your account.
        </p>
      </div>

      <Alert type="error" message={error} onDismiss={() => setError('')} />
      <Alert type="success" message={success} onDismiss={() => setSuccess('')} />

      <Card className="border-l-4 border-l-[var(--color-sage)]">
        <CardTitle>Appearance</CardTitle>
        <p className="mb-3 text-sm text-[var(--color-muted)]">
          Choose light or dark mode for the app. Your preference is saved on this device.
        </p>
        <Button type="button" variant="secondary" onClick={toggleTheme}>
          {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        </Button>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="border-l-4 border-l-[var(--color-terracotta)]">
          <CardTitle>Your profile</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="given-name"
            />
            <Input
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              autoComplete="family-name"
            />
          </div>
          <div className="mt-4">
            <Input
              label="Email"
              value={user?.email ?? ''}
              readOnly
              className="opacity-80"
            />
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              To change your email, contact support or create a new account.
            </p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Select
              label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              options={GENDER_OPTIONS}
            />
            <Input
              label="Age"
              type="number"
              min={18}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </div>
        </Card>

        <Card>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-sage)] focus:ring-[var(--color-sage)]"
            />
            <span className="text-sm text-[var(--color-text)]">
              Send me occasional tips and updates about The Honest Reset. You can unsubscribe
              anytime.
            </span>
          </label>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
      </form>

      <Card>
        <CardTitle>More settings</CardTitle>
        <ul className="space-y-2 text-sm">
          <li>
            <Link
              to="/goals"
              className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              Daily goals
            </Link>
            <span className="text-[var(--color-muted)]"> — water and macro targets</span>
          </li>
          <li>
            <Link
              to="/trust"
              className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              Privacy &amp; Trust
            </Link>
            <span className="text-[var(--color-muted)]"> — export data, household, delete account</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
