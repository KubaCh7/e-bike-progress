/** Cel oszczędzania – konkretny e-bike. */
export interface Goal {
  id: string
  name: string
  targetAmount: number
  /** Ścieżka w Storage, data URL (tryb lokalny) albo "asset:ride_pro_sr_placeholder". */
  photoURL: string | null
  isDefault: boolean
  createdAt: string
  seedKey: string | null
}

/** Pojedyncza wpłata. */
export interface Deposit {
  id: string
  goalId: string
  amount: number
  /** Dzień wpłaty "yyyy-mm-dd". */
  date: string
  note: string | null
  createdAt: string
}

export interface GoalInput {
  name: string
  targetAmount: number
  photoURL?: string | null
  isDefault?: boolean
}

export interface DepositInput {
  goalId: string
  amount: number
  date: string
  note: string | null
}

export const DEFAULT_GOAL = {
  name: 'e-ride pro SR',
  targetAmount: 30000,
  seedKey: 'ride_pro_sr',
  photoURL: 'asset:ride_pro_sr_placeholder',
} as const

export const SUGGESTED_PHOTO_URL = DEFAULT_GOAL.photoURL
