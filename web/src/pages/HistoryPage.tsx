import { useTranslation } from 'react-i18next'
import { useData } from '../state/DataContext'
import { formatDate, formatMoney, localeFor, parseDay } from '../lib/format'
import type { Deposit } from '../lib/types'
import { DepositsChart } from '../components/DepositsChart'
import { EditIcon, TrashIcon } from '../components/Icons'

/** Historia: od najnowszej, pogrupowana po miesiącach; na komputerze obok wykres. */
export function HistoryPage({ onEdit, onDelete }: { onEdit: (d: Deposit) => void; onDelete: (d: Deposit) => void }) {
  const { t, i18n } = useTranslation()
  const { currentGoal, currentDeposits: deposits } = useData()
  if (!currentGoal) return null
  const locale = localeFor(i18n.language)

  const groups = new Map<string, Deposit[]>()
  for (const d of deposits) groups.set(d.date.slice(0, 7), [...(groups.get(d.date.slice(0, 7)) ?? []), d])

  return (
    <div className="page page--history">
      <div className="history-layout">
        <DepositsChart deposits={deposits} target={currentGoal.targetAmount} compact />

        <section className="history">
          {deposits.length === 0 ? (
            <div className="empty glass r-l">
              <strong>{t('history.empty')}</strong>
              <span className="faint">{t('history.emptyDesc')}</span>
            </div>
          ) : (
            [...groups.entries()].map(([month, items]) => (
              <div key={month} className="history__group">
                <div className="history__month">
                  <span className="cap">{new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(parseDay(`${month}-01`))}</span>
                  <span className="num">{formatMoney(items.reduce((s, d) => s + d.amount, 0))}</span>
                </div>
                <ul className="list glass r-l">
                  {items.map((d) => (
                    <li key={d.id} className="list__row list__row--static">
                      <span className="num strong">{formatMoney(d.amount)}</span>
                      <span className="faint ellipsis" title={d.note ?? ''}>{d.note ?? ''}</span>
                      <span className="faint small">{formatDate(d.date, i18n.language)}</span>
                      <span className="list__actions">
                        <button type="button" className="btn btn--icon btn--sm btn--plain" onClick={() => onEdit(d)} aria-label={t('common.edit')}>
                          <EditIcon size={16} />
                        </button>
                        <button type="button" className="btn btn--icon btn--sm btn--plain btn--danger" onClick={() => onDelete(d)} aria-label={t('common.delete')}>
                          <TrashIcon size={16} />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  )
}
