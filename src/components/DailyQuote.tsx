import { getDailyQuote } from '../lib/quotes'

export function DailyQuote({
  className = '',
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const quote = getDailyQuote()
  return (
    <blockquote
      className={`rounded-xl border border-[var(--color-border)] border-l-4 border-l-[var(--color-sage)] bg-[var(--color-surface-elevated)] ${
        compact ? 'px-3 py-2' : 'px-4 py-3'
      } ${className}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-sage)]">
        Today&apos;s reminder
      </p>
      <p
        className={`mt-0.5 font-display leading-snug text-[var(--color-text)] italic ${
          compact ? 'line-clamp-2 text-sm' : 'mt-1 text-base md:text-lg'
        }`}
      >
        &ldquo;{quote}&rdquo;
      </p>
    </blockquote>
  )
}
