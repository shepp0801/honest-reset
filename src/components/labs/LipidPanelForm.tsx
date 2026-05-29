import { useState } from 'react'
import { LIPID_PANEL_TESTS } from '../../lib/labPresets'
import { todayISO } from '../../lib/date'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface LipidPanelFormProps {
  saving: boolean
  onSave: (
    rows: { testName: string; unit: string; value: number }[],
    recordedDate: string,
    notes: string,
  ) => Promise<void>
  onCancel: () => void
}

export function LipidPanelForm({ saving, onSave, onCancel }: LipidPanelFormProps) {
  const [recordedDate, setRecordedDate] = useState(todayISO())
  const [notes, setNotes] = useState('')
  const [values, setValues] = useState<Record<string, string>>(
    () => Object.fromEntries(LIPID_PANEL_TESTS.map((t) => [t.testName, ''])),
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const rows = LIPID_PANEL_TESTS.map((t) => ({
      testName: t.testName,
      unit: t.unit,
      value: Number(values[t.testName]),
    })).filter((r) => values[r.testName] !== '' && !Number.isNaN(r.value))

    if (rows.length === 0) return
    await onSave(rows, recordedDate, notes)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-dashed border-[var(--color-border)] p-4">
      <p className="text-sm text-[var(--color-muted)]">
        Enter results from the same blood draw. Leave blank any tests not on your report.
      </p>
      <Input label="Panel date" type="date" value={recordedDate} onChange={(e) => setRecordedDate(e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">
        {LIPID_PANEL_TESTS.map((test) => (
          <Input
            key={test.testName}
            label={`${test.testName} (${test.unit})`}
            type="number"
            step="any"
            value={values[test.testName]}
            onChange={(e) => setValues((v) => ({ ...v, [test.testName]: e.target.value }))}
          />
        ))}
      </div>
      <Input label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save lipid panel'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
