import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { LegendProps } from 'recharts'

export interface BpChartPoint {
  date: string
  label: string
  systolic: number
  diastolic: number
}

interface BpTrendChartProps {
  title: string
  data: BpChartPoint[]
  emptyMessage?: string
  chartHeight?: number
  className?: string
  compact?: boolean
}

const SYSTOLIC_COLOR = 'var(--color-terracotta)'
const DIASTOLIC_COLOR = 'var(--color-sage)'

const axisTick = {
  fontSize: 11,
  fill: 'var(--color-muted)',
  fontFamily: 'var(--font-body)',
}

const tooltipStyle = {
  background: 'var(--color-surface-elevated)',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  fontSize: '12px',
  fontFamily: 'var(--font-body)',
  color: 'var(--color-text)',
}

function BpLegend({ payload, compact }: LegendProps & { compact?: boolean }) {
  if (!payload?.length) return null
  return (
    <ul className={`flex justify-center gap-5 ${compact ? 'mt-1' : 'mt-2'}`}>
      {payload.map((entry) => (
        <li
          key={entry.value}
          className="flex items-center gap-2 text-xs font-medium text-[var(--color-text)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <span
            className="inline-block h-0.5 w-5 rounded-full"
            style={{ backgroundColor: entry.color }}
            aria-hidden
          />
          {entry.value}
        </li>
      ))}
    </ul>
  )
}

export function BpTrendChart({
  title,
  data,
  emptyMessage = 'No readings yet',
  chartHeight = 200,
  className = '',
  compact = false,
}: BpTrendChartProps) {
  return (
    <div
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[0_2px_12px_rgba(85,93,66,0.06)] ${compact ? 'p-3' : 'p-4'} ${className}`}
    >
      <h3 className={`font-display text-sm font-semibold text-[var(--color-text)] ${compact ? 'mb-2' : 'mb-3'}`}>
        {title}
      </h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-muted)]">{emptyMessage}</p>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis dataKey="label" tick={axisTick} interval="preserveStartEnd" />
            <YAxis tick={axisTick} width={36} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-muted)',
                marginBottom: 4,
              }}
              itemStyle={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text)',
              }}
            />
            <Legend content={<BpLegend compact={compact} />} />
            <Line
              type="monotone"
              dataKey="systolic"
              name="Systolic"
              stroke={SYSTOLIC_COLOR}
              strokeWidth={2}
              dot={{ r: 4, fill: SYSTOLIC_COLOR, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: SYSTOLIC_COLOR }}
            />
            <Line
              type="monotone"
              dataKey="diastolic"
              name="Diastolic"
              stroke={DIASTOLIC_COLOR}
              strokeWidth={2}
              dot={{ r: 4, fill: DIASTOLIC_COLOR, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: DIASTOLIC_COLOR }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
