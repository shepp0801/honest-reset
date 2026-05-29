import { useState, type ReactNode } from 'react'

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

export function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--color-sage)_8%,transparent)]"
      >
        <span className="font-display text-base font-semibold text-[var(--color-text)]">{title}</span>
        <span className="text-lg text-[var(--color-muted)]" aria-hidden>
          {open ? '?' : '+'}
        </span>
      </button>
      {open && <div className="border-t border-[var(--color-border)] px-4 pb-4">{children}</div>}
    </section>
  )
}
