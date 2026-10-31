import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../state/AuthContext'
import { BikeIcon } from './Icons'

/** Logowanie: e-mail + hasło, Sign in with Apple albo praca bez konta. */
export function AuthScreen() {
  const { t } = useTranslation()
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const canSubmit = email.includes('@') && password.length >= 6 && !busy

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      if (isSignUp) {
        const needsConfirm = await auth.signUp(email.trim(), password)
        if (needsConfirm) setInfo(t('auth.checkEmail'))
      } else {
        await auth.signIn(email.trim(), password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth">
      <form className="auth__card glass glass--strong" onSubmit={submit}>
        <div className="auth__logo"><BikeIcon size={40} /></div>
        <h1>{t('app.title')}</h1>
        <p className="muted" style={{ textAlign: 'center' }}>{t('auth.subtitle')}</p>

        <label className="field">
          <span className="field__label">{t('auth.email')}</span>
          <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">{t('auth.password')}</span>
          <input className="input" type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error && <p className="field__error" role="alert">{error}</p>}
        {info && <p className="muted" role="status">{info}</p>}

        <button type="submit" className="btn btn--primary btn--block" disabled={!canSubmit}>
          {busy ? t('common.loading') : isSignUp ? t('auth.signUp') : t('auth.signIn')}
        </button>
        <button type="button" className="link" onClick={() => setIsSignUp((v) => !v)}>
          {isSignUp ? t('auth.haveAccount') : t('auth.noAccount')}
        </button>

        <div className="auth__divider">{t('auth.or')}</div>

        <button type="button" className="btn btn--apple btn--block" onClick={() => auth.signInWithApple().catch((e: Error) => setError(e.message))}>
          {t('auth.apple')}
        </button>
        <button type="button" className="btn btn--block" onClick={auth.continueLocal}>{t('auth.continueOffline')}</button>
        <p className="faint" style={{ fontSize: '0.8rem', textAlign: 'center' }}>{t('auth.offlineHint')}</p>
      </form>
    </main>
  )
}
