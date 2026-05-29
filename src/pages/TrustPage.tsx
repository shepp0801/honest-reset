import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../context/ProfileContext'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import {
  clearLocalAppData,
  deleteOwnAccount,
  downloadJsonExport,
  fetchUserDataExport,
} from '../lib/exportUserData'

function TrustPillar({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-sage)_6%,var(--color-surface-elevated))] p-4">
      <h3 className="font-display text-base font-semibold text-[var(--color-text)]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{body}</p>
    </div>
  )
}

export function TrustPage() {
  const { user, signOut } = useAuth()
  const {
    profiles,
    settings,
    createManagedProfile,
    deleteManagedProfile,
    upgradeToHousehold,
    refreshProfiles,
  } = useProfile()

  const navigate = useNavigate()
  const [exportLoading, setExportLoading] = useState(false)
  const [exportError, setExportError] = useState('')
  const [exportSuccess, setExportSuccess] = useState('')

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const [newName, setNewName] = useState('')
  const [newRelationship, setNewRelationship] = useState('')
  const [householdError, setHouseholdError] = useState('')
  const [householdSuccess, setHouseholdSuccess] = useState('')
  const [householdLoading, setHouseholdLoading] = useState(false)

  const canAddProfile =
    settings != null && profiles.length < settings.max_profiles && settings.plan === 'household'

  async function handleExport() {
    if (!user) return
    setExportLoading(true)
    setExportError('')
    setExportSuccess('')
    try {
      const profileIds = profiles.map((p) => p.id)
      const payload = await fetchUserDataExport(user.id, profileIds)
      downloadJsonExport(payload)
      setExportSuccess('Your data export downloaded successfully.')
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed')
    }
    setExportLoading(false)
  }

  async function handleDeleteAccount() {
    if (!user || deleteConfirm.trim().toLowerCase() !== 'delete') return
    setDeleteLoading(true)
    setDeleteError('')
    const { error } = await deleteOwnAccount()
    if (error) {
      setDeleteError(error)
      setDeleteLoading(false)
      return
    }
    clearLocalAppData()
    await signOut()
    navigate('/login', { replace: true })
  }

  async function handleUpgrade() {
    setHouseholdLoading(true)
    setHouseholdError('')
    setHouseholdSuccess('')
    const { error } = await upgradeToHousehold()
    if (error) {
      setHouseholdError(error)
    } else {
      setHouseholdSuccess('Household mode enabled. You can add up to 4 separate profiles.')
      await refreshProfiles()
    }
    setHouseholdLoading(false)
  }

  async function handleAddProfile(e: React.FormEvent) {
    e.preventDefault()
    setHouseholdError('')
    setHouseholdSuccess('')
    const { error } = await createManagedProfile(newName, newRelationship || undefined)
    if (error) {
      setHouseholdError(error)
    } else {
      setNewName('')
      setNewRelationship('')
      setHouseholdSuccess('Profile added. Switch profiles in the header to log separately.')
    }
  }

  async function handleRemoveProfile(profileId: string, name: string) {
    if (!window.confirm(`Remove "${name}" and all of their health data? This cannot be undone.`)) {
      return
    }
    setHouseholdError('')
    const { error } = await deleteManagedProfile(profileId)
    if (error) setHouseholdError(error)
  }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">
          Privacy &amp; Trust
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">
          Your health story is personal. The Honest Reset is built so your data stays yours — not
          a product to sell.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <TrustPillar
          title="Your data stays yours"
          body="Everything you log is stored securely and tied to your account. You can export it anytime or delete your account completely."
        />
        <TrustPillar
          title="No ads. No data selling."
          body="We don't run ads, sell your information, or share it with marketers. Your logs are for you — and your care team, if you choose."
        />
        <TrustPillar
          title="Separate profiles, never merged"
          body="Household mode keeps each person's health data in its own profile. A partner or parent can help track without blending records."
        />
        <TrustPillar
          title="Encrypted &amp; access-controlled"
          body="Data is stored with Supabase using row-level security. Only you (and profiles you manage) can see your records."
        />
      </section>

      <Card className="border-l-4 border-l-[var(--color-sage)]">
        <CardTitle>Export all your data</CardTitle>
        <p className="text-sm text-[var(--color-muted)]">
          Download a complete JSON file with every log, lab, medication, check-in, and goal across
          all profiles on your account.
        </p>
        <Alert type="error" message={exportError} onDismiss={() => setExportError('')} />
        <Alert type="success" message={exportSuccess} onDismiss={() => setExportSuccess('')} />
        <Button type="button" className="mt-4" disabled={exportLoading} onClick={handleExport}>
          {exportLoading ? 'Preparing export…' : 'Download full export (JSON)'}
        </Button>
      </Card>

      <Card className="border-l-4 border-l-[var(--color-terracotta)]">
        <CardTitle>Household mode</CardTitle>
        <p className="text-sm text-[var(--color-muted)]">
          Care for someone else without mixing health data. Each profile has its own daily logs,
          labs, meds, and dashboard — under one subscription.
        </p>

        {settings?.plan === 'solo' ? (
          <div className="mt-4 rounded-xl bg-[color-mix(in_srgb,var(--color-terracotta)_8%,var(--color-surface))] p-4">
            <p className="text-sm text-[var(--color-text)]">
              <span className="font-semibold">Solo plan</span> — 1 profile (you).
            </p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Household mode supports up to 4 separate profiles for partners, parents, or anyone
              you care for. Billing integration is coming; enable it now during beta at no charge.
            </p>
            <Alert type="error" message={householdError} onDismiss={() => setHouseholdError('')} />
            <Alert
              type="success"
              message={householdSuccess}
              onDismiss={() => setHouseholdSuccess('')}
            />
            <Button
              type="button"
              className="mt-4"
              disabled={householdLoading}
              onClick={handleUpgrade}
            >
              {householdLoading ? 'Enabling…' : 'Enable household mode (beta)'}
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-[var(--color-text)]">
              <span className="font-semibold text-[var(--color-sage)]">Household plan</span> —{' '}
              {profiles.length} of {settings?.max_profiles ?? 4} profiles used.
            </p>

            <ul className="space-y-2">
              {profiles.map((profile) => (
                <li
                  key={profile.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {profile.display_name}
                      {profile.is_primary && (
                        <span className="ml-2 text-xs text-[var(--color-muted)]">(you)</span>
                      )}
                    </p>
                    {profile.relationship && (
                      <p className="text-xs text-[var(--color-muted)]">{profile.relationship}</p>
                    )}
                  </div>
                  {!profile.is_primary && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs text-[var(--color-danger)]"
                      onClick={() => handleRemoveProfile(profile.id, profile.display_name)}
                    >
                      Remove
                    </Button>
                  )}
                </li>
              ))}
            </ul>

            {canAddProfile && (
              <form onSubmit={handleAddProfile} className="space-y-3 border-t border-[var(--color-border)] pt-4">
                <p className="text-sm font-medium text-[var(--color-text)]">Add a profile</p>
                <Input
                  label="Display name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Mom, Partner"
                  required
                />
                <Input
                  label="Relationship (optional)"
                  value={newRelationship}
                  onChange={(e) => setNewRelationship(e.target.value)}
                  placeholder="e.g. Parent, Partner"
                />
                <Button type="submit" variant="secondary" disabled={!newName.trim()}>
                  Add profile
                </Button>
              </form>
            )}

            <Alert type="error" message={householdError} onDismiss={() => setHouseholdError('')} />
            <Alert
              type="success"
              message={householdSuccess}
              onDismiss={() => setHouseholdSuccess('')}
            />
          </div>
        )}
      </Card>

      <Card className="border-l-4 border-l-[var(--color-danger)]">
        <CardTitle>Delete account</CardTitle>
        <p className="text-sm text-[var(--color-muted)]">
          Permanently delete your account and all health data for every profile. This cannot be
          undone.
        </p>
        <Alert type="error" message={deleteError} onDismiss={() => setDeleteError('')} />
        <div className="mt-4 space-y-3">
          <Input
            label='Type "delete" to confirm'
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="delete"
          />
          <Button
            type="button"
            variant="danger"
            disabled={deleteLoading || deleteConfirm.trim().toLowerCase() !== 'delete'}
            onClick={handleDeleteAccount}
          >
            {deleteLoading ? 'Deleting…' : 'Delete my account forever'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
