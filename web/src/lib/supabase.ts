import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Klient Supabase – null, gdy brak konfiguracji w web/.env (działa wtedy tryb lokalny). */
export const supabase: SupabaseClient | null =
  url && anonKey && !url.includes('twoj-projekt') ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } }) : null

export const isSupabaseConfigured = supabase !== null
