import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Deposit, Goal } from '../lib/types'
import { formatMoney, formatNumber, parseAmount, today } from '../lib/format'
import { useData } from '../state/DataContext'
import { Modal } from './Modal'

const QUICK = [50, 100, 200, 500]

/** "Dodaj wpłatę": kwota, data (domyślnie dziś), notatka. */
export function DepositModal({ goal, deposit, onClose }: { goal: Goal; deposit?: Deposit; onClose: () => void }) {
  const { t } = useTranslation()
  const { addDeposit, updateDeposit, showToast } = useData()
  const [amountText, setAmountText] = useState(deposit ? formatNumber(deposit.amount) : '')
  const [date, setDate] = useState(deposit?.date ?? today())
  const [note, setNote] = useState(deposit?.note ?? '')
  const [busy, setBusy] = useState(false)

  const amount = parseAmount(amountText)
  const valid = amount !== null && amount > 0 && amount < 10_000_000 && !!date

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid || amount === null) return
    setBusy(true)
    try {
      const input = { goalId: goal.id, amount, date, note: note.trim() || null }
      if (deposit) await updateDeposit(deposit.id, input)
      else {
        await addDeposit(input)
        showToast(t('deposit.added', { amount: formatMoney(amount) }))
      }
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={deposit ? t('deposit.edit') : t('deposit.new')} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'contents' }}>
        <label className="field">
          <span className="field__label">{t('deposit.amount')}</span>
          <span className="input-wrap">
            <input
              className="input input--big"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              aria-invalid={amountText !== '' && !valid}
            />
            <span className="input-wrap__suffix">zł</span>
          </span>
          {amountText !== '' && !valid && <span className="field__error">{t('deposit.invalidAmount')}</span>}
        </label>

        <div className="quick">
          {QUICK.map((v) => (
            <button key={v} type="button" className="btn btn--sm num" onClick={() => setAmountText(formatNumber((amount ?? 0) + v))}>
              +{v} zł
            </button>
          ))}
        </div>

        <label className="field">
          <span className="field__label">{t('deposit.date')}</span>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>

        <label className="field">
          <span className="field__label">{t('deposit.note')}</span>
          <textarea className="input" rows={2} maxLength={500} placeholder={t('deposit.notePlaceholder')} value={note} onChange={(e) => setNote(e.target.value)} />
          <span className="field__hint">{t('deposit.goalFooter', { name: goal.name })}</span>
        </label>

        <div className="modal__foot">
          <button type="button" className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button type="submit" className="btn btn--primary" disabled={!valid || busy}>{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  )
}
