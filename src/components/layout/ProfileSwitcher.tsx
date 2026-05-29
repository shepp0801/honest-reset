import { useProfile } from '../../context/ProfileContext'

const PROFILE_COLORS = [
  'var(--color-sage)',
  'var(--color-terracotta)',
  '#8B9A7E',
  '#C4A090',
]

export function ProfileSwitcher() {
  const { profiles, activeProfileId, switchProfile, settings, loading } = useProfile()

  if (loading || profiles.length <= 1) return null

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs font-medium uppercase tracking-wide text-[var(--color-muted)] lg:inline">
        Profile
      </span>
      <div
        className="flex flex-wrap gap-1.5"
        role="tablist"
        aria-label="Health profile"
      >
        {profiles.map((profile, index) => {
          const active = profile.id === activeProfileId
          return (
            <button
              key={profile.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => switchProfile(profile.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-[var(--color-sage)] text-[var(--color-on-sage)] shadow-sm'
                  : 'border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-sage)_10%,var(--color-surface-elevated))]'
              }`}
              style={
                active
                  ? undefined
                  : { borderLeftWidth: 3, borderLeftColor: PROFILE_COLORS[index % PROFILE_COLORS.length] }
              }
            >
              {profile.display_name}
            </button>
          )
        })}
      </div>
      {settings?.plan === 'household' && (
        <span className="hidden text-[10px] font-medium uppercase tracking-wide text-[var(--color-terracotta)] xl:inline">
          Household
        </span>
      )}
    </div>
  )
}
