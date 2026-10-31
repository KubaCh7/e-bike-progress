import { useCallback, useMemo, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthProvider, useAuth } from './state/AuthContext'
import { DataProvider, useData } from './state/DataContext'
import { useIsDark, useTheme } from './state/theme'
import { supabase } from './lib/supabase'
import { LocalStore } from './data/localStore'
import { SupabaseStore } from './data/supabaseStore'
import type { DataStore } from './data/store'
import type { Deposit } from './lib/types'
import { formatMoney, today } from './lib/format'
import { dataHue } from './lib/hue'
import { Sidebar, TopBar, type View } from './components/Shell'
import { DepositModal } from './components/DepositModal'
import { AddGoalModal, GoalModal } from './components/GoalModal'
import { AuthScreen } from './components/AuthScreen'
import { Onboarding } from './components/Onboarding'
import { ConfirmDialog } from './components/Modal'
import { CheckIcon } from './components/Icons'
import { LegalSheet } from './components/Legal'
import { OverviewPage } from './pages/OverviewPage'
import { DepositsPage } from './pages/DepositsPage'
import { BikesPage } from './pages/BikesPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
      <LegalSheet />
    </AuthProvider>
  )
}

function Loading() {
  const { t } = useTranslation()
  return (
    <main className="center-screen">
      <span className="spinner" role="status" aria-label={t('common.loading')} />
    </main>
  )
}

/** Logowanie albo aplikacja (z magazynem danych Supabase lub lokalnym). */
function AuthGate() {
  const auth = useAuth()
  const store = useMemo<DataStore | null>(() => {
    if (auth.status === 'signedIn' && supabase && auth.userId) return new SupabaseStore(supabase, auth.userId)
    if (auth.status === 'local') return new LocalStore()
    return null
  }, [auth.status, auth.userId])

  if (auth.status === 'loading') return <Loading />
  if (!store) return <AuthScreen />
  return (
    <DataProvider key={store.kind + (auth.userId ?? '')} store={store}>
      <Shell />
    </DataProvider>
  )
}

/** Ekran powitalny (imię + wybór e-bike'ów) albo aplikacja. */
function Shell() {
  const { t } = useTranslation()
  const { loading, profile, currentGoal, error, refresh } = useData()

  if (loading && !profile) return <Loading />
  if (error && !profile) {
    return (
      <main className="center-screen">
        <div className="alert" role="alert">
          <p>{t('common.error', { message: error })}</p>
          <div className="form-actions">
            <button type="button" className="btn primary" onClick={() => void refresh()}>{t('common.retry')}</button>
          </div>
        </div>
      </main>
    )
  }
  if (!profile?.onboarded || !currentGoal) return <Onboarding />
  return <Dashboard />
}

type Sheet =
  | { kind: 'deposit'; deposit?: Deposit }
  | { kind: 'editGoal'; goalId: string }
  | { kind: 'addGoal' }
  | { kind: 'deleteDeposit'; deposit: Deposit }
  | null

const VIEW_KEY = 'ebike.view'

function Dashboard() {
  const { t } = useTranslation()
  const data = useData()
  const [theme, setTheme] = useTheme()
  const dark = useIsDark()
  const [view, setViewState] = useState<View>(() => {
    try {
      const v = sessionStorage.getItem(VIEW_KEY)
      return v === 'deposits' || v === 'bikes' || v === 'settings' ? v : 'overview'
    } catch {
      return 'overview'
    }
  })
  const setView = (v: View) => {
    setViewState(v)
    window.scrollTo(0, 0)
    try {
      sessionStorage.setItem(VIEW_KEY, v)
    } catch {
      /* tryb prywatny */
    }
  }
  const [menuOpen, setMenuOpen] = useState(false)
  const [sheet, setSheet] = useState<Sheet>(null)
  const { currentGoal } = data
  const close = () => setSheet(null)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const hue = dataHue(data.catalogById(currentGoal?.catalogId)?.color, dark)
  const style = { '--data': hue, '--chart-1': hue } as CSSProperties

  const quickDeposit = async (amount: number) => {
    if (!currentGoal) return
    await data.addDeposit({ goalId: currentGoal.id, amount, date: today(), note: null })
    data.showToast(t('deposit.added', { amount: formatMoney(amount) }))
  }

  const editingGoal = sheet?.kind === 'editGoal' ? data.goals.find((g) => g.id === sheet.goalId) : undefined
  const titles: Record<View, string> = {
    overview: currentGoal?.name ?? t('view.overview'),
    deposits: t('view.deposits'),
    bikes: t('view.bikes'),
    settings: t('view.settings'),
  }
  const phoneAction =
    view === 'overview' || view === 'deposits' ? (
      <button type="button" className="btn primary sm" onClick={() => setSheet({ kind: 'deposit' })}>{t('deposit.short')}</button>
    ) : view === 'bikes' ? (
      <button type="button" className="btn primary sm" onClick={() => setSheet({ kind: 'addGoal' })}>{t('bikes.addShort')}</button>
    ) : undefined

  return (
    <div className="app" style={style}>
      <Sidebar view={view} onView={setView} open={menuOpen} onClose={closeMenu} onAddGoal={() => setSheet({ kind: 'addGoal' })} />
      <div className="main-col">
        <TopBar title={titles[view]} onMenu={() => setMenuOpen(true)} action={phoneAction} />
        <main className="canvas">
          {data.error && (
            <div className="banner" role="alert">
              <span>{t('common.error', { message: data.error })}</span>
              <button type="button" className="btn sm outline" onClick={() => void data.refresh()}>{t('common.retry')}</button>
            </div>
          )}
          {view === 'overview' && (
            <OverviewPage
              onAddDeposit={() => setSheet({ kind: 'deposit' })}
              onQuickDeposit={(amount) => void quickDeposit(amount)}
              onEditGoal={() => currentGoal && setSheet({ kind: 'editGoal', goalId: currentGoal.id })}
              onEditDeposit={(deposit) => setSheet({ kind: 'deposit', deposit })}
              onShowDeposits={() => setView('deposits')}
            />
          )}
          {view === 'deposits' && (
            <DepositsPage
              onAdd={() => setSheet({ kind: 'deposit' })}
              onEdit={(deposit) => setSheet({ kind: 'deposit', deposit })}
              onDelete={(deposit) => setSheet({ kind: 'deleteDeposit', deposit })}
            />
          )}
          {view === 'bikes' && (
            <BikesPage
              onAdd={() => setSheet({ kind: 'addGoal' })}
              onEdit={(goalId) => setSheet({ kind: 'editGoal', goalId })}
              onOpen={(goalId) => {
                data.selectGoal(goalId)
                setView('overview')
              }}
            />
          )}
          {view === 'settings' && <SettingsPage theme={theme} onTheme={setTheme} />}
        </main>
      </div>

      {sheet?.kind === 'deposit' && currentGoal && <DepositModal goal={currentGoal} deposit={sheet.deposit} onClose={close} />}
      {sheet?.kind === 'editGoal' && editingGoal && <GoalModal key={editingGoal.id} goal={editingGoal} onClose={close} />}
      {sheet?.kind === 'addGoal' && <AddGoalModal onClose={close} />}
      {sheet?.kind === 'deleteDeposit' && (
        <ConfirmDialog
          title={t('history.confirmDelete')}
          confirmLabel={t('common.delete')}
          onCancel={close}
          onConfirm={() => {
            void data.deleteDeposit(sheet.deposit.id)
            close()
          }}
        />
      )}

      {data.toast && (
        <div className="toast" role="status">
          <CheckIcon size={16} /> {data.toast}
        </div>
      )}
    </div>
  )
}
