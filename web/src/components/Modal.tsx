import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CloseIcon } from './Icons'

/** Okno dialogowe: na komputerze wyśrodkowane, na telefonie wysuwa się od dołu. */
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
    const first = ref.current?.querySelector<HTMLElement>('input:not([type=checkbox]):not([type=file]), textarea, select')
    ;(first ?? ref.current)?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [onClose])

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} className={`dialog ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="dialog-head">
          <h2>{title}</h2>
          <button type="button" className="btn ghost icon" onClick={onClose} aria-label={t('common.close')}>
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-foot">{footer}</div>}
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
      <div className="alert" role="alertdialog" aria-modal="true" aria-label={title}>
        <p>{title}</p>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onCancel} autoFocus>{t('common.cancel')}</button>
          <button type="button" className="btn danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
