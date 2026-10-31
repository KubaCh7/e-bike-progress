import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Deposit, Goal } from '../lib/types'
import { formatMoney, formatNumber, parseAmount, today } from '../lib/format'
import { useData } from '../state/DataContext'
import { ConfirmDialog, Modal } from './Modal'
import { Segmented } from './Segmented'
import { play } from '../lib/sound'

type Kind = 'in' | 'out'

const QUICK = [50, 100, 200, 500]

/** Wpłata albo wypłata: kwota, data (domyślnie dziś), notatka. Wypłata zapisuje się jako ujemna kwota. */
export function DepositModal({ goal, deposit, onClose, initialKind = 'in' }: { goal: Goal; deposit?: Deposit; onClose: () => void; initialKind?: Kind }) {
  const { t } = useTranslation()
  const { addDeposit, updateDeposit, deleteDeposit, showToast, statsFor } = useData()
  const [kind, setKind] = useState<Kind>(deposit ? (deposit.amount < 0 ? 'out' : 'in') : initialKind)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [amountText, setAmountText] = useState(deposit ? formatNumber(Math.abs(deposit.amount)) : '')
  const [date, setDate] = useState(deposit?.date ?? today())
  const [note, setNote] = useState(deposit?.note ?? '')
  const [busy, setBusy] = useState(false)

  const amount = parseAmount(amountText)
  // wypłata nie może przekroczyć tego, co jest uzbierane (przy edycji: plus ta sama wypłata)
  const available = statsFor(goal).total - (deposit && deposit.amount < 0 ? deposit.amount : 0) - (deposit && deposit.amount > 0 && kind === 'out' ? deposit.amount : 0)
  const tooMuch = kind === 'out' && amount !== null && amount > available + 0.001
  const valid = amount !== null && amount > 0 && amount < 10_000_000 && !!date && !tooMuch

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid || amount === null) return
    setBusy(true)
    try {
      const signed = kind === 'out' ? -amount : amount
      const input = { goalId: goal.id, amount: signed, date, note: note.trim() || null }
      if (deposit) await updateDeposit(deposit.id, input)
      else {
        await addDeposit(input)
        showToast(t(kind === 'out' ? 'deposit.withdrawn' : 'deposit.added', { amount: formatMoney(amount) }))
      }
      play(kind === 'out' ? 'withdraw' : 'deposit')
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
          play('remove')
          onClose()
        }}
      />
    )
  }

  return (
    <Modal title={deposit ? (kind === 'out' ? t('deposit.editOut') : t('deposit.edit')) : kind === 'out' ? t('deposit.newOut') : t('deposit.new')} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <Segmented
          block
          label={t('deposit.kind')}
          value={kind}
          onChange={setKind}
          options={[
            { value: 'in', label: t('deposit.kindIn') },
            { value: 'out', label: t('deposit.kindOut') },
          ]}
        />
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
          {amountText !== '' && !valid && <span className="hint error">{tooMuch ? t('deposit.tooMuch', { amount: formatMoney(Math.max(available, 0)) }) : t('deposit.invalidAmount')}</span>}
          <div className="chips">
            {kind === 'in' && QUICK.map((v) => (
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
        <p className="small muted">{t(kind === 'out' ? 'deposit.goalFooterOut' : 'deposit.goalFooter', { name: goal.name })}</p>
        <div className="form-actions">
          {deposit && (
            <button type="button" className="btn danger" onClick={() => setConfirmDelete(true)}>{kind === 'out' ? t('deposit.deleteOut') : t('deposit.delete')}</button>
          )}
          <span className="spacer" />
          <button type="submit" className="btn primary" disabled={!valid || busy}>
            {deposit ? t('common.save') : kind === 'out' ? t('deposit.addOut') : t('home.addDeposit')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
