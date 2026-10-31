import { useTranslation } from 'react-i18next'
import { useData } from '../state/DataContext'
import { formatDate, formatMoney, formatMoneyShort, localeFor } from '../lib/format'
import type { Deposit } from '../lib/types'
import { GoalPhoto } from '../components/GoalPhoto'
import { BatteryCells } from '../components/BatteryCells'
import { BoltIcon, CameraIcon } from '../components/Icons'

const QUICK = [100, 200, 500]

/** Start: plakat z e-bike'iem, ogromny procent, bateria z ogniw, kwoty, szybka wpłata. */
export function HomePage({
  onAddDeposit,
  onQuickDeposit,
  onEditGoal,
  onEditDeposit,
}: {
  onAddDeposit: () => void
  onQuickDeposit: (amount: number) => void
  onEditGoal: () => void
  onEditDeposit: (d: Deposit) => void
}) {
  const { t, i18n } = useTranslation()
  const { currentGoal: goal, currentStats: stats, currentDeposits } = useData()
  if (!goal || !stats) return null
  const pct = Math.round(stats.progress * 100)
  const forecast = stats.isAchieved
    ? t('stats.forecastAchieved')
    : stats.forecastDate
      ? new Intl.DateTimeFormat(localeFor(i18n.language), { month: 'short', year: 'numeric' }).format(stats.forecastDate)
      : '—'

  return (
    <div className="page page--home">
      <section className="poster">
        <div className="poster__stage">
          <GoalPhoto goal={goal} alt={goal.name} />
          <span className="poster__ghost display" aria-hidden="true">{pct}</span>
          <button type="button" className="btn btn--icon glass--clear poster__edit" onClick={onEditGoal} aria-label={t('home.changePhoto')}>
            <CameraIcon size={18} />
          </button>
        </div>

        <div className="poster__panel">
          <div className="eyebrow eyebrow--volt"><BoltIcon size={12} /> {t('home.charge')}</div>
          <div className="mega display num" aria-label={`${pct}%`}>
            {pct}
            <span className="mega__unit">%</span>
          </div>
          <BatteryCells progress={stats.progress} label={t('home.progress')} />

          <dl className="readout">
            <div>
              <dt>{t('home.saved')}</dt>
              <dd className="display num">{formatMoneyShort(stats.total)}</dd>
            </div>
            <div>
              <dt>{t('home.remaining')}</dt>
              <dd className="display num">{formatMoneyShort(stats.remaining)}</dd>
            </div>
            <div>
              <dt>{t('home.eta')}</dt>
              <dd className="display num">{forecast}</dd>
            </div>
          </dl>

          <div className="poster__actions">
            <button type="button" className="btn btn--volt btn--lg" onClick={onAddDeposit}>
              <BoltIcon size={18} /> {t('home.deposit')}
            </button>
            <div className="chips">
              {QUICK.map((amount) => (
                <button key={amount} type="button" className="btn btn--sm glass--clear chip num" onClick={() => onQuickDeposit(amount)}>
                  +{amount}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {currentDeposits.length > 0 && (
        <section className="feed">
          <h2 className="eyebrow">{t('home.recent')}</h2>
          <ul className="feed__list">
            {currentDeposits.slice(0, 4).map((d, i) => (
              <li key={d.id} style={{ animationDelay: `${i * 60}ms` }}>
                <button type="button" className="feed__row" onClick={() => onEditDeposit(d)}>
                  <span className="feed__amount display num">+{formatMoney(d.amount)}</span>
                  <span className="feed__note">{d.note ?? ''}</span>
                  <span className="feed__date">{formatDate(d.date, i18n.language)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
