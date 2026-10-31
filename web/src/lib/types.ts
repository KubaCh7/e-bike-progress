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
  /** Model z katalogu, z którego powstał cel (null = własny e-bike). */
  catalogId: string | null
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
  catalogId?: string | null
}

export interface DepositInput {
  goalId: string
  amount: number
  date: string
  note: string | null
}

/** Profil użytkownika: imię i informacja o przejściu powitania. */
export interface Profile {
  displayName: string | null
  onboarded: boolean
}

export type BikeCategory = 'moto' | 'emtb' | 'city'

/** Model z katalogu popularnych e-bike'ów. */
export interface CatalogBike {
  id: string
  brand: string
  model: string
  category: BikeCategory
  /** Orientacyjna cena w PLN. */
  price: number
  color: string
  featured?: boolean
  /** Zdjęcie na wolnej licencji (Wikimedia Commons) – opcjonalne. */
  image_url?: string | null
  /** Autor / źródło zdjęcia (wymagane przez licencję). */
  image_credit?: string | null
  /** Strona pliku z licencją. */
  image_source?: string | null
  /** Ranking popularności (1 = najpopularniejszy). */
  popularity?: number
}

export const DEFAULT_GOAL = {
  name: 'e-ride pro SR',
  targetAmount: 30000,
  seedKey: 'ride_pro_sr',
  catalogId: 'eride-pro-sr',
  photoURL: 'asset:ride_pro_sr_placeholder',
} as const

export const SUGGESTED_PHOTO_URL = DEFAULT_GOAL.photoURL

export const bikeName = (bike: CatalogBike) => `${bike.brand} ${bike.model}`
