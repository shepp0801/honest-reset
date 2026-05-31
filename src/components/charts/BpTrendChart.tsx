import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
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
  targetSystolic?: number | null
  targetDiastolic?: number | null
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
  targetSystolic = null,
  targetDiastolic = null,
}: BpTrendChartProps) {
  const bpValues = data.flatMap((d) => [d.systolic, d.diastolic])
  const goalValues = [
    ...(targetSystolic != null ? [targetSystolic] : []),
    ...(targetDiastolic != null ? [targetDiastolic] : []),
  ]
  const allValues = [...bpValues, ...goalValues]
  const min = allValues.length ? Math.min(...allValues) : 0
  const max = allValues.length ? Math.max(...allValues) : 0
  const padding = allValues.length ? Math.max(4, (max - min) * 0.08 || 4) : 4
  const yMin = allValues.length ? Math.floor(min - padding) : 0
  const yMax = allValues.length ? Math.ceil(max + padding) : 200

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
            <YAxis tick={axisTick} width={36} domain={[yMin, yMax]} />
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
            {targetSystolic != null && (
              <ReferenceLine
                y={targetSystolic}
                stroke={SYSTOLIC_COLOR}
                strokeDasharray="6 4"
                strokeWidth={1.5}
                strokeOpacity={0.65}
                label={{
                  value: `Goal ${targetSystolic}`,
                  position: 'insideTopRight',
                  fill: SYSTOLIC_COLOR,
                  fontSize: 10,
                }}
              />
            )}
            {targetDiastolic != null && (
              <ReferenceLine
                y={targetDiastolic}
                stroke={DIASTOLIC_COLOR}
                strokeDasharray="6 4"
                strokeWidth={1.5}
                strokeOpacity={0.65}
                label={{
                  value: `Goal ${targetDiastolic}`,
                  position: 'insideBottomRight',
                  fill: DIASTOLIC_COLOR,
                  fontSize: 10,
                }}
              />
            )}
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
