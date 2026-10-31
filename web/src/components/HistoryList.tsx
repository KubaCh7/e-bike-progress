import { useTranslation } from 'react-i18next'
import type { Deposit } from '../lib/types'
import { formatDate, formatMoney, localeFor, parseDay } from '../lib/format'
import { EditIcon, PlusIcon, TrashIcon } from './Icons'

/** Historia wpłat od najnowszej, pogrupowana po miesiącach, z edycją i usuwaniem. */
export function HistoryList({
  deposits,
  onEdit,
  onDelete,
  onAdd,
}: {
  deposits: Deposit[]
  onEdit: (d: Deposit) => void
  onDelete: (d: Deposit) => void
  onAdd: () => void
}) {
  const { t, i18n } = useTranslation()
  const locale = localeFor(i18n.language)

  const groups = new Map<string, Deposit[]>()
  for (const d of deposits) {
    const key = d.date.slice(0, 7)
    groups.set(key, [...(groups.get(key) ?? []), d])
  }

  return (
    <section className="card glass" aria-label={t('history.title')}>
      <div className="card__head">
        <h2 className="section-title">{t('history.title')}</h2>
        <span className="muted" style={{ fontSize: '0.85rem' }}>{t('history.count', { count: deposits.length })}</span>
      </div>

      {deposits.length === 0 ? (
        <div className="empty">
          <strong>{t('history.empty')}</strong>
          <span>{t('history.emptyDesc')}</span>
          <button type="button" className="btn btn--primary" onClick={onAdd}><PlusIcon /> {t('home.addDeposit')}</button>
        </div>
      ) : (
        <ul className="history">
          {[...groups.entries()].map(([month, items]) => (
            <li key={month}>
              <div className="history__month">
                <span>{new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(parseDay(`${month}-01`))}</span>
                <span className="num">{formatMoney(items.reduce((s, d) => s + d.amount, 0))}</span>
              </div>
              <ul className="history" aria-label={month}>
                {items.map((d) => (
                  <li key={d.id} className="history__row">
                    <span className="history__date muted">{formatDate(d.date, i18n.language)}</span>
                    <span className="history__amount num">{formatMoney(d.amount)}</span>
                    <span className="history__note" title={d.note ?? ''}>{d.note ?? ''}</span>
                    <span className="history__actions">
                      <button type="button" className="btn btn--icon btn--sm" onClick={() => onEdit(d)} aria-label={t('common.edit')}><EditIcon size={16} /></button>
                      <button type="button" className="btn btn--icon btn--sm btn--danger" onClick={() => onDelete(d)} aria-label={t('common.delete')}><TrashIcon size={16} /></button>
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
