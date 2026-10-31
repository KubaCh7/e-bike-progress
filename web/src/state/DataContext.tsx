import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DataStore } from '../data/store'
import type { Deposit, DepositInput, Goal, GoalInput } from '../lib/types'
import { computeStats, type SavingsStats } from '../lib/stats'

interface DataValue {
  store: DataStore
  goals: Goal[]
  deposits: Deposit[]
  loading: boolean
  error: string | null
  currentGoal: Goal | null
  currentDeposits: Deposit[]
  currentStats: SavingsStats | null
  selectGoal(id: string): void
  depositsFor(goalId: string): Deposit[]
  statsFor(goal: Goal): SavingsStats
  refresh(): Promise<void>
  createGoal(input: GoalInput, photo?: Blob | null): Promise<Goal>
  updateGoal(id: string, patch: Partial<GoalInput>, photo?: Blob | null): Promise<void>
  deleteGoal(id: string): Promise<void>
  setDefaultGoal(id: string): Promise<void>
  addDeposit(input: DepositInput): Promise<void>
  updateDeposit(id: string, patch: Partial<DepositInput>): Promise<void>
  deleteDeposit(id: string): Promise<void>
  toast: string | null
  showToast(message: string): void
}

const DataContext = createContext<DataValue | null>(null)
const SELECTED_KEY = 'selectedGoalId'

/** Stan danych aplikacji web – cele, wpłaty, wybrany cel. */
export function DataProvider({ store, children }: { store: DataStore; children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(() => localStorage.getItem(SELECTED_KEY))
  const [toast, setToast] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await store.load()
      setGoals(data.goals)
      setDeposits(data.deposits)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [store])

  useEffect(() => {
    setLoading(true)
    void refresh()
    const unsubscribe = store.subscribe?.(() => void refresh())
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      unsubscribe?.()
      window.removeEventListener('focus', onFocus)
    }
  }, [store, refresh])

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast((t) => (t === message ? null : t)), 2400)
  }, [])

  // wrapper: wykonaj akcję, potem odśwież; błąd pokaż w toaście
  const run = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T> => {
      try {
        const result = await action()
        await refresh()
        return result
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        setError(message)
        throw e
      }
    },
    [refresh],
  )

  const value = useMemo<DataValue>(() => {
    const sortedGoals = [...goals].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.createdAt.localeCompare(b.createdAt))
    const defaultGoal = sortedGoals.find((g) => g.isDefault) ?? sortedGoals[0] ?? null
    const currentGoal = sortedGoals.find((g) => g.id === selectedId) ?? defaultGoal
    const depositsFor = (goalId: string) =>
      deposits
        .filter((d) => d.goalId === goalId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    const currentDeposits = currentGoal ? depositsFor(currentGoal.id) : []

    return {
      store,
      goals: sortedGoals,
      deposits,
      loading,
      error,
      currentGoal,
      currentDeposits,
      currentStats: currentGoal ? computeStats(currentGoal.targetAmount, currentDeposits) : null,
      selectGoal(id) {
        setSelectedId(id)
        localStorage.setItem(SELECTED_KEY, id)
      },
      depositsFor,
      statsFor: (goal) => computeStats(goal.targetAmount, depositsFor(goal.id)),
      refresh,
      createGoal: (input, photo) =>
        run(async () => {
          let goal = await store.createGoal(input)
          if (photo) {
            const photoURL = await store.uploadPhoto(goal.id, photo)
            await store.updateGoal(goal.id, { photoURL })
            goal = { ...goal, photoURL }
          }
          setSelectedId(goal.id)
          localStorage.setItem(SELECTED_KEY, goal.id)
          return goal
        }),
      updateGoal: (id, patch, photo) =>
        run(async () => {
          const next = { ...patch }
          if (photo) next.photoURL = await store.uploadPhoto(id, photo)
          await store.updateGoal(id, next)
        }),
      deleteGoal: (id) => run(() => store.deleteGoal(id)),
      setDefaultGoal: (id) =>
        run(async () => {
          await store.setDefaultGoal(id)
          setSelectedId(id)
          localStorage.setItem(SELECTED_KEY, id)
        }),
      addDeposit: (input) => run(async () => void (await store.addDeposit(input))),
      updateDeposit: (id, patch) => run(() => store.updateDeposit(id, patch)),
      deleteDeposit: (id) => run(() => store.deleteDeposit(id)),
      toast,
      showToast,
    }
  }, [goals, deposits, loading, error, selectedId, store, refresh, run, toast, showToast])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData poza DataProvider')
  return ctx
}
