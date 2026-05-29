import { formatChartDate } from './date'
import { CLINICAL_LAB_TESTS, getLabCategory, LIPID_PANEL_TESTS } from './labPresets'
import type { ChartPoint } from '../components/charts/TrendChart'
import type { LabValue } from '../types/database'

export interface LabMatrixCell {
  id: string
  value: number
  notes: string | null
}

export interface LabMatrixRow {
  testName: string
  unit: string | null
  category: string
  cells: (LabMatrixCell | null)[]
  chartData: ChartPoint[]
}

export interface LabMatrix {
  dates: string[]
  rows: LabMatrixRow[]
}

export function isA1cTest(testName: string): boolean {
  return testName.toLowerCase().includes('a1c')
}

/** Comparison table excludes A1C and date columns with no non-A1C data. */
export function matrixForComparisonTable(matrix: LabMatrix): LabMatrix {
  const rows = matrix.rows.filter((row) => !isA1cTest(row.testName))

  const datesWithData = matrix.dates.filter((_, dateIndex) =>
    rows.some((row) => row.cells[dateIndex] != null),
  )

  const realignedRows = rows.map((row) => ({
    ...row,
    cells: datesWithData.map((date) => {
      const dateIndex = matrix.dates.indexOf(date)
      return dateIndex >= 0 ? row.cells[dateIndex] : null
    }),
  }))

  return { dates: datesWithData, rows: realignedRows }
}

const PRESET_ORDER = [...LIPID_PANEL_TESTS, ...CLINICAL_LAB_TESTS].map((t) =>
  t.testName.toLowerCase(),
)

function testKey(name: string): string {
  return name.trim().toLowerCase()
}

function displayTestName(samples: LabValue[]): string {
  const counts = new Map<string, number>()
  for (const s of samples) {
    const n = s.test_name.trim()
    counts.set(n, (counts.get(n) ?? 0) + 1)
  }
  let best = samples[0].test_name.trim()
  let bestCount = 0
  for (const [name, count] of counts) {
    if (count > bestCount) {
      best = name
      bestCount = count
    }
  }
  return best
}

function sortRows(rows: LabMatrixRow[]): LabMatrixRow[] {
  return [...rows].sort((a, b) => {
    const ai = PRESET_ORDER.indexOf(a.testName.toLowerCase())
    const bi = PRESET_ORDER.indexOf(b.testName.toLowerCase())
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.testName.localeCompare(b.testName)
  })
}

/** Pivot lab rows into tests × dates for comparison table and charts. */
export function buildLabMatrix(labs: LabValue[]): LabMatrix {
  if (labs.length === 0) {
    return { dates: [], rows: [] }
  }

  const dates = [...new Set(labs.map((l) => l.recorded_date))].sort((a, b) => a.localeCompare(b))

  const byTest = new Map<string, LabValue[]>()
  for (const lab of labs) {
    const key = testKey(lab.test_name)
    const group = byTest.get(key) ?? []
    group.push(lab)
    byTest.set(key, group)
  }

  const rows: LabMatrixRow[] = []

  for (const group of byTest.values()) {
    const testName = displayTestName(group)
    const unit = group.find((g) => g.unit)?.unit ?? null

    const byDate = new Map<string, LabValue>()
    for (const lab of group) {
      const existing = byDate.get(lab.recorded_date)
      if (!existing || lab.created_at > existing.created_at) {
        byDate.set(lab.recorded_date, lab)
      }
    }

    const cells = dates.map((date) => {
      const lab = byDate.get(date)
      if (!lab) return null
      return { id: lab.id, value: Number(lab.value), notes: lab.notes }
    })

    const chartData: ChartPoint[] = [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, lab]) => ({
        date,
        label: formatChartDate(date),
        value: Number(lab.value),
      }))

    rows.push({
      testName,
      unit,
      category: getLabCategory(testName),
      cells,
      chartData,
    })
  }

  return { dates, rows: sortRows(rows) }
}

export function formatLabDelta(current: number, previous: number | null): string | null {
  if (previous == null) return null
  const delta = Math.round((current - previous) * 100) / 100
  if (delta === 0) return '0'
  return delta > 0 ? `+${delta}` : `${delta}`
}
