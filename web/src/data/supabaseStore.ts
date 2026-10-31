import type { SupabaseClient } from '@supabase/supabase-js'
import type { DataStore } from './store'
import { resolveAsset } from './store'
import type { Deposit, Goal } from '../lib/types'

const BUCKET = 'goal-photos'

interface GoalRow {
  id: string
  user_id: string
  name: string
  target_amount: number | string
  photo_url: string | null
  is_default: boolean
  seed_key: string | null
  created_at: string
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
  private ensuredDefault = false

  constructor(
    private client: SupabaseClient,
    private userId: string,
  ) {}

  async load() {
    if (!this.ensuredDefault) {
      // cel SR po stronie serwera (idempotentne – na wypadek braku triggera)
      await this.client.rpc('ensure_default_goal')
      this.ensuredDefault = true
    }
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
        .insert({ name: input.name, target_amount: input.targetAmount, photo_url: input.photoURL ?? null, is_default: false })
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
      .subscribe()
    return () => {
      void this.client.removeChannel(channel)
    }
  }
}
