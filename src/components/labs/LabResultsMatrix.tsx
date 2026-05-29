import { formatShortDate } from '../../lib/date'
import { formatLabDelta, type LabMatrix } from '../../lib/labMatrix'

interface LabResultsMatrixProps {
  matrix: LabMatrix
  onEditCell: (labId: string) => void
}

export function LabResultsMatrix({ matrix, onEditCell }: LabResultsMatrixProps) {
  const { dates, rows } = matrix

  if (dates.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        No lab results yet. Add your first panel below — new dates will appear as columns here.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
      <table className="w-full min-w-[32rem] border-collapse text-sm">
        <thead>
          <tr className="bg-[color-mix(in_srgb,var(--color-sage)_10%,var(--color-surface-elevated))]">
            <th className="sticky left-0 z-10 min-w-[9rem] border-b border-r border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-sage)_10%,var(--color-surface-elevated))] px-3 py-2.5 text-left font-semibold text-[var(--color-text)]">
              Lab test
            </th>
            {dates.map((date) => (
              <th
                key={date}
                className="min-w-[5.5rem] border-b border-[var(--color-border)] px-2 py-2.5 text-center font-semibold text-[var(--color-text)]"
              >
                <span className="block text-xs font-normal text-[var(--color-muted)]">
                  {formatShortDate(date)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.testName} className="border-b border-[var(--color-border)] last:border-0">
              <td className="sticky left-0 z-10 border-r border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2">
                <span className="font-medium text-[var(--color-text)]">{row.testName}</span>
                {row.unit && (
                  <span className="mt-0.5 block text-xs text-[var(--color-muted)]">{row.unit}</span>
                )}
              </td>
              {row.cells.map((cell, index) => {
                const previous = index > 0 ? row.cells[index - 1]?.value ?? null : null
                const delta =
                  cell != null ? formatLabDelta(cell.value, previous) : null

                return (
                  <td key={dates[index]} className="px-2 py-2 text-center align-middle">
                    {cell == null ? (
                      <span className="text-[var(--color-muted)]">—</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onEditCell(cell.id)}
                        title={cell.notes ? `${cell.value} — ${cell.notes}` : 'Tap to edit'}
                        className="group w-full rounded-lg px-1 py-1 transition-colors hover:bg-[color-mix(in_srgb,var(--color-sage)_12%,transparent)]"
                      >
                        <span className="font-semibold text-[var(--color-text)]">{cell.value}</span>
                        {delta != null && index > 0 && (
                          <span
                            className={`mt-0.5 block text-[10px] font-medium ${
                              delta.startsWith('+')
                                ? 'text-amber-700 dark:text-amber-400'
                                : delta.startsWith('-')
                                  ? 'text-[var(--color-sage)]'
                                  : 'text-[var(--color-muted)]'
                            }`}
                          >
                            {delta}
                          </span>
                        )}
                      </button>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
