import { supabase } from './supabase'

/** Sync check-in rows for a date to match the checked item IDs. */
export async function syncMedicationCheckins(
  userId: string,
  logDate: string,
  checkedItemIds: Set<string>,
  activeItemIds: string[],
): Promise<string | null> {
  const { data: existing, error: fetchError } = await supabase
    .from('medication_checkins')
    .select('id, item_id')
    .eq('user_id', userId)
    .eq('taken_date', logDate)

  if (fetchError) return fetchError.message

  const existingByItem = new Map((existing ?? []).map((row) => [row.item_id, row.id]))

  for (const itemId of activeItemIds) {
    const shouldBeChecked = checkedItemIds.has(itemId)
    const existingId = existingByItem.get(itemId)

    if (shouldBeChecked && !existingId) {
      const { error } = await supabase.from('medication_checkins').insert({
        user_id: userId,
        item_id: itemId,
        taken_date: logDate,
      })
      if (error) return error.message
    } else if (!shouldBeChecked && existingId) {
      const { error } = await supabase.from('medication_checkins').delete().eq('id', existingId)
      if (error) return error.message
    }
  }

  return null
}
