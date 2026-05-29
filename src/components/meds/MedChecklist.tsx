import { Link } from 'react-router-dom'
import type { MedicationItem } from '../../types/database'

interface MedChecklistProps {
  items: MedicationItem[]
  checkedIds: Set<string>
  onToggle: (itemId: string) => void
  emptyMessage: string
  setupLinkLabel?: string
}

export function MedChecklist({
  items,
  checkedIds,
  onToggle,
  emptyMessage,
  setupLinkLabel = 'Medications & Supplements page',
}: MedChecklistProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        {emptyMessage}{' '}
        <Link to="/meds" className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline">
          {setupLinkLabel}
        </Link>
        .
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const checked = checkedIds.has(item.id)
        return (
          <li key={item.id}>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                checked
                  ? 'border-[var(--color-sage)] bg-[color-mix(in_srgb,var(--color-sage)_12%,var(--color-surface-elevated))]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[color-mix(in_srgb,var(--color-sage)_40%,var(--color-border))]'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(item.id)}
                className="mt-1 h-5 w-5 shrink-0 rounded border-[var(--color-border)] text-[var(--color-sage)] focus:ring-[var(--color-sage)]"
              />
              <span className="min-w-0 flex-1">
                <span className="font-medium text-[var(--color-text)]">{item.name}</span>
                {item.dosage && (
                  <span className="mt-0.5 block text-sm text-[var(--color-muted)]">{item.dosage}</span>
                )}
              </span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}
