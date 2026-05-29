import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useActiveProfileId } from '../context/ProfileContext'
import { supabase } from '../lib/supabase'
import { todayISO } from '../lib/date'
import { buildLabMatrix, matrixForComparisonTable } from '../lib/labMatrix'
import { LabResultsMatrix } from '../components/labs/LabResultsMatrix'
import { LabTestTrendCharts } from '../components/labs/LabTestTrendCharts'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Card, CardTitle } from '../components/ui/Card'
import type { LabValue } from '../types/database'
import { CLINICAL_LAB_TESTS, type LabTestPreset } from '../lib/labPresets'
import { LipidPanelForm } from '../components/labs/LipidPanelForm'

const emptyForm = () => ({
  testName: '',
  value: '',
  unit: '',
  recordedDate: todayISO(),
  notes: '',
})

export function LabValuesPage() {
  const { user } = useAuth()
  const profileId = useActiveProfileId()
  const [labs, setLabs] = useState<LabValue[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showLipidPanel, setShowLipidPanel] = useState(false)
  const [testName, setTestName] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('')
  const [recordedDate, setRecordedDate] = useState(todayISO())
  const [notes, setNotes] = useState('')

  const matrix = useMemo(() => buildLabMatrix(labs), [labs])
  const comparisonMatrix = useMemo(() => matrixForComparisonTable(matrix), [matrix])

  const loadLabs = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from('lab_values')
      .select('*')
      .eq('user_id', profileId)
      .order('recorded_date', { ascending: true })

    if (err) setError(err.message)
    else setLabs((data as LabValue[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadLabs()
  }, [loadLabs])

  function resetForm() {
    const empty = emptyForm()
    setEditingId(null)
    setTestName(empty.testName)
    setValue(empty.value)
    setUnit(empty.unit)
    setRecordedDate(empty.recordedDate)
    setNotes(empty.notes)
  }

  function applyPreset(preset: LabTestPreset) {
    setEditingId(null)
    setTestName(preset.testName)
    setUnit(preset.unit)
    setValue('')
    setRecordedDate(todayISO())
    setNotes('')
    setShowLipidPanel(false)
    setError('')
    setSuccess('')
    document.getElementById('add-lab-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function saveLipidPanel(
    rows: { testName: string; unit: string; value: number }[],
    panelDate: string,
    panelNotes: string,
  ) {
    if (!user) return
    setSaving(true)
    setError('')
    setSuccess('')

    const inserts = rows.map((r) => ({
      user_id: profileId,
      test_name: r.testName,
      value: r.value,
      unit: r.unit,
      recorded_date: panelDate,
      notes: panelNotes.trim() || null,
    }))

    const { error: err } = await supabase.from('lab_values').insert(inserts)
    if (err) setError(err.message)
    else {
      setSuccess(`Saved ${inserts.length} lipid panel result(s)! They appear in the comparison table above.`)
      setShowLipidPanel(false)
      await loadLabs()
    }
    setSaving(false)
  }

  function startEdit(lab: LabValue) {
    setEditingId(lab.id)
    setTestName(lab.test_name)
    setValue(String(lab.value))
    setUnit(lab.unit ?? '')
    setRecordedDate(lab.recorded_date)
    setNotes(lab.notes ?? '')
    setError('')
    setSuccess('')
    document.getElementById('add-lab-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleEditCell(labId: string) {
    const lab = labs.find((l) => l.id === labId)
    if (lab) startEdit(lab)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return

    const num = Number(value)
    if (value === '' || Number.isNaN(num)) {
      setError('Value must be a number')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      test_name: testName.trim() || 'Lab test',
      value: num,
      unit: unit.trim() || null,
      recorded_date: recordedDate,
      notes: notes.trim() || null,
    }

    const { error: err } = editingId
      ? await supabase
          .from('lab_values')
          .update(payload)
          .eq('id', editingId)
          .eq('user_id', profileId)
      : await supabase.from('lab_values').insert({ user_id: profileId, ...payload })

    if (err) {
      setError(err.message)
    } else {
      setSuccess(
        editingId
          ? 'Lab value updated!'
          : 'Lab value saved! It appears in the comparison table above.',
      )
      resetForm()
      await loadLabs()
    }
    setSaving(false)
  }

  async function handleDelete(lab: LabValue) {
    if (!user) return
    if (!window.confirm(`Delete ${lab.test_name} from ${lab.recorded_date}?`)) return

    setError('')
    setSuccess('')

    const { error: err } = await supabase
      .from('lab_values')
      .delete()
      .eq('id', lab.id)
      .eq('user_id', profileId)

    if (err) {
      setError(err.message)
    } else {
      setSuccess('Lab value deleted.')
      if (editingId === lab.id) resetForm()
      await loadLabs()
    }
  }

  if (loading) return <LoadingSpinner label="Loading lab values..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">Lab Values</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Compare results across dates. Each new draw adds a column; tap a value to edit.
        </p>
      </div>

      <Alert type="error" message={error} onDismiss={() => setError('')} />
      <Alert type="success" message={success} onDismiss={() => setSuccess('')} />

      <Card className="border-t-[3px] border-t-[var(--color-terracotta)]">
        <CardTitle>Lab comparison</CardTitle>
        <LabResultsMatrix matrix={comparisonMatrix} onEditCell={handleEditCell} />
      </Card>

      {comparisonMatrix.rows.length > 0 && (
        <Card>
          <CardTitle>Trends</CardTitle>
          <LabTestTrendCharts rows={comparisonMatrix.rows} />
        </Card>
      )}

      <Card>
        <CardTitle>Clinical lab presets</CardTitle>
        <p className="mb-3 text-sm text-[var(--color-muted)]">
          Tap a test to pre-fill the form below. Units are typical US lab defaults — adjust if needed.
        </p>
        <div className="flex flex-wrap gap-2">
          {CLINICAL_LAB_TESTS.map((preset) => (
            <Button
              key={preset.testName}
              type="button"
              variant="secondary"
              className="text-xs"
              onClick={() => applyPreset(preset)}
            >
              {preset.testName}
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Lipid panel</CardTitle>
        <p className="mb-3 text-sm text-[var(--color-muted)]">
          Log Total Cholesterol, LDL, HDL, and Triglycerides from the same draw at once.
        </p>
        {!showLipidPanel ? (
          <Button type="button" variant="secondary" onClick={() => setShowLipidPanel(true)}>
            Enter lipid panel
          </Button>
        ) : (
          <LipidPanelForm
            saving={saving}
            onSave={saveLipidPanel}
            onCancel={() => setShowLipidPanel(false)}
          />
        )}
      </Card>

      <div id="add-lab-form">
      <Card>
        <CardTitle>{editingId ? 'Edit lab result' : 'Add lab result'}</CardTitle>
        {editingId && (
          <p className="mb-4 text-sm text-[var(--color-muted)]">
            Editing an entry. Change any field below, then save — or delete this result.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Test name"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g. A1C"
            />
            <Input
              label="Value"
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <Input
              label="Unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. %"
            />
            <Input
              label="Date"
              type="date"
              value={recordedDate}
              onChange={(e) => setRecordedDate(e.target.value)}
            />
          </div>
          <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update lab value' : 'Save lab value'}
            </Button>
            {editingId && (
              <>
                <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-600 dark:text-red-400"
                  disabled={saving}
                  onClick={() => {
                    const lab = labs.find((l) => l.id === editingId)
                    if (lab) handleDelete(lab)
                  }}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </form>
      </Card>
      </div>
    </div>
  )
}
