import { useTranslation } from 'react-i18next'
import type { Goal } from '../lib/types'
import type { SavingsStats } from '../lib/stats'
import { formatMoney, formatPercent } from '../lib/format'
import { GoalPhoto } from './GoalPhoto'
import { ProgressBar } from './ProgressBar'
import { CameraIcon, EditIcon, FlagIcon, PlusIcon, StarIcon, WalletIcon } from './Icons'

const QUICK = [100, 200, 500]

/** Ekran główny: zdjęcie, uzbierane, pozostało, procent, pasek postępu. */
export function GoalHero({
  goal,
  stats,
  onAddDeposit,
  onQuickDeposit,
  onEditGoal,
}: {
  goal: Goal
  stats: SavingsStats
  onAddDeposit: () => void
  onQuickDeposit: (amount: number) => void
  onEditGoal: () => void
}) {
  const { t } = useTranslation()

  return (
    <section className="hero glass" aria-label={goal.name}>
      <div className="hero__photo">
        <GoalPhoto photoURL={goal.photoURL} alt={goal.name} />
        {goal.isDefault && (
          <span className="hero__badge glass glass--pill">
            <StarIcon size={14} className="star" /> {t('home.mainGoal')}
          </span>
        )}
        <button type="button" className="btn btn--icon hero__photo-btn" onClick={onEditGoal} aria-label={t('home.changePhoto')}>
          <CameraIcon />
        </button>
      </div>

      <div className="hero__info">
        <div>
          <h1 className="hero__name">{goal.name}</h1>
          <p className="muted num">{t('home.target', { amount: formatMoney(goal.targetAmount) })}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span className="hero__percent num">{formatPercent(stats.progress)}</span>
          {stats.isAchieved && <span className="hero__achieved">{t('home.achieved')}</span>}
        </div>

        <ProgressBar progress={stats.progress} label={t('home.progress')} />

        <div className="hero__chips">
          <div className="chip glass glass--l">
            <div className="chip__label"><WalletIcon size={16} /> {t('home.saved')}</div>
            <div className="chip__value num">{formatMoney(stats.total)}</div>
          </div>
          <div className="chip glass glass--l">
            <div className="chip__label"><FlagIcon size={16} /> {t('home.remaining')}</div>
            <div className="chip__value num">{formatMoney(stats.remaining)}</div>
          </div>
        </div>

        <div className="hero__actions">
          <button type="button" className="btn btn--primary hide-mobile" onClick={onAddDeposit}>
            <PlusIcon /> {t('home.addDeposit')}
          </button>
          {QUICK.map((amount) => (
            <button key={amount} type="button" className="btn btn--sm num" onClick={() => onQuickDeposit(amount)} title={t('home.quick')}>
              +{amount} zł
            </button>
          ))}
          <button type="button" className="btn btn--sm" onClick={onEditGoal}>
            <EditIcon size={16} /> {t('common.edit')}
          </button>
        </div>
      </div>
    </section>
  )
}
