import { useState, type SyntheticEvent } from 'react'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'nav' | 'lg' | 'header'
  className?: string
}

const heights = {
  sm: 'h-16',
  header: 'h-20',
  md: 'h-[5.5rem]',
  nav: 'h-[5.75rem] max-w-[13.5rem]',
  lg: 'h-44',
}

const LOGO_SRC = '/logo.png'

export function BrandLogo({ size = 'md', className = '' }: BrandLogoProps) {
  const [failed, setFailed] = useState(false)

  function handleError(_e: SyntheticEvent<HTMLImageElement>) {
    setFailed(true)
  }

  if (failed) {
    return (
      <p className="font-display text-lg font-bold tracking-tight text-[var(--color-sage)]">
        HAVEN
      </p>
    )
  }

  return (
    <img
      src={LOGO_SRC}
      alt="HAVEN by The Honest Reset"
      className={`${heights[size]} w-auto max-w-full shrink-0 object-contain object-left ${className}`}
      onError={handleError}
    />
  )
}
