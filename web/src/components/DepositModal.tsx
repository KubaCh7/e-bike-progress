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
      <form onSubmit={submit} className="form">
        <label className="amount">
          <span className="visually-hidden">{t('deposit.amount')}</span>
          <input
            className="amount__input num"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            aria-invalid={amountText !== '' && !valid}
          />
          <span className="amount__suffix">zł</span>
        </label>
        {amountText !== '' && !valid && <p className="error small center">{t('deposit.invalidAmount')}</p>}

        <div className="chips">
          {QUICK.map((v) => (
            <button key={v} type="button" className="btn btn--sm glass--clear num" onClick={() => setAmountText(formatNumber((amount ?? 0) + v))}>
              +{v}
            </button>
          ))}
        </div>

        <div className="group glass--clear r-l">
          <label className="row">
            <span className="row__label">{t('deposit.date')}</span>
            <input className="row__input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="row">
            <span className="row__label">{t('deposit.note')}</span>
            <input className="row__input" maxLength={500} placeholder={t('deposit.notePlaceholder')} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        </div>
        <p className="faint small center">{t('deposit.goalFooter', { name: goal.name })}</p>

        <button type="submit" className="btn btn--volt btn--lg btn--block" disabled={!valid || busy}>
          {deposit ? t('common.save') : t('home.addDeposit')}
        </button>
      </form>
    </Modal>
  )
}
