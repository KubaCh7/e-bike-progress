import { useTranslation } from 'react-i18next'
import { useData } from '../state/DataContext'
import { formatDate, formatMoney, formatMoneyShort, localeFor, parseDay } from '../lib/format'
import type { Deposit } from '../lib/types'
import { MonthlyBars } from '../components/Charts'

/** Wpłaty: sumy w miesiącach i pełna lista, pogrupowana po miesiącach (od najnowszej). */
export function DepositsPage({ onAdd, onEdit, onDelete }: { onAdd: () => void; onEdit: (d: Deposit) => void; onDelete: (d: Deposit) => void }) {
  const { t, i18n } = useTranslation()
  const { currentGoal, currentDeposits: deposits, currentStats: stats } = useData()
  if (!currentGoal || !stats) return null
  const locale = localeFor(i18n.language)
  const monthName = (key: string) => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(parseDay(`${key}-01`))

  const groups = new Map<string, Deposit[]>()
  for (const d of deposits) groups.set(d.date.slice(0, 7), [...(groups.get(d.date.slice(0, 7)) ?? []), d])
  const sum = (items: Deposit[]) => Math.round(items.reduce((s, d) => s + d.amount * 100, 0)) / 100

  return (
    <div className="page">
      <div className="title-row">
        <div>
          <h1>{t('view.deposits')}</h1>
          <p className="sub">
            {deposits.length
              ? t('deposits.sub', { count: deposits.length, total: formatMoneyShort(stats.total), name: currentGoal.name })
              : t('deposits.subEmpty', { name: currentGoal.name })}
          </p>
        </div>
        <div className="actions desk">
          <button type="button" className="btn primary" onClick={onAdd}>{t('home.addDeposit')}</button>
        </div>
      </div>

      <div className="stack">
        <section className="panel">
          <div className="panel-head">
            <h2>{t('deposits.monthly')}</h2>
            <span className="meta num">{t('deposits.thisMonth', { amount: formatMoneyShort(stats.thisMonth) })}</span>
          </div>
          <MonthlyBars deposits={deposits} />
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>{t('deposits.list')}</h2>
            <span className="meta">{t('history.count', { count: deposits.length })}</span>
          </div>
          {deposits.length === 0 ? (
            <div className="empty">
              <strong>{t('history.empty')}</strong>
              <span>{t('history.emptyDesc')}</span>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="ledger">
                <thead>
                  <tr>
                    <th>{t('history.date')}</th>
                    <th>{t('history.note')}</th>
                    <th className="n">{t('history.amount')}</th>
                    <th className="n acts"><span className="visually-hidden">{t('deposits.actions')}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {[...groups.entries()].map(([month, items]) => [
                    <tr key={month} className="month">
                      <td colSpan={2} style={{ textTransform: 'none' }}>
                        <span className="cap">{monthName(month)}</span>
                      </td>
                      <td className="n num">{formatMoney(sum(items))}</td>
                      <td />
                    </tr>,
                    ...items.map((d) => (
                      <tr key={d.id}>
                        <td className="date">{formatDate(d.date, i18n.language)}</td>
                        <td className="note">{d.note || <span className="muted">—</span>}</td>
                        <td className="n money num">{formatMoney(d.amount)}</td>
                        <td className="n acts">
                          <span className="row-actions">
                            <button type="button" className="btn ghost sm" onClick={() => onEdit(d)}>{t('common.edit')}</button>
                            <button type="button" className="btn danger sm" onClick={() => onDelete(d)}>{t('common.delete')}</button>
                          </span>
                        </td>
                      </tr>
                    )),
                  ])}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
