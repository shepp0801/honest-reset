import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useActiveProfileId } from '../context/ProfileContext'
import { supabase } from '../lib/supabase'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import type { MedicationItem } from '../types/database'

const ITEM_TYPES = ['Medication', 'Supplement'] as const

type ItemType = (typeof ITEM_TYPES)[number]

const emptyForm = () => ({
  itemType: 'Medication' as ItemType,
  name: '',
  dosage: '',
  notes: '',
})

export function MedsSupplementsPage() {
  const { user } = useAuth()
  const profileId = useActiveProfileId()
  const formRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<MedicationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [itemType, setItemType] = useState<ItemType>('Medication')
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [notes, setNotes] = useState('')

  const loadData = useCallback(async () => {
    if (!user || !profileId) return
    setLoading(true)
    setError('')

    const { data, error: itemsError } = await supabase
      .from('medication_items')
      .select('*')
      .eq('user_id', profileId)
      .eq('active', true)
      .order('item_type', { ascending: true })
      .order('name', { ascending: true })

    if (itemsError) setError(itemsError.message)
    else setItems((data as MedicationItem[]) ?? [])
    setLoading(false)
  }, [user, profileId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const medications = useMemo(
    () => items.filter((item) => item.item_type === 'Medication'),
    [items],
  )
  const supplements = useMemo(
    () => items.filter((item) => item.item_type === 'Supplement'),
    [items],
  )

  function resetForm() {
    const empty = emptyForm()
    setEditingId(null)
    setItemType(empty.itemType)
    setName(empty.name)
    setDosage(empty.dosage)
    setNotes(empty.notes)
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function startEdit(item: MedicationItem) {
    setEditingId(item.id)
    setItemType(item.item_type)
    setName(item.name)
    setDosage(item.dosage ?? '')
    setNotes(item.notes ?? '')
    setError('')
    setSuccess('')
    scrollToForm()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !profileId) return

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Name is required.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      user_id: profileId,
      item_type: itemType,
      name: trimmedName,
      dosage: dosage.trim() || null,
      schedule_label: 'Daily',
      scheduled_time: null,
      notes: notes.trim() || null,
      active: true,
    }

    const { error: saveError } = editingId
      ? await supabase
          .from('medication_items')
          .update(payload)
          .eq('id', editingId)
          .eq('user_id', profileId)
      : await supabase.from('medication_items').insert(payload)

    if (saveError) {
      setError(saveError.message)
    } else {
      setSuccess(editingId ? 'Updated!' : 'Added to your list!')
      resetForm()
      await loadData()
    }
    setSaving(false)
  }

  async function archiveItem(item: MedicationItem) {
    if (!user || !profileId) return
    if (!window.confirm(`Remove ${item.name} from your list?`)) return

    const { error: archiveError } = await supabase
      .from('medication_items')
      .update({ active: false })
      .eq('id', item.id)
      .eq('user_id', profileId)

    if (archiveError) setError(archiveError.message)
    else {
      setSuccess(`${item.name} removed.`)
      if (editingId === item.id) resetForm()
      await loadData()
    }
  }

  if (loading) return <LoadingSpinner label="Loading medications & supplements..." />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">
          Medications & Supplements
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Set up everything you take here. Each day, check them off on the{' '}
          <Link to="/" className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline">
            Daily Log
          </Link>
          .
        </p>
      </div>

      <Alert type="error" message={error} onDismiss={() => setError('')} />
      <Alert type="success" message={success} onDismiss={() => setSuccess('')} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start xl:grid-cols-[minmax(0,24rem)_1fr]">
        <div ref={formRef} className="lg:sticky lg:top-20 lg:self-start">
          <Card className="border-l-[4px] border-l-[var(--color-sage)]">
            <CardTitle>{editingId ? 'Edit item' : 'Add medication or supplement'}</CardTitle>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Select
                label="Type"
                options={ITEM_TYPES}
                value={itemType}
                onChange={(e) => setItemType(e.target.value as ItemType)}
              />
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vitamin D, Metformin"
              />
              <Input
                label="Dosage"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 1000 IU, 500 mg"
              />
              <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="submit" disabled={saving} className="flex-1 sm:flex-none">
                  {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add to list'}
                </Button>
                {editingId && (
                  <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>

        <div className="flex max-h-[min(70dvh,42rem)] flex-col gap-4 overflow-y-auto pr-0.5 lg:max-h-[calc(100dvh-7rem)]">
          <SetupList
            title="Medications"
            count={medications.length}
            items={medications}
            editingId={editingId}
            onEdit={startEdit}
            onRemove={archiveItem}
          />
          <SetupList
            title="Supplements"
            count={supplements.length}
            items={supplements}
            editingId={editingId}
            onEdit={startEdit}
            onRemove={archiveItem}
          />
        </div>
      </div>
    </div>
  )
}

function SetupList({
  title,
  count,
  items,
  editingId,
  onEdit,
  onRemove,
}: {
  title: string
  count: number
  items: MedicationItem[]
  editingId: string | null
  onEdit: (item: MedicationItem) => void
  onRemove: (item: MedicationItem) => void
}) {
  return (
    <Card className="shrink-0">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">{title}</h2>
        <span className="text-xs font-medium text-[var(--color-muted)]">{count}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">None added yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const isEditing = editingId === item.id
            return (
              <li
                key={item.id}
                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
                  isEditing
                    ? 'border-[var(--color-sage)] bg-[color-mix(in_srgb,var(--color-sage)_10%,var(--color-surface-elevated))]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[var(--color-text)]">{item.name}</p>
                  <p className="truncate text-xs text-[var(--color-muted)]">
                    {item.dosage || 'No dosage set'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant={isEditing ? 'primary' : 'secondary'}
                    className="px-2 py-1 text-xs"
                    onClick={() => onEdit(item)}
                  >
                    {isEditing ? 'Editing' : 'Edit'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-2 py-1 text-xs text-[var(--color-danger)]"
                    onClick={() => onRemove(item)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
