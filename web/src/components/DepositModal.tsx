import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Deposit, Goal } from '../lib/types'
import { formatMoney, formatNumber, parseAmount, today } from '../lib/format'
import { useData } from '../state/DataContext'
import { ConfirmDialog, Modal } from './Modal'

const QUICK = [50, 100, 200, 500]

/** "Dodaj wpłatę": kwota, data (domyślnie dziś), notatka. */
export function DepositModal({ goal, deposit, onClose }: { goal: Goal; deposit?: Deposit; onClose: () => void }) {
  const { t } = useTranslation()
  const { addDeposit, updateDeposit, deleteDeposit, showToast } = useData()
  const [confirmDelete, setConfirmDelete] = useState(false)
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

  if (confirmDelete && deposit) {
    return (
      <ConfirmDialog
        title={t('history.confirmDelete')}
        confirmLabel={t('common.delete')}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteDeposit(deposit.id)
          onClose()
        }}
      />
    )
  }

  return (
    <Modal title={deposit ? t('deposit.edit') : t('deposit.new')} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <div className="field">
          <label htmlFor="dep-amount">{t('deposit.amount')}</label>
          <div className="input-affix">
            <input
              id="dep-amount"
              className="input big"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              aria-invalid={amountText !== '' && !valid}
            />
            <span className="affix">zł</span>
          </div>
          {amountText !== '' && !valid && <span className="hint error">{t('deposit.invalidAmount')}</span>}
          <div className="chips">
            {QUICK.map((v) => (
              <button key={v} type="button" className="btn sm outline num" onClick={() => setAmountText(formatNumber((amount ?? 0) + v))}>
                +{v} zł
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="dep-date">{t('deposit.date')}</label>
          <input id="dep-date" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="dep-note">{t('deposit.note')}</label>
          <input id="dep-note" className="input" maxLength={500} placeholder={t('deposit.notePlaceholder')} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <p className="small muted">{t('deposit.goalFooter', { name: goal.name })}</p>
        <div className="form-actions">
          {deposit && (
            <button type="button" className="btn danger" onClick={() => setConfirmDelete(true)}>{t('deposit.delete')}</button>
          )}
          <span className="spacer" />
          <button type="submit" className="btn primary" disabled={!valid || busy}>
            {deposit ? t('common.save') : t('home.addDeposit')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
