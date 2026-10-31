import type { DataStore } from './store'
import { BUNDLED_CATALOG, resolveAsset } from './store'
import type { Deposit, Goal, Profile } from '../lib/types'
import { blobToDataURL } from '../lib/image'

const KEY = 'ebike.local.v1'

interface LocalData {
  goals: Goal[]
  deposits: Deposit[]
  profile?: Profile
}

const uuid = () => crypto.randomUUID()

/** Tryb bez konta – dane w localStorage tej przeglądarki. */
export class LocalStore implements DataStore {
  readonly kind = 'local' as const

  private read(): LocalData {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const data = JSON.parse(raw) as LocalData
        // starsze dane: brak catalogId i profilu
        data.goals.forEach((g) => (g.catalogId ??= g.seedKey === 'ride_pro_sr' ? 'eride-pro-sr' : null))
        data.goals.forEach((g) => (g.photoPosition ??= null))
        data.profile ??= { displayName: null, onboarded: data.goals.length > 0 }
        return data
      }
    } catch {
      /* uszkodzone dane – zaczynamy od nowa */
    }
    // pierwsze uruchomienie: cele wybiera się na ekranie powitalnym
    return { goals: [], deposits: [], profile: { displayName: null, onboarded: false } }
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
    const { goals, deposits } = this.read()
    return { goals, deposits }
  }

  async loadProfile() {
    return this.read().profile ?? { displayName: null, onboarded: false }
  }

  async updateProfile(patch: Partial<Profile>) {
    this.mutate((d) => (d.profile = { ...(d.profile ?? { displayName: null, onboarded: false }), ...patch }))
  }

  async loadCatalog() {
    return BUNDLED_CATALOG
  }

  async createGoal(input: Parameters<DataStore['createGoal']>[0]) {
    const goal: Goal = {
      id: uuid(),
      name: input.name,
      targetAmount: input.targetAmount,
      photoURL: input.photoURL ?? null,
      isDefault: false,
      createdAt: new Date().toISOString(),
      seedKey: input.catalogId === 'eride-pro-sr' ? 'ride_pro_sr' : null,
      catalogId: input.catalogId ?? null,
      photoPosition: input.photoPosition ?? null,
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
      if (!goal) return
      const { isDefault, ...rest } = patch
      Object.assign(goal, rest)
      if (isDefault) d.goals.forEach((g) => (g.isDefault = g.id === id))
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

  async exportData() {
    return { ...this.read(), exportedAt: new Date().toISOString(), mode: 'local' }
  }

  async deleteAccount() {
    localStorage.removeItem(KEY)
  }

  async uploadPhoto(_goalId: string, photo: Blob) {
    return blobToDataURL(photo)
  }

  async resolvePhoto(photoURL: string | null) {
    if (!photoURL) return null
    return resolveAsset(photoURL) ?? photoURL
  }
}
