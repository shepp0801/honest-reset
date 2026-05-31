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
import type { ChartPoint } from './TrendChart'

interface WeightTrendChartProps {
  title: string
  data: ChartPoint[]
  emptyMessage?: string
  chartHeight?: number
  className?: string
  compact?: boolean
  targetWeightLbs?: number | null
  fillHeight?: boolean
}

function weightChangeLabel(data: ChartPoint[]): string | null {
  if (data.length < 2) return null
  const first = data[0].value
  const last = data[data.length - 1].value
  const delta = Math.round((last - first) * 10) / 10
  if (delta === 0) return 'No change over 30 days'
  const dir = delta < 0 ? 'down' : 'up'
  return `${dir} ${Math.abs(delta)} lbs over 30 days`
}

export function WeightTrendChart({
  title,
  data,
  emptyMessage = 'Log weight on the Daily Log',
  chartHeight = 220,
  className = '',
  compact = false,
  targetWeightLbs = null,
  fillHeight = false,
}: WeightTrendChartProps) {
  const change = weightChangeLabel(data)
  const values = data.map((d) => d.value)
  const allValues = targetWeightLbs != null ? [...values, targetWeightLbs] : values
  const min = allValues.length ? Math.min(...allValues) : 0
  const max = allValues.length ? Math.max(...allValues) : 0
  const range = max - min
  const padding = allValues.length ? Math.max(range * 0.06, 2) : 2
  const yMin = allValues.length ? Math.floor(min - padding) : 0
  const yMax = allValues.length ? Math.ceil(max + padding) : 200
  const chartMargins = compact
    ? { top: 8, right: 8, left: 4, bottom: 0 }
    : { top: 5, right: 10, left: 4, bottom: 5 }

  return (
    <div
      className={`flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[0_2px_12px_rgba(85,93,66,0.06)] ${compact ? 'p-3' : 'p-4'} ${fillHeight ? 'h-full min-h-0' : ''} ${className}`}
    >
      <div
        className={`flex shrink-0 flex-wrap items-baseline justify-between gap-2 ${compact ? 'mb-2' : 'mb-3'}`}
      >
        <h3 className="font-display text-sm font-semibold text-[var(--color-text)]">{title}</h3>
        {change && (
          <span className="text-xs font-medium text-[var(--color-muted)]">{change}</span>
        )}
      </div>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-muted)]">{emptyMessage}</p>
      ) : (
        <div
          className={fillHeight ? 'min-h-[120px] w-full min-w-0 flex-1' : 'w-full'}
          style={fillHeight ? undefined : { height: chartHeight }}
        >
          <ResponsiveContainer width="100%" height={fillHeight ? '100%' : chartHeight}>
          <LineChart data={data} margin={chartMargins}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
              interval="preserveStartEnd"
              height={compact ? 28 : 30}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
              width={44}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value} lbs`, 'Weight']}
            />
            {targetWeightLbs != null && (
              <ReferenceLine
                y={targetWeightLbs}
                stroke="var(--color-muted)"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: `Goal ${targetWeightLbs} lbs`,
                  position: 'insideTopRight',
                  fill: 'var(--color-muted)',
                  fontSize: 10,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-sage)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--color-sage)', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
