import type { DataStore } from './store'
import { resolveAsset } from './store'
import { DEFAULT_GOAL, type Deposit, type Goal } from '../lib/types'
import { blobToDataURL } from '../lib/image'

const KEY = 'ebike.local.v1'

interface LocalData {
  goals: Goal[]
  deposits: Deposit[]
}

const uuid = () => crypto.randomUUID()

/** Tryb bez konta – dane w localStorage tej przeglądarki. */
export class LocalStore implements DataStore {
  readonly kind = 'local' as const

  private read(): LocalData {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) return JSON.parse(raw) as LocalData
    } catch {
      /* uszkodzone dane – zaczynamy od nowa */
    }
    // pierwsze uruchomienie: cel e-ride pro SR za 30 000 zł
    const seed: LocalData = {
      goals: [
        {
          id: uuid(),
          name: DEFAULT_GOAL.name,
          targetAmount: DEFAULT_GOAL.targetAmount,
          photoURL: DEFAULT_GOAL.photoURL,
          isDefault: true,
          createdAt: new Date().toISOString(),
          seedKey: DEFAULT_GOAL.seedKey,
        },
      ],
      deposits: [],
    }
    this.write(seed)
    return seed
  }

  private write(data: LocalData) {
    localStorage.setItem(KEY, JSON.stringify(data))
  }

  private mutate(fn: (data: LocalData) => void) {
    const data = this.read()
    fn(data)
    this.write(data)
  }

  async load() {
    return this.read()
  }

  async createGoal(input: Parameters<DataStore['createGoal']>[0]) {
    const goal: Goal = {
      id: uuid(),
      name: input.name,
      targetAmount: input.targetAmount,
      photoURL: input.photoURL ?? null,
      isDefault: false,
      createdAt: new Date().toISOString(),
      seedKey: null,
    }
    this.mutate((d) => {
      d.goals.push(goal)
      if (input.isDefault || !d.goals.some((g) => g.isDefault)) d.goals.forEach((g) => (g.isDefault = g.id === goal.id))
    })
    return goal
  }

  async updateGoal(id: string, patch: Parameters<DataStore['updateGoal']>[1]) {
    this.mutate((d) => {
      const goal = d.goals.find((g) => g.id === id)
      if (goal) Object.assign(goal, patch)
    })
  }

  async deleteGoal(id: string) {
    this.mutate((d) => {
      const wasDefault = d.goals.find((g) => g.id === id)?.isDefault
      d.goals = d.goals.filter((g) => g.id !== id)
      d.deposits = d.deposits.filter((x) => x.goalId !== id)
      if (wasDefault && d.goals[0]) d.goals[0].isDefault = true
    })
  }

  async setDefaultGoal(id: string) {
    this.mutate((d) => d.goals.forEach((g) => (g.isDefault = g.id === id)))
  }

  async addDeposit(input: Parameters<DataStore['addDeposit']>[0]) {
    const deposit: Deposit = { id: uuid(), ...input, createdAt: new Date().toISOString() }
    this.mutate((d) => d.deposits.push(deposit))
    return deposit
  }

  async updateDeposit(id: string, patch: Parameters<DataStore['updateDeposit']>[1]) {
    this.mutate((d) => {
      const deposit = d.deposits.find((x) => x.id === id)
      if (deposit) Object.assign(deposit, patch)
    })
  }

  async deleteDeposit(id: string) {
    this.mutate((d) => (d.deposits = d.deposits.filter((x) => x.id !== id)))
  }

  async uploadPhoto(_goalId: string, photo: Blob) {
    return blobToDataURL(photo)
  }

  async resolvePhoto(photoURL: string | null) {
    if (!photoURL) return null
    return resolveAsset(photoURL) ?? photoURL
  }
}
