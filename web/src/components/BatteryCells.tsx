import type { CSSProperties } from 'react'
import { formatPercent } from '../lib/format'

/**
 * Postęp jako bateria z ogniw: pełne ogniwa świecą voltem, ostatnie
 * częściowe "ładuje się" (pulsuje). Ogniwa zapalają się po kolei przy wejściu.
 */
export function BatteryCells({ progress, cells = 24, label }: { progress: number; cells?: number; label: string }) {
  const pct = Math.min(Math.max(progress, 0), 1)
  const exact = pct * cells
  const full = Math.floor(exact)
  const partial = exact - full

  return (
    <div
      className="battery"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
      aria-valuetext={formatPercent(pct)}
    >
      <div className="battery__body">
        {Array.from({ length: cells }, (_, i) => {
          const state = i < full ? 'full' : i === full && partial > 0.02 ? 'charging' : 'empty'
          return (
            <span
              key={i}
              className={`battery__cell battery__cell--${state}`}
              style={{ '--i': i, '--fill': state === 'charging' ? partial : 1 } as CSSProperties}
            />
          )
        })}
      </div>
      <span className="battery__cap" aria-hidden="true" />
    </div>
  )
}
