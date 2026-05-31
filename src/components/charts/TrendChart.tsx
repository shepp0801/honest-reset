import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface ChartPoint {
  date: string
  label: string
  value: number
}

interface TrendChartProps {
  title: string
  data: ChartPoint[]
  unit?: string
  color?: string
  emptyMessage?: string
  chartHeight?: number
  className?: string
  compact?: boolean
  /** Horizontal dashed goal line (e.g. daily step target) */
  referenceY?: number | null
  referenceLabel?: string
}

export function TrendChart({
  title,
  data,
  unit = '',
  color = '#6E7D66',
  emptyMessage = 'No data yet',
  chartHeight = 220,
  className = '',
  compact = false,
  referenceY = null,
  referenceLabel = 'Goal',
}: TrendChartProps) {
  const values = data.map((d) => d.value)
  const refValues = referenceY != null ? [...values, referenceY] : values
  const min = refValues.length ? Math.min(...refValues) : 0
  const max = refValues.length ? Math.max(...refValues) : 0
  const padding = refValues.length ? Math.max(1, (max - min) * 0.08 || 1) : 1
  const yMin = refValues.length ? Math.floor(min - padding) : 0
  const yMax = refValues.length ? Math.ceil(max + padding) : 100

  return (
    <div
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[0_2px_12px_rgba(85,93,66,0.06)] ${compact ? 'p-3' : 'p-4'} ${className}`}
    >
      <h3 className={`font-display text-sm font-semibold text-[var(--color-text)] ${compact ? 'mb-2' : 'mb-3'}`}>{title}</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-muted)]">{emptyMessage}</p>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value}${unit ? ` ${unit}` : ''}`, title]}
            />
            {referenceY != null && (
              <ReferenceLine
                y={referenceY}
                stroke="var(--color-muted)"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: `${referenceLabel} ${referenceY.toLocaleString()}`,
                  position: 'insideTopRight',
                  fill: 'var(--color-muted)',
                  fontSize: 10,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 4, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
