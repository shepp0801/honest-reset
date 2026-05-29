import type { ReactNode } from 'react'

interface ScaleRowProps {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  /** low=bad color index for stress (inverted) */
  variant?: 'normal' | 'inverted'
  hint?: ReactNode
}

function buttonColor(level: number, variant: 'normal' | 'inverted', selected: boolean) {
  if (!selected) {
    return 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-sage)]'
  }
  const effective = variant === 'inverted' ? 11 - level : level
  if (effective <= 3) return 'border-red-300 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200'
  if (effective <= 6) return 'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200'
  return 'border-green-400 bg-green-100 text-green-900 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200'
}

export function ScaleRow({ label, value, onChange, variant = 'normal', hint }: ScaleRowProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
        {value != null && (
          <span className="text-sm font-semibold text-[var(--color-accent)]">{value}/10</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 10 }, (_, i) => {
          const n = i + 1
          const selected = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`min-w-[2.25rem] rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${buttonColor(n, variant, selected)}`}
            >
              {n}
            </button>
          )
        })}
      </div>
      {hint}
    </div>
  )
}
