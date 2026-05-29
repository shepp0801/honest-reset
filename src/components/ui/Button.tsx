import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  fullWidth?: boolean
}

const variants = {
  primary:
    'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-sm hover:bg-[var(--color-accent-hover)] disabled:opacity-50',
  secondary:
    'border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-sage)_12%,var(--color-surface-elevated))]',
  ghost:
    'text-[var(--color-sage)] hover:bg-[color-mix(in_srgb,var(--color-sage)_12%,transparent)]',
  danger: 'bg-[var(--color-danger)] text-white hover:opacity-90 disabled:opacity-50',
}

export function Button({
  variant = 'primary',
  fullWidth,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
