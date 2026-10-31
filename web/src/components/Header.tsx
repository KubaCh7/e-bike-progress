import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../state/DataContext'
import { formatPercent } from '../lib/format'
import { GoalPhoto } from './GoalPhoto'
import { BoltIcon, CheckIcon, ChevronDownIcon, PlusIcon, StarIcon } from './Icons'

/** Minimalny nagłówek: powitanie i szklany przełącznik celu. */
export function Header({ onAddGoal, onProfile }: { onAddGoal: () => void; onProfile: () => void }) {
  const { t } = useTranslation()
  const { profile, currentGoal } = useData()
  const name = profile?.displayName?.trim()

  return (
    <header className="header">
      <div className="header__left">
        <span className="mark" aria-hidden="true"><BoltIcon size={16} /></span>
        <span className="eyebrow">{name ? t('header.hello', { name }) : t('app.title')}</span>
      </div>
      <button type="button" className="avatar" onClick={onProfile} aria-label={t('tab.settings')}>
        {(name?.[0] ?? '·').toUpperCase()}
      </button>
      {currentGoal && (
        <div className="header__goal">
          <GoalSwitcher onAddGoal={onAddGoal} />
        </div>
      )}
    </header>
  )
}

function GoalSwitcher({ onAddGoal }: { onAddGoal: () => void }) {
  const { t } = useTranslation()
  const { goals, currentGoal, selectGoal, statsFor, catalogById } = useData()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  if (!currentGoal) return null
  // "Sur-Ron Light Bee X" → marka nad nazwą modelu
  const bike = catalogById(currentGoal.catalogId)
  const goalModel = bike && currentGoal.name.toLowerCase().startsWith(bike.brand.toLowerCase())
    ? currentGoal.name.slice(bike.brand.length).trim() || currentGoal.name
    : currentGoal.name
  return (
    <div className="switcher" ref={ref}>
      <button type="button" className="switcher__button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="listbox">
        {bike ? (
          <>
            <span className="switcher__brand" style={{ color: bike.color }}>{bike.brand}</span>
            <span className="switcher__name">{goalModel}</span>
          </>
        ) : (
          <span className="switcher__name">{currentGoal.name}</span>
        )}
        <ChevronDownIcon size={26} className={`switcher__chev ${open ? 'rot' : ''}`} />
      </button>
      {open && (
        <div className="popover glass" role="listbox" aria-label={t('nav.chooseGoal')}>
          {goals.map((goal) => (
            <button
              key={goal.id}
              type="button"
              role="option"
              aria-selected={goal.id === currentGoal.id}
              className="popover__item"
              onClick={() => {
                selectGoal(goal.id)
                setOpen(false)
              }}
            >
              <span className="popover__thumb"><GoalPhoto goal={goal} alt="" /></span>
              <span className="popover__text">
                <span className="popover__title">
                  {goal.name} {goal.isDefault && <StarIcon size={12} className="star" />}
                </span>
                <span className="faint num">{formatPercent(statsFor(goal).progress)}</span>
              </span>
              {goal.id === currentGoal.id && <CheckIcon size={18} className="volt-text" />}
            </button>
          ))}
          <button
            type="button"
            className="popover__item popover__add"
            onClick={() => {
              setOpen(false)
              onAddGoal()
            }}
          >
            <span className="popover__thumb popover__thumb--add"><PlusIcon /></span>
            <span className="popover__title">{t('nav.addGoal')}</span>
          </button>
        </div>
      )}
    </div>
  )
}
