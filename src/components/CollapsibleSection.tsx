import { useId, useState, type ReactNode } from 'react'

interface CollapsibleSectionProps {
  title: string
  summary?: string
  isComplete?: boolean
  defaultOpen?: boolean
  onCollapsed?: () => void
  children: ReactNode
}

export function CollapsibleSection({
  title,
  summary = '',
  isComplete = false,
  defaultOpen = false,
  onCollapsed,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  function toggle() {
    setOpen((wasOpen) => {
      const next = !wasOpen
      if (wasOpen && !next) onCollapsed?.()
      return next
    })
  }

  const statusLabel = isComplete ? 'Complete' : 'Empty'

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-sm">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--color-sage)_8%,transparent)]"
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center text-sm font-semibold"
          aria-label={statusLabel}
          title={statusLabel}
        >
          {isComplete ? (
            <span className="text-[var(--color-sage)]" aria-hidden>
              ✓
            </span>
          ) : (
            <span className="text-[var(--color-muted)]" aria-hidden>
              —
            </span>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block font-display text-base font-semibold text-[var(--color-text)]">{title}</span>
          {!open && summary ? (
            <span className="mt-0.5 block truncate text-sm text-[var(--color-muted)]">{summary}</span>
          ) : null}
        </span>

        <span
          className={`shrink-0 text-lg text-[var(--color-muted)] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      <div
        id={panelId}
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[var(--color-border)] px-4 pb-4">{children}</div>
        </div>
      </div>
    </section>
  )
}
