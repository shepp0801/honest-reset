import { useState, type SyntheticEvent } from 'react'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'nav' | 'lg' | 'header'
  className?: string
}

const heights = {
  sm: 'h-32',
  header: 'h-40',
  md: 'h-[11rem]',
  nav: 'h-auto max-h-[7.5rem] w-full max-w-[15.5rem]',
  lg: 'h-[22rem]',
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
