import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../state/AuthContext'
import { useData } from '../state/DataContext'
import { formatPercent } from '../lib/format'
import { GoalPhoto } from './GoalPhoto'
import { BoltIcon, CheckIcon, ChevronDownIcon, CloseIcon, GearIcon, HomeIcon, ListIcon, MenuIcon, PlusIcon, BikeIcon } from './Icons'
import { LegalLinks } from './Legal'

export type View = 'overview' | 'deposits' | 'bikes' | 'settings'

export function Brand() {
  const { t } = useTranslation()
  return (
    <span className="brand">
      <span className="mark" aria-hidden="true"><BoltIcon size={14} /></span>
      {t('app.title')}
    </span>
  )
}

/** Boczne menu na tle strony (na telefonie: pełnoekranowy arkusz). */
export function Sidebar({
  view,
  onView,
  open,
  onClose,
  onAddGoal,
}: {
  view: View
  onView: (view: View) => void
  open: boolean
  onClose: () => void
  onAddGoal: () => void
}) {
  const { t } = useTranslation()
  const auth = useAuth()
  const { profile, goals, currentDeposits } = useData()
  const name = profile?.displayName?.trim() || t('app.title')

  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [open, onClose])

  const items: { id: View; label: string; icon: ReactNode; count?: number }[] = [
    { id: 'overview', label: t('view.overview'), icon: <HomeIcon size={16} /> },
    { id: 'deposits', label: t('view.deposits'), icon: <ListIcon size={16} />, count: currentDeposits.length },
    { id: 'bikes', label: t('view.bikes'), icon: <BikeIcon size={16} />, count: goals.length },
    { id: 'settings', label: t('view.settings'), icon: <GearIcon size={16} /> },
  ]

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`} aria-label={t('nav.tabs')}>
      <div className="sheet-head">
        <Brand />
        <button type="button" className="btn ghost icon" onClick={onClose} aria-label={t('common.close')}>
          <CloseIcon size={20} />
        </button>
      </div>
      <div className="desk-brand"><Brand /></div>
      <GoalSwitcher onAddGoal={onAddGoal} onPicked={onClose} />

      <nav className="nav" style={{ marginTop: 20 }}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="nav-item"
            aria-current={view === item.id ? 'page' : undefined}
            onClick={() => {
              onView(item.id)
              onClose()
            }}
          >
            {item.icon}
            {item.label}
            {item.count !== undefined && <span className="count">{item.count}</span>}
          </button>
        ))}
      </nav>

      <div className="bottom">
        <div className="user">
          <span className="initial" aria-hidden="true">{(name[0] ?? '·').toUpperCase()}</span>
          <span className="who">
            <span className="ellipsis">{name}</span>
            <span className="small muted ellipsis">{auth.status === 'signedIn' ? (auth.email ?? 'Apple ID') : t('auth.localShort')}</span>
          </span>
        </div>
        <LegalLinks />
      </div>
    </aside>
  )
}

/** Przełącznik e-bike'a (celu) u góry menu. */
function GoalSwitcher({ onAddGoal, onPicked }: { onAddGoal: () => void; onPicked: () => void }) {
  const { t } = useTranslation()
  const { goals, currentGoal, selectGoal, statsFor } = useData()
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
  return (
    <div className="switcher" ref={ref}>
      <button type="button" className="switcher-button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="listbox">
        <span className="thumb"><GoalPhoto goal={currentGoal} alt="" /></span>
        <span className="label">
          <span className="context">{t('nav.savingFor')}</span>
          <span className="ellipsis">{currentGoal.name}</span>
        </span>
        <ChevronDownIcon size={16} className="muted" />
      </button>
      {open && (
        <div className="menu" role="listbox" aria-label={t('nav.chooseGoal')}>
          {goals.map((goal) => (
            <button
              key={goal.id}
              type="button"
              role="option"
              aria-selected={goal.id === currentGoal.id}
              className="menu-item"
              onClick={() => {
                selectGoal(goal.id)
                setOpen(false)
                onPicked()
              }}
            >
              <span className="grow">
                <span className="ellipsis">{goal.name}</span>
                <span className="small muted num">
                  {formatPercent(statsFor(goal).progress)}
                  {goal.isDefault ? ` · ${t('goals.main')}` : ''}
                </span>
              </span>
              {goal.id === currentGoal.id && <CheckIcon size={16} />}
            </button>
          ))}
          <div className="menu-sep" />
          <button
            type="button"
            className="menu-item"
            onClick={() => {
              setOpen(false)
              onAddGoal()
            }}
          >
            <PlusIcon size={16} /> {t('nav.addGoal')}
          </button>
        </div>
      )}
    </div>
  )
}

/** Telefon: 48px pasek z nazwą ekranu, przyciskiem menu i jedną akcją. */
export function TopBar({ title, onMenu, action }: { title: string; onMenu: () => void; action?: ReactNode }) {
  const { t } = useTranslation()
  return (
    <header className="topbar">
      <button type="button" className="btn ghost icon" onClick={onMenu} aria-label={t('nav.menu')}>
        <MenuIcon size={20} />
      </button>
      <span className="title">{title}</span>
      {action}
    </header>
  )
}
