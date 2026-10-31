import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthProvider, useAuth } from './state/AuthContext'
import { DataProvider, useData } from './state/DataContext'
import { useTheme } from './state/theme'
import { supabase } from './lib/supabase'
import { LocalStore } from './data/localStore'
import { SupabaseStore } from './data/supabaseStore'
import type { DataStore } from './data/store'
import type { Deposit } from './lib/types'
import { formatMoney, today } from './lib/format'
import { PlainWallpaper, Wallpaper } from './components/Wallpaper'
import { Header } from './components/Header'
import { TabBar, type Tab } from './components/TabBar'
import { DepositModal } from './components/DepositModal'
import { AddGoalModal, GoalModal } from './components/GoalModal'
import { AuthScreen } from './components/AuthScreen'
import { Onboarding } from './components/Onboarding'
import { ConfirmDialog } from './components/Modal'
import { CheckIcon } from './components/Icons'
import { LegalFooter, LegalSheet } from './components/Legal'
import { HomePage } from './pages/HomePage'
import { HistoryPage } from './pages/HistoryPage'
import { StatsPage } from './pages/StatsPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
      <LegalSheet />
    </AuthProvider>
  )
}

/** Logowanie albo aplikacja (z magazynem danych Supabase lub lokalnym). */
function AuthGate() {
  const auth = useAuth()
  const { t } = useTranslation()

  const store = useMemo<DataStore | null>(() => {
    if (auth.status === 'signedIn' && supabase && auth.userId) return new SupabaseStore(supabase, auth.userId)
    if (auth.status === 'local') return new LocalStore()
    return null
  }, [auth.status, auth.userId])

  if (auth.status === 'loading') {
    return (
      <>
        <PlainWallpaper />
        <main className="center-screen"><span className="spinner" aria-label={t('common.loading')} /></main>
      </>
    )
  }

  if (!store) {
    return (
      <>
        <PlainWallpaper />
        <AuthScreen />
      </>
    )
  }

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

  if (loading && !profile) {
    return (
      <>
        <PlainWallpaper />
        <main className="center-screen"><span className="spinner" aria-label={t('common.loading')} /></main>
      </>
    )
  }
  if (error && !profile) {
    return (
      <>
        <PlainWallpaper />
        <main className="center-screen">
          <div className="alert glass">
            <p className="alert__title">{t('common.error', { message: error })}</p>
            <button type="button" className="btn btn--volt" onClick={() => void refresh()}>{t('common.retry')}</button>
          </div>
        </main>
      </>
    )
  }
  if (!profile?.onboarded || !currentGoal) {
    return (
      <>
        <PlainWallpaper />
        <Onboarding />
      </>
    )
  }
  return <Dashboard />
}

type Sheet =
  | { kind: 'deposit'; deposit?: Deposit }
  | { kind: 'editGoal'; goalId: string }
  | { kind: 'addGoal' }
  | { kind: 'deleteDeposit'; deposit: Deposit }
  | null

function Dashboard() {
  const { t } = useTranslation()
  const data = useData()
  const [theme, setTheme] = useTheme()
  const [tab, setTab] = useState<Tab>('home')
  const [sheet, setSheet] = useState<Sheet>(null)
  const { currentGoal } = data
  const close = () => setSheet(null)

  const quickDeposit = async (amount: number) => {
    if (!currentGoal) return
    await data.addDeposit({ goalId: currentGoal.id, amount, date: today(), note: null })
    data.showToast(t('deposit.added', { amount: formatMoney(amount) }))
  }

  const editingGoal = sheet?.kind === 'editGoal' ? data.goals.find((g) => g.id === sheet.goalId) : undefined

  return (
    <>
      <Wallpaper goal={currentGoal} />
      <div className="app">
        <Header onAddGoal={() => setSheet({ kind: 'addGoal' })} onProfile={() => setTab('settings')} />
        <TabBar tab={tab} onChange={setTab} />

        {data.error && (
          <div className="banner glass r-l" role="alert">
            <span className="error small">{t('common.error', { message: data.error })}</span>
            <button type="button" className="btn btn--sm glass--clear" onClick={() => void data.refresh()}>{t('common.retry')}</button>
          </div>
        )}

        <main key={tab} className="content">
          {tab === 'home' && (
            <HomePage
              onAddDeposit={() => setSheet({ kind: 'deposit' })}
              onQuickDeposit={(amount) => void quickDeposit(amount)}
              onEditGoal={() => currentGoal && setSheet({ kind: 'editGoal', goalId: currentGoal.id })}
              onEditDeposit={(deposit) => setSheet({ kind: 'deposit', deposit })}
            />
          )}
          {tab === 'history' && (
            <HistoryPage onEdit={(deposit) => setSheet({ kind: 'deposit', deposit })} onDelete={(deposit) => setSheet({ kind: 'deleteDeposit', deposit })} />
          )}
          {tab === 'stats' && <StatsPage />}
          {tab === 'settings' && (
            <SettingsPage
              theme={theme}
              onTheme={setTheme}
              onEditGoal={(goalId) => setSheet({ kind: 'editGoal', goalId })}
              onAddGoal={() => setSheet({ kind: 'addGoal' })}
            />
          )}
        </main>
        <LegalFooter />
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
        <div className="toast glass--clear r-pill" role="status">
          <CheckIcon size={18} /> {data.toast}
        </div>
      )}
    </>
  )
}
