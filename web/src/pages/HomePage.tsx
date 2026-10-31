import { useTranslation } from 'react-i18next'
import { useData } from '../state/DataContext'
import { formatDate, formatMoney, formatMoneyShort, formatPercent } from '../lib/format'
import type { Deposit } from '../lib/types'
import { GoalPhoto } from '../components/GoalPhoto'
import { ProgressBar } from '../components/ProgressBar'
import { CameraIcon, PlusIcon } from '../components/Icons'

const QUICK = [100, 200, 500]

/** Start: zdjęcie celu, procent, pasek postępu, uzbierane / pozostało, szybka wpłata. */
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

  return (
    <div className="page page--home">
      <section className="hero">
        <div className="hero__photo glass r-xl">
          <GoalPhoto goal={goal} alt={goal.name} />
          <button type="button" className="btn btn--icon glass--clear hero__edit" onClick={onEditGoal} aria-label={t('home.changePhoto')}>
            <CameraIcon size={18} />
          </button>
        </div>

        <div className="hero__numbers">
          <div className="hero__percent num">{formatPercent(stats.progress)}</div>
          <ProgressBar progress={stats.progress} label={t('home.progress')} />
          <p className="hero__line num">
            <strong>{formatMoney(stats.total)}</strong>
            <span className="faint"> / {formatMoneyShort(goal.targetAmount)}</span>
          </p>
          <p className="hero__remaining">
            {stats.isAchieved ? (
              <span className="positive">{t('home.achieved')}</span>
            ) : (
              <span className="faint">{t('home.remainingLine', { amount: formatMoney(stats.remaining) })}</span>
            )}
          </p>
          <div className="hero__actions">
            <button type="button" className="btn btn--prominent btn--lg" onClick={onAddDeposit}>
              <PlusIcon /> {t('home.addDeposit')}
            </button>
            <div className="chips">
              {QUICK.map((amount) => (
                <button key={amount} type="button" className="btn btn--sm glass--clear num" onClick={() => onQuickDeposit(amount)}>
                  +{amount}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {currentDeposits.length > 0 && (
        <section className="recent">
          <h2 className="section-title">{t('home.recent')}</h2>
          <ul className="list glass r-l">
            {currentDeposits.slice(0, 3).map((d) => (
              <li key={d.id}>
                <button type="button" className="list__row" onClick={() => onEditDeposit(d)}>
                  <span className="num strong">{formatMoney(d.amount)}</span>
                  <span className="faint ellipsis">{d.note ?? ''}</span>
                  <span className="faint small">{formatDate(d.date, i18n.language)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
