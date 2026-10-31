import type { ReactNode } from 'react'

export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
}

/** Prosty przełącznik segmentowy (albo zakładki – tabs). Bez animowanych pastylek. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className = '',
  block = false,
  tabs = false,
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
  block?: boolean
  tabs?: boolean
}) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const index = options.findIndex((o) => o.value === value)
    const next = options[(index + (e.key === 'ArrowRight' ? 1 : options.length - 1)) % options.length]
    onChange(next.value)
    requestAnimationFrame(() => (e.currentTarget.querySelector('[tabindex="0"]') as HTMLElement | null)?.focus())
  }
  return (
    <div className={`segmented ${block ? 'block' : ''} ${className}`} role={tabs ? 'tablist' : 'group'} aria-label={label} onKeyDown={onKeyDown}>
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role={tabs ? 'tab' : undefined}
            aria-selected={tabs ? selected : undefined}
            aria-pressed={tabs ? undefined : selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
