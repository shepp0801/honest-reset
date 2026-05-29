interface AlertProps {
  type: 'success' | 'error' | 'info'
  message: string
  onDismiss?: () => void
}

const styles = {
  success:
    'border-[var(--color-success)] bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-surface-elevated))] text-[var(--color-text)]',
  error:
    'border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-surface-elevated))] text-[var(--color-text)]',
  info: 'border-[var(--color-sage)] bg-[color-mix(in_srgb,var(--color-sage)_14%,var(--color-surface-elevated))] text-[var(--color-text)]',
}

export function Alert({ type, message, onDismiss }: AlertProps) {
  if (!message) return null
  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-2 rounded-xl border px-4 py-3 text-sm ${styles[type]}`}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          x
        </button>
      )}
    </div>
  )
}
