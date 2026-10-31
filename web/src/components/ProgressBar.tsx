import { formatPercent } from '../lib/format'

/** Pasek postępu: szklany tor z wypełnieniem akcentu. */
export function ProgressBar({ progress, label }: { progress: number; label: string }) {
  const pct = Math.min(Math.max(progress, 0), 1)
  return (
    <div
      className="progress glass--clear r-pill"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
      aria-valuetext={formatPercent(pct)}
    >
      <div className="progress__fill" style={{ width: `${pct > 0 ? Math.max(pct * 100, 4) : 0}%` }} />
    </div>
  )
}
