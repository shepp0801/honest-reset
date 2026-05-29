import { useState } from 'react'
import { Card, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Alert'
import { fetchVisitSummary } from '../../lib/visitSummaryData'
import { downloadVisitSummaryPdf } from '../../lib/visitSummaryPdf'

interface VisitSummaryCardProps {
  userId: string
  compact?: boolean
}

export function VisitSummaryCard({ userId, compact = false }: VisitSummaryCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDownload() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchVisitSummary(userId)
      downloadVisitSummaryPdf(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate PDF')
    }
    setLoading(false)
  }

  if (compact) {
    return (
      <Card className="border-l-[4px] border-l-[var(--color-sage)] p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-[var(--color-text)]">
              Provider visit summary
            </p>
            <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
              One-page PDF for your next appointment
            </p>
          </div>
          <Button
            type="button"
            className="shrink-0 sm:px-4 sm:py-2 sm:text-sm"
            disabled={loading}
            onClick={handleDownload}
          >
            {loading ? 'Preparing…' : 'Download PDF'}
          </Button>
        </div>
        <Alert type="error" message={error} onDismiss={() => setError('')} />
      </Card>
    )
  }

  return (
    <Card className="border-l-[4px] border-l-[var(--color-sage)]">
      <CardTitle>Provider visit summary</CardTitle>
      <p className="text-sm text-[var(--color-muted)]">
        Download a one-page PDF with your last 30 days of vitals, labs, sleep, mood, medications,
        and your weekly check-in — ready to share at your next appointment.
      </p>
      <Alert type="error" message={error} onDismiss={() => setError('')} />
      <Button
        type="button"
        className="mt-4"
        disabled={loading}
        onClick={handleDownload}
      >
        {loading ? 'Preparing PDF…' : 'Download PDF'}
      </Button>
    </Card>
  )
}
