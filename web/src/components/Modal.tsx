import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CloseIcon } from './Icons'

/** Szklany arkusz (sheet): na telefonie wysuwa się od dołu, na komputerze jest wycentrowany. */
export function Modal({
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const previous = document.activeElement as HTMLElement | null
    const first = ref.current?.querySelector<HTMLElement>('input:not([type=checkbox]), textarea, select')
    ;(first ?? ref.current)?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [onClose])

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} className={`sheet glass ${wide ? 'sheet--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet__grabber" aria-hidden="true" />
        <div className="sheet__head">
          <button type="button" className="btn btn--icon glass--clear" onClick={onClose} aria-label={t('common.close')}>
            <CloseIcon size={18} />
          </button>
          <h2 className="sheet__title">{title}</h2>
          <span style={{ width: 44 }} />
        </div>
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__foot">{footer}</div>}
      </div>
    </div>
  )
}

/** Potwierdzenie (np. usunięcia). */
export function ConfirmDialog({
  title,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="alert glass" role="alertdialog" aria-modal="true" aria-label={title}>
        <p className="alert__title">{title}</p>
        <div className="alert__actions">
          <button type="button" className="btn glass--clear" onClick={onCancel} autoFocus>{t('common.cancel')}</button>
          <button type="button" className="btn btn--plain btn--danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
