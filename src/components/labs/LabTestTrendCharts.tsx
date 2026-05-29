import { TrendChart } from '../charts/TrendChart'
import type { LabMatrixRow } from '../../lib/labMatrix'

interface LabTestTrendChartsProps {
  rows: LabMatrixRow[]
}

const CHART_COLORS = ['#6E7D66', '#B88478', '#4F5848', '#8A9A82', '#7c6b9e', '#a67367']

export function LabTestTrendCharts({ rows }: LabTestTrendChartsProps) {
  const chartRows = rows.filter((row) => row.chartData.length > 0)

  if (chartRows.length === 0) return null

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--color-muted)]">
        Trends update automatically when you save new results.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {chartRows.map((row, index) => (
          <TrendChart
            key={row.testName}
            title={row.testName}
            data={row.chartData}
            unit={row.unit ?? ''}
            color={CHART_COLORS[index % CHART_COLORS.length]}
            emptyMessage="No data"
          />
        ))}
      </div>
    </div>
  )
}
