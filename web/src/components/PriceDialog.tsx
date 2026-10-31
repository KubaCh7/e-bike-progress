import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Goal } from '../lib/types'
import { formatMoney, formatNumber, parseAmount } from '../lib/format'
import { useData } from '../state/DataContext'
import { Modal } from './Modal'
import { play } from '../lib/sound'

/**
 * Zmiana ceny e-bike'a (np. ktoś znalazł taniej): krok 1 – nowa cena,
 * krok 2 – potwierdzenie „z X na Y”, dopiero wtedy zapis.
 */
export function PriceDialog({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { t } = useTranslation()
  const { updateGoal, showToast, statsFor } = useData()
  const [text, setText] = useState(formatNumber(goal.targetAmount))
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const price = parseAmount(text)
  const valid = price !== null && price > 0 && price < 10_000_000 && price !== goal.targetAmount
  const diff = price !== null ? price - goal.targetAmount : 0
  const saved = statsFor(goal).total

  function next(e: FormEvent) {
    e.preventDefault()
    if (valid) setConfirming(true)
  }

  async function confirm() {
    if (!valid || price === null) return
    setBusy(true)
    try {
      await updateGoal(goal.id, { targetAmount: price })
      play('tick')
      showToast(t('price.changed', { amount: formatMoney(price) }))
      onClose()
    } finally {
      setBusy(false)
    }
  }

  if (confirming && price !== null) {
    return (
      <Modal title={t('price.confirmTitle')} onClose={onClose}>
        <div className="form">
          <p>{t('price.confirmText', { name: goal.name })}</p>
          <div className="rows">
            <div className="row kv">
              <span>{t('price.old')}</span>
              <span className="num" style={{ textDecoration: 'line-through' }}>{formatMoney(goal.targetAmount)}</span>
            </div>
            <div className="row kv">
              <span>{t('price.new')}</span>
              <span className="num money">{formatMoney(price)}</span>
            </div>
            <div className="row kv">
              <span>{t('price.diff')}</span>
              <span className="num">{diff < 0 ? '−' : '+'}{formatMoney(Math.abs(diff))}</span>
            </div>
            <div className="row kv">
              <span>{t('overview.left')}</span>
              <span className="num">{formatMoney(Math.max(price - saved, 0))}</span>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn ghost" onClick={() => setConfirming(false)}>{t('common.back')}</button>
            <span className="spacer" />
            <button type="button" className="btn primary" disabled={busy} onClick={() => void confirm()}>
              {busy ? t('common.loading') : t('price.confirm')}
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={t('price.title')} onClose={onClose}>
      <form className="form" onSubmit={next}>
        <p className="muted">{t('price.text')}</p>
        <div className="field">
          <label htmlFor="new-price">{t('price.new')}</label>
          <div className="input-affix">
            <input id="new-price" className="input big" inputMode="decimal" autoComplete="off" value={text} onChange={(e) => setText(e.target.value)} />
            <span className="affix">zł</span>
          </div>
          <span className="hint">{t('price.current', { amount: formatMoney(goal.targetAmount) })}</span>
          {text !== '' && (price === null || price <= 0) && <span className="hint error">{t('goals.invalidPrice')}</span>}
        </div>
        <div className="form-actions">
          <span className="spacer" />
          <button type="submit" className="btn primary" disabled={!valid}>{t('common.next')}</button>
        </div>
      </form>
    </Modal>
  )
}
