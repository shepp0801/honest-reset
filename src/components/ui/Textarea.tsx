import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
}

export function Textarea({ label, id, className = '', ...props }: TextareaProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1 block text-sm font-medium text-[var(--color-text)]">{label}</span>
      <textarea
        id={inputId}
        rows={3}
        className={`w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-sage)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-sage)_35%,transparent)] ${className}`}
        {...props}
      />
    </label>
  )
}
