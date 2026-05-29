import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import type { AccountSettings, HealthProfile } from '../types/database'

const ACTIVE_PROFILE_KEY = 'honest-reset-active-profile'

interface ProfileContextValue {
  profiles: HealthProfile[]
  settings: AccountSettings | null
  activeProfileId: string | null
  activeProfile: HealthProfile | null
  loading: boolean
  error: string | null
  switchProfile: (profileId: string) => void
  refreshProfiles: () => Promise<void>
  createManagedProfile: (displayName: string, relationship?: string) => Promise<{ error: string | null }>
  deleteManagedProfile: (profileId: string) => Promise<{ error: string | null }>
  upgradeToHousehold: () => Promise<{ error: string | null }>
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<HealthProfile[]>([])
  const [settings, setSettings] = useState<AccountSettings | null>(null)
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProfiles = useCallback(async () => {
    if (!user) {
      setProfiles([])
      setSettings(null)
      setActiveProfileId(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    await supabase.rpc('ensure_user_profile')

    const [profilesRes, settingsRes] = await Promise.all([
      supabase
        .from('health_profiles')
        .select('*')
        .eq('account_owner_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true }),
      supabase.from('account_settings').select('*').eq('account_owner_id', user.id).maybeSingle(),
    ])

    if (profilesRes.error) {
      setError(profilesRes.error.message)
      setLoading(false)
      return
    }

    const list = (profilesRes.data ?? []) as HealthProfile[]
    setProfiles(list)
    setSettings((settingsRes.data as AccountSettings | null) ?? null)

    const stored = localStorage.getItem(ACTIVE_PROFILE_KEY)
    const validStored = stored && list.some((p) => p.id === stored)
    const primary = list.find((p) => p.is_primary) ?? list[0]
    const nextId = validStored ? stored! : primary?.id ?? user.id
    setActiveProfileId(nextId)
    localStorage.setItem(ACTIVE_PROFILE_KEY, nextId)
    setLoading(false)
  }, [user])

  useEffect(() => {
    refreshProfiles()
  }, [refreshProfiles])

  const switchProfile = useCallback((profileId: string) => {
    setActiveProfileId(profileId)
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId)
    window.dispatchEvent(new Event('honest-reset-profile-changed'))
  }, [])

  const createManagedProfile = useCallback(
    async (displayName: string, relationship?: string) => {
      const { error: rpcError } = await supabase.rpc('create_managed_profile', {
        p_display_name: displayName,
        p_relationship: relationship ?? null,
      })
      if (rpcError) return { error: rpcError.message }
      await refreshProfiles()
      return { error: null }
    },
    [refreshProfiles],
  )

  const deleteManagedProfile = useCallback(
    async (profileId: string) => {
      const { error: rpcError } = await supabase.rpc('delete_managed_profile', {
        p_profile_id: profileId,
      })
      if (rpcError) return { error: rpcError.message }
      if (activeProfileId === profileId) {
        const primary = profiles.find((p) => p.is_primary)
        if (primary) switchProfile(primary.id)
      }
      await refreshProfiles()
      return { error: null }
    },
    [activeProfileId, profiles, refreshProfiles, switchProfile],
  )

  const upgradeToHousehold = useCallback(async () => {
    const { error: rpcError } = await supabase.rpc('upgrade_to_household')
    if (rpcError) return { error: rpcError.message }
    await refreshProfiles()
    return { error: null }
  }, [refreshProfiles])

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null

  const value = useMemo(
    () => ({
      profiles,
      settings,
      activeProfileId,
      activeProfile,
      loading,
      error,
      switchProfile,
      refreshProfiles,
      createManagedProfile,
      deleteManagedProfile,
      upgradeToHousehold,
    }),
    [
      profiles,
      settings,
      activeProfileId,
      activeProfile,
      loading,
      error,
      switchProfile,
      refreshProfiles,
      createManagedProfile,
      deleteManagedProfile,
      upgradeToHousehold,
    ],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}

/** Health data subject id — use instead of auth user id for all health queries. */
export function useActiveProfileId(): string | undefined {
  const { user } = useAuth()
  const { activeProfileId } = useProfile()
  return activeProfileId ?? user?.id
}
