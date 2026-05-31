import { supabase } from './supabase'
import type { MoodTag, Reflection } from '../types/database'

export const MOOD_TAGS: MoodTag[] = ['Great', 'Good', 'Okay', 'Rough', 'Really Hard']

export function isMoodTag(value: string): value is MoodTag {
  return (MOOD_TAGS as readonly string[]).includes(value)
}

/** Move legacy daily_log notes into reflections when present. */
export async function migrateDailyLogNotesToReflection(
  profileId: string,
  logDate: string,
  notes: string | null | undefined,
): Promise<void> {
  const trimmed = notes?.trim()
  if (!trimmed) return

  const { data: existing } = await supabase
    .from('reflections')
    .select('id, body')
    .eq('user_id', profileId)
    .eq('reflection_date', logDate)
    .maybeSingle()

  if (existing?.body?.trim()) return

  await supabase.from('reflections').upsert(
    {
      user_id: profileId,
      reflection_date: logDate,
      body: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,reflection_date' },
  )
}

export async function fetchReflection(
  profileId: string,
  reflectionDate: string,
): Promise<Reflection | null> {
  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .eq('user_id', profileId)
    .eq('reflection_date', reflectionDate)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as Reflection | null) ?? null
}

export async function fetchReflectionList(profileId: string): Promise<Reflection[]> {
  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .eq('user_id', profileId)
    .order('reflection_date', { ascending: false })

  if (error) throw new Error(error.message)
  return (data as Reflection[]) ?? []
}

export async function saveReflection(
  profileId: string,
  reflectionDate: string,
  body: string,
  moodTag: MoodTag | null,
): Promise<Reflection | null> {
  const trimmed = body.trim()
  const payload = {
    user_id: profileId,
    reflection_date: reflectionDate,
    body: trimmed || null,
    mood_tag: moodTag,
    updated_at: new Date().toISOString(),
  }

  if (!trimmed && !moodTag) {
    const { error: delErr } = await supabase
      .from('reflections')
      .delete()
      .eq('user_id', profileId)
      .eq('reflection_date', reflectionDate)
    if (delErr) throw new Error(delErr.message)
    return null
  }

  const { data, error } = await supabase
    .from('reflections')
    .upsert(payload, { onConflict: 'user_id,reflection_date' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Reflection
}

export function truncateReflectionPreview(text: string | null, max = 80): string {
  if (!text?.trim()) return 'No entry text'
  const t = text.trim().replace(/\s+/g, ' ')
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}
