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
import { Backdrop } from './components/Backdrop'
import { Sidebar, TopBar } from './components/Sidebar'
import { GoalHero } from './components/GoalHero'
import { StatsPanel } from './components/StatsPanel'
import { DepositsChart } from './components/DepositsChart'
import { HistoryList } from './components/HistoryList'
import { DepositModal } from './components/DepositModal'
import { GoalModal } from './components/GoalModal'
import { SettingsModal } from './components/SettingsModal'
import { AuthScreen } from './components/AuthScreen'
import { ConfirmDialog } from './components/Modal'
import { CheckIcon, PlusIcon } from './components/Icons'

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
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
        <div className="backdrop" aria-hidden="true"><div className="backdrop__blob" /><div className="backdrop__blob" /><div className="backdrop__blob" /></div>
        <main className="auth"><p className="glass glass--pill" style={{ padding: '12px 20px' }}>{t('common.loading')}</p></main>
      </>
    )
  }

  if (!store) {
    return (
      <>
        <div className="backdrop" aria-hidden="true">
          <div className="backdrop__blob" /><div className="backdrop__blob" /><div className="backdrop__blob" /><div className="backdrop__blob" /><div className="backdrop__blob" />
        </div>
        <AuthScreen />
      </>
    )
  }

  return (
    <DataProvider key={store.kind + (auth.userId ?? '')} store={store}>
      <Dashboard />
    </DataProvider>
  )
}

type ModalState =
  | { kind: 'deposit'; deposit?: Deposit }
  | { kind: 'goal'; goalId?: string }
  | { kind: 'settings' }
  | { kind: 'deleteDeposit'; deposit: Deposit }
  | null

function Dashboard() {
  const { t } = useTranslation()
  const data = useData()
  const [theme, setTheme] = useTheme()
  const [modal, setModal] = useState<ModalState>(null)
  const { currentGoal, currentStats, currentDeposits } = data
  const close = () => setModal(null)

  const quickDeposit = async (amount: number) => {
    if (!currentGoal) return
    await data.addDeposit({ goalId: currentGoal.id, amount, date: today(), note: null })
    data.showToast(t('deposit.added', { amount: formatMoney(amount) }))
  }

  const editingGoal = modal?.kind === 'goal' && modal.goalId ? data.goals.find((g) => g.id === modal.goalId) : undefined

  return (
    <>
      <Backdrop goal={currentGoal} />
      <div className="app">
        <Sidebar onAddGoal={() => setModal({ kind: 'goal' })} onSettings={() => setModal({ kind: 'settings' })} />

        <main className="main">
          <TopBar onAddGoal={() => setModal({ kind: 'goal' })} onSettings={() => setModal({ kind: 'settings' })} />

          {data.error && (
            <div className="error-bar glass glass--l" role="alert">
              <span>{t('common.error', { message: data.error })}</span>
              <button type="button" className="btn btn--sm" onClick={() => void data.refresh()}>{t('common.retry')}</button>
            </div>
          )}

          {data.loading && !currentGoal ? (
            <p className="glass glass--pill" style={{ padding: '12px 20px', alignSelf: 'center' }}>{t('common.loading')}</p>
          ) : currentGoal && currentStats ? (
            <>
              <GoalHero
                goal={currentGoal}
                stats={currentStats}
                onAddDeposit={() => setModal({ kind: 'deposit' })}
                onQuickDeposit={(amount) => void quickDeposit(amount)}
                onEditGoal={() => setModal({ kind: 'goal', goalId: currentGoal.id })}
              />
              <StatsPanel stats={currentStats} />
              <div className="wide">
                <DepositsChart deposits={currentDeposits} target={currentGoal.targetAmount} />
                <HistoryList
                  deposits={currentDeposits}
                  onAdd={() => setModal({ kind: 'deposit' })}
                  onEdit={(deposit) => setModal({ kind: 'deposit', deposit })}
                  onDelete={(deposit) => setModal({ kind: 'deleteDeposit', deposit })}
                />
              </div>
            </>
          ) : (
            <div className="empty glass">
              <p>{t('home.noGoals')}</p>
              <button type="button" className="btn btn--primary" onClick={() => setModal({ kind: 'goal' })}>
                <PlusIcon /> {t('nav.addGoal')}
              </button>
            </div>
          )}
        </main>
      </div>

      {currentGoal && (
        <button type="button" className="btn btn--primary fab" onClick={() => setModal({ kind: 'deposit' })}>
          <PlusIcon /> {t('home.addDeposit')}
        </button>
      )}

      {modal?.kind === 'deposit' && currentGoal && <DepositModal goal={currentGoal} deposit={modal.deposit} onClose={close} />}
      {modal?.kind === 'goal' && <GoalModal key={modal.goalId ?? 'new'} goal={editingGoal} onClose={close} />}
      {modal?.kind === 'settings' && (
        <SettingsModal theme={theme} onTheme={setTheme} onClose={close} onEditGoal={(goalId) => setModal({ kind: 'goal', goalId })} />
      )}
      {modal?.kind === 'deleteDeposit' && (
        <ConfirmDialog
          title={t('history.confirmDelete')}
          confirmLabel={t('common.delete')}
          onCancel={close}
          onConfirm={() => {
            void data.deleteDeposit(modal.deposit.id)
            close()
          }}
        />
      )}

      {data.toast && (
        <div className="toast glass glass--pill" role="status">
          <CheckIcon size={18} /> {data.toast}
        </div>
      )}
    </>
  )
}
