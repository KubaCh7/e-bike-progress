import type { CatalogBike, Deposit, DepositInput, Goal, GoalInput, Profile } from '../lib/types'
import bundled from './bikes.json'

/** Wspólny interfejs danych: Supabase (konto) albo localStorage (bez konta). */
export interface DataStore {
  readonly kind: 'supabase' | 'local'
  load(): Promise<{ goals: Goal[]; deposits: Deposit[] }>
  loadProfile(): Promise<Profile>
  updateProfile(patch: Partial<Profile>): Promise<void>
  /** Katalog e-bike'ów – z serwera (aktualizowany bez nowej wersji aplikacji) lub wbudowany. */
  loadCatalog(): Promise<CatalogBike[]>
  createGoal(input: GoalInput): Promise<Goal>
  updateGoal(id: string, patch: Partial<GoalInput>): Promise<void>
  deleteGoal(id: string): Promise<void>
  setDefaultGoal(id: string): Promise<void>
  addDeposit(input: DepositInput): Promise<Deposit>
  updateDeposit(id: string, patch: Partial<DepositInput>): Promise<void>
  deleteDeposit(id: string): Promise<void>
  /** Wgrywa skompresowane zdjęcie i zwraca wartość do pola photoURL. */
  uploadPhoto(goalId: string, photo: Blob): Promise<string>
  /** Zamienia photoURL na adres do <img> (null = brak zdjęcia). */
  resolvePhoto(photoURL: string | null): Promise<string | null>
  /** Nasłuch zmian z innych urządzeń (iPhone). Zwraca funkcję wyrejestrowania. */
  subscribe?(onChange: () => void): () => void
}

/** Katalog wbudowany w aplikację (catalog/bikes.json) – działa offline i bez Supabase. */
export const BUNDLED_CATALOG = bundled.bikes as CatalogBike[]

/** Adres sugerowanego zdjęcia e-ride pro SR (plik w web/public). */
export const SUGGESTED_PHOTO_SRC = `${import.meta.env.BASE_URL}ride_pro_sr_placeholder.svg`

export function resolveAsset(photoURL: string): string | null {
  return photoURL.startsWith('asset:') ? SUGGESTED_PHOTO_SRC : null
}
