import type { SupabaseClient } from '@supabase/supabase-js'
import type { DataStore } from './store'
import { BUNDLED_CATALOG, resolveAsset } from './store'
import type { CatalogBike, Deposit, Goal, Profile } from '../lib/types'

const BUCKET = 'goal-photos'

interface GoalRow {
  id: string
  user_id: string
  name: string
  target_amount: number | string
  photo_url: string | null
  is_default: boolean
  seed_key: string | null
  catalog_id: string | null
  created_at: string
}

interface CatalogRow {
  id: string
  brand: string
  model: string
  category: CatalogBike['category']
  price: number | string
  color: string
  featured: boolean
}

interface DepositRow {
  id: string
  goal_id: string
  amount: number | string
  deposit_date: string
  note: string | null
  created_at: string
}

const toGoal = (r: GoalRow): Goal => ({
  id: r.id,
  name: r.name,
  targetAmount: Number(r.target_amount),
  photoURL: r.photo_url,
  isDefault: r.is_default,
  createdAt: r.created_at,
  seedKey: r.seed_key,
  catalogId: r.catalog_id ?? (r.seed_key === 'ride_pro_sr' ? 'eride-pro-sr' : null),
})

const toDeposit = (r: DepositRow): Deposit => ({
  id: r.id,
  goalId: r.goal_id,
  amount: Number(r.amount),
  date: r.deposit_date,
  note: r.note,
  createdAt: r.created_at,
})

function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message)
  return result.data
}

/** Dane w Supabase (wspólne z iPhonem). Usuwanie jest "miękkie" (deleted_at). */
export class SupabaseStore implements DataStore {
  readonly kind = 'supabase' as const
  private signedUrls = new Map<string, { url: string; expires: number }>()

  constructor(
    private client: SupabaseClient,
    private userId: string,
  ) {}

  async loadProfile(): Promise<Profile> {
    const { data, error } = await this.client.from('profiles').select('display_name, onboarded').eq('id', this.userId).maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) {
      // konto sprzed migracji profili – profil tworzymy przy pierwszym zapisie
      return { displayName: null, onboarded: false }
    }
    return { displayName: data.display_name, onboarded: data.onboarded }
  }

  async updateProfile(patch: Partial<Profile>) {
    const row: Record<string, unknown> = { id: this.userId }
    if (patch.displayName !== undefined) row.display_name = patch.displayName
    if (patch.onboarded !== undefined) row.onboarded = patch.onboarded
    check(await this.client.from('profiles').upsert(row))
    // imię także w metadanych konta (widoczne w panelu Supabase)
    if (patch.displayName !== undefined) await this.client.auth.updateUser({ data: { display_name: patch.displayName } })
  }

  async loadCatalog(): Promise<CatalogBike[]> {
    const { data, error } = await this.client.from('bike_catalog').select('id, brand, model, category, price, color, featured').order('sort')
    if (error || !data?.length) return BUNDLED_CATALOG
    return (data as CatalogRow[]).map((r) => ({ ...r, price: Number(r.price) }))
  }

  async load() {
    const [goals, deposits] = await Promise.all([
      this.client.from('goals').select('*').is('deleted_at', null).order('created_at'),
      this.client.from('deposits').select('*').is('deleted_at', null).order('deposit_date', { ascending: false }),
    ])
    return {
      goals: (check(goals) as GoalRow[]).map(toGoal),
      deposits: (check(deposits) as DepositRow[]).map(toDeposit),
    }
  }

  async createGoal(input: Parameters<DataStore['createGoal']>[0]) {
    const row = check(
      await this.client
        .from('goals')
        .insert({
          name: input.name,
          target_amount: input.targetAmount,
          photo_url: input.photoURL ?? null,
          is_default: false,
          catalog_id: input.catalogId ?? null,
          seed_key: input.catalogId === 'eride-pro-sr' ? 'ride_pro_sr' : null,
        })
        .select()
        .single(),
    ) as GoalRow
    if (input.isDefault) await this.setDefaultGoal(row.id)
    return toGoal(row)
  }

  async updateGoal(id: string, patch: Parameters<DataStore['updateGoal']>[1]) {
    const update: Record<string, unknown> = {}
    if (patch.name !== undefined) update.name = patch.name
    if (patch.targetAmount !== undefined) update.target_amount = patch.targetAmount
    if (patch.photoURL !== undefined) update.photo_url = patch.photoURL
    if (patch.catalogId !== undefined) update.catalog_id = patch.catalogId
    if (Object.keys(update).length) check(await this.client.from('goals').update(update).eq('id', id))
    if (patch.isDefault) await this.setDefaultGoal(id)
  }

  async deleteGoal(id: string) {
    const { data } = await this.client.from('goals').select('is_default').eq('id', id).single()
    check(await this.client.from('goals').update({ deleted_at: new Date().toISOString(), is_default: false }).eq('id', id))
    if ((data as { is_default?: boolean } | null)?.is_default) {
      const next = await this.client.from('goals').select('id').is('deleted_at', null).order('created_at').limit(1)
      const nextId = (check(next) as { id: string }[])[0]?.id
      if (nextId) await this.setDefaultGoal(nextId)
    }
  }

  async setDefaultGoal(id: string) {
    check(await this.client.rpc('set_default_goal', { p_goal_id: id }))
  }

  async addDeposit(input: Parameters<DataStore['addDeposit']>[0]) {
    const row = check(
      await this.client
        .from('deposits')
        .insert({ goal_id: input.goalId, amount: input.amount, deposit_date: input.date, note: input.note })
        .select()
        .single(),
    ) as DepositRow
    return toDeposit(row)
  }

  async updateDeposit(id: string, patch: Parameters<DataStore['updateDeposit']>[1]) {
    const update: Record<string, unknown> = {}
    if (patch.amount !== undefined) update.amount = patch.amount
    if (patch.date !== undefined) update.deposit_date = patch.date
    if (patch.note !== undefined) update.note = patch.note
    if (patch.goalId !== undefined) update.goal_id = patch.goalId
    check(await this.client.from('deposits').update(update).eq('id', id))
  }

  async deleteDeposit(id: string) {
    check(await this.client.from('deposits').update({ deleted_at: new Date().toISOString() }).eq('id', id))
  }

  async uploadPhoto(goalId: string, photo: Blob) {
    // ta sama ścieżka co na iPhonie: <user_id>/<goal_id>.jpg
    const path = `${this.userId}/${goalId}.jpg`
    const { error } = await this.client.storage.from(BUCKET).upload(path, photo, { contentType: 'image/jpeg', upsert: true, cacheControl: '3600' })
    if (error) throw new Error(error.message)
    this.signedUrls.delete(path)
    return path
  }

  async resolvePhoto(photoURL: string | null) {
    if (!photoURL) return null
    const asset = resolveAsset(photoURL)
    if (asset) return asset
    const cached = this.signedUrls.get(photoURL)
    if (cached && cached.expires > Date.now()) return cached.url
    const { data, error } = await this.client.storage.from(BUCKET).createSignedUrl(photoURL, 3600)
    if (error || !data) return null
    this.signedUrls.set(photoURL, { url: data.signedUrl, expires: Date.now() + 50 * 60_000 })
    return data.signedUrl
  }

  subscribe(onChange: () => void) {
    // Realtime: zmiany z iPhone'a pojawiają się od razu (wymaga migracji 0005)
    const channel = this.client
      .channel('ebike-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, onChange)
      .subscribe()
    return () => {
      void this.client.removeChannel(channel)
    }
  }
}
