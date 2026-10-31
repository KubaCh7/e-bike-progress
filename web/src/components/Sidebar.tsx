import { useTranslation } from 'react-i18next'
import { useData } from '../state/DataContext'
import { useAuth } from '../state/AuthContext'
import { formatMoneyShort, formatPercent } from '../lib/format'
import { GoalPhoto } from './GoalPhoto'
import { BikeIcon, GearIcon, PlusIcon, StarIcon } from './Icons'

/** Panel boczny (komputer): lista celów, dodawanie e-bike'a, ustawienia. */
export function Sidebar({ onAddGoal, onSettings }: { onAddGoal: () => void; onSettings: () => void }) {
  const { t } = useTranslation()
  const { goals, currentGoal, selectGoal, statsFor } = useData()
  const auth = useAuth()

  return (
    <aside className="sidebar glass">
      <div className="sidebar__brand">
        <div className="sidebar__logo"><BikeIcon size={22} /></div>
        {t('app.title')}
      </div>

      <div className="sidebar__title">{t('nav.goals')}</div>
      <nav className="sidebar__goals" aria-label={t('nav.goals')}>
        {goals.map((goal) => {
          const stats = statsFor(goal)
          return (
            <button
              key={goal.id}
              type="button"
              className="goal-item"
              aria-current={goal.id === currentGoal?.id}
              onClick={() => selectGoal(goal.id)}
            >
              <div className="goal-item__photo"><GoalPhoto photoURL={goal.photoURL} alt="" /></div>
              <div style={{ minWidth: 0 }}>
                <div className="goal-item__name">
                  <span>{goal.name}</span>
                  {goal.isDefault && <StarIcon size={14} className="star" aria-label={t('home.mainGoal')} />}
                </div>
                <div className="goal-item__meta num">
                  {formatPercent(stats.progress)} · {formatMoneyShort(goal.targetAmount)}
                </div>
                <div className="mini-bar"><div style={{ width: `${stats.progress * 100}%` }} /></div>
              </div>
            </button>
          )
        })}
      </nav>

      <div className="sidebar__footer">
        <button type="button" className="btn btn--block" onClick={onAddGoal}>
          <PlusIcon /> {t('nav.addGoal')}
        </button>
        <button type="button" className="btn btn--block" onClick={onSettings}>
          <GearIcon /> {t('nav.settings')}
        </button>
        <p className="faint" style={{ fontSize: '0.75rem', textAlign: 'center' }}>
          {auth.status === 'signedIn' ? t('auth.signedInAs', { email: auth.email ?? 'Apple ID' }) : t('auth.localMode')}
        </p>
      </div>
    </aside>
  )
}

/** Górny pasek (telefon / wąskie okno): selektor celu + ustawienia. */
export function TopBar({ onAddGoal, onSettings }: { onAddGoal: () => void; onSettings: () => void }) {
  const { t } = useTranslation()
  const { goals, currentGoal, selectGoal } = useData()
  return (
    <header className="topbar glass glass--pill">
      <div className="sidebar__logo" style={{ width: 36, height: 36, borderRadius: 12 }}><BikeIcon size={18} /></div>
      <label className="topbar__select">
        <span className="visually-hidden">{t('nav.chooseGoal')}</span>
        <select value={currentGoal?.id ?? ''} onChange={(e) => selectGoal(e.target.value)}>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.isDefault ? '★ ' : ''}
              {g.name}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="btn btn--icon" onClick={onAddGoal} aria-label={t('nav.addGoal')}><PlusIcon /></button>
      <button type="button" className="btn btn--icon" onClick={onSettings} aria-label={t('nav.settings')}><GearIcon /></button>
    </header>
  )
}
