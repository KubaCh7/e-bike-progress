import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
  icon?: ReactNode
}

/**
 * Segmented control / pasek zakładek z przesuwaną szklaną pastylką (jak w iOS 26).
 * Pastylka przeskakuje ze sprężystą animacją i "rozciąga się" w trakcie ruchu.
 */
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
  /** true = zakładki (role tablist), false = przełącznik (role group) */
  tabs?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const itemRefs = useRef(new Map<T, HTMLButtonElement>())
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null)
  const previous = useRef(value)

  useLayoutEffect(() => {
    const measure = () => {
      const el = itemRefs.current.get(value)
      const container = containerRef.current
      if (!el || !container) return
      setPill({ x: el.offsetLeft, w: el.offsetWidth })
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [value, options.length])

  // restart animacji "kropli" przy każdej zmianie zaznaczenia
  useLayoutEffect(() => {
    if (previous.current === value) return
    previous.current = value
    const el = pillRef.current
    if (!el) return
    el.classList.remove('is-moving')
    void el.offsetWidth
    el.classList.add('is-moving')
  }, [value])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const index = options.findIndex((o) => o.value === value)
    const next = options[(index + (e.key === 'ArrowRight' ? 1 : options.length - 1)) % options.length]
    onChange(next.value)
    itemRefs.current.get(next.value)?.focus()
  }

  return (
    <div
      ref={containerRef}
      className={`seg ${block ? 'seg--block' : ''} ${className}`}
      role={tabs ? 'tablist' : 'group'}
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {pill && (
        <span
          ref={pillRef}
          className="seg__pill"
          style={{ width: pill.w, transform: `translateX(${pill.x - 0}px)` }}
          onAnimationEnd={(e) => e.currentTarget.classList.remove('is-moving')}
          aria-hidden="true"
        />
      )}
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            ref={(el) => {
              if (el) itemRefs.current.set(o.value, el)
              else itemRefs.current.delete(o.value)
            }}
            type="button"
            className="seg__item"
            role={tabs ? 'tab' : undefined}
            aria-selected={tabs ? selected : undefined}
            aria-pressed={tabs ? undefined : selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
          >
            {o.icon}
            <span>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
