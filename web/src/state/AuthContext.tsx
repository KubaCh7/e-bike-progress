import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'

type Status = 'loading' | 'signedOut' | 'signedIn' | 'local'

interface AuthValue {
  status: Status
  userId: string | null
  email: string | null
  isConfigured: boolean
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string, displayName: string): Promise<boolean>
  signInWithApple(): Promise<void>
  signOut(): Promise<void>
  continueLocal(): void
  showSignIn(): void
}

const AuthContext = createContext<AuthValue | null>(null)
const LOCAL_KEY = 'offlineMode'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [localMode, setLocalMode] = useState(() => !supabase || localStorage.getItem(LOCAL_KEY) === '1')
  const [session, setSession] = useState<{ userId: string; email: string | null } | null | undefined>(supabase ? undefined : null)

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ? { userId: data.session.user.id, email: data.session.user.email ?? null } : null)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ? { userId: s.user.id, email: s.user.email ?? null } : null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const setLocal = useCallback((value: boolean) => {
    setLocalMode(value)
    localStorage.setItem(LOCAL_KEY, value ? '1' : '0')
  }, [])

  const value = useMemo<AuthValue>(() => {
    let status: Status
    if (session) status = 'signedIn'
    else if (localMode) status = 'local'
    else if (session === undefined) status = 'loading'
    else status = 'signedOut'

    return {
      status,
      userId: session?.userId ?? null,
      email: session?.email ?? null,
      isConfigured: !!supabase,
      async signIn(email, password) {
        if (!supabase) return
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setLocal(false)
      },
      async signUp(email, password, displayName) {
        if (!supabase) return false
        // imię trafia do metadanych konta, a trigger zapisuje je w tabeli profiles
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL, data: { display_name: displayName } },
        })
        if (error) throw error
        if (data.session) setLocal(false)
        return !data.session // true = trzeba potwierdzić e-mail
      },
      async signInWithApple() {
        if (!supabase) return
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: window.location.href } })
        if (error) throw error
      },
      async signOut() {
        await supabase?.auth.signOut()
        setLocal(false)
      },
      continueLocal: () => setLocal(true),
      showSignIn: () => setLocal(false),
    }
  }, [session, localMode, setLocal])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth poza AuthProvider')
  return ctx
}
