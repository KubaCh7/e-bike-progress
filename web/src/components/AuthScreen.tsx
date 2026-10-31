import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../state/AuthContext'
import { Segmented } from './Segmented'
import { LanguagePicker } from './LanguagePicker'
import { LegalFooter } from './Legal'
import { Brand } from './Shell'

type Mode = 'signIn' | 'signUp'

/** Logowanie / rejestracja (z imieniem) albo praca bez konta. */
export function AuthScreen() {
  const { t } = useTranslation()
  const auth = useAuth()
  const [mode, setMode] = useState<Mode>('signIn')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const isSignUp = mode === 'signUp'
  const canSubmit = email.includes('@') && password.length >= 6 && (!isSignUp || name.trim().length > 0) && !busy

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      if (isSignUp) {
        const needsConfirm = await auth.signUp(email.trim(), password, name.trim())
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
    <div className="solo">
      <div className="solo-top">
        <Brand />
        <LanguagePicker />
      </div>
      <main className="solo-main">
        <h1>{isSignUp ? t('auth.signUpTitle') : t('auth.signInTitle')}</h1>
        <p className="lead">{t('auth.subtitle')}</p>

        <form className="form" onSubmit={submit}>
          <Segmented
            block
            label={t('auth.mode')}
            value={mode}
            onChange={(m) => {
              setMode(m)
              setError(null)
              setInfo(null)
            }}
            options={[
              { value: 'signIn', label: t('auth.signIn') },
              { value: 'signUp', label: t('auth.signUp') },
            ]}
          />

          {isSignUp && (
            <div className="field">
              <label htmlFor="auth-name">{t('profile.name')}</label>
              <input id="auth-name" className="input" autoComplete="given-name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="field">
            <label htmlFor="auth-email">{t('auth.email')}</label>
            <input id="auth-email" className="input" type="email" autoComplete="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="auth-password">{t('auth.passwordShort')}</label>
            <input
              id="auth-password"
              className="input"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="hint">{t('auth.passwordHint')}</span>
          </div>

          {error && <p className="error" role="alert">{error}</p>}
          {info && <p className="notice" role="status">{info}</p>}

          {isSignUp && (
            <p className="small muted">
              {t('auth.consent')} <a href="#regulamin">{t('legal.terms')}</a> {t('auth.consentAnd')} <a href="#prywatnosc">{t('legal.privacyGen')}</a>.
            </p>
          )}
          <button type="submit" className="btn primary block" disabled={!canSubmit}>
            {busy ? t('common.loading') : isSignUp ? t('auth.signUp') : t('auth.signIn')}
          </button>

          <button type="button" className="btn ghost block" onClick={auth.continueLocal}>{t('auth.continueOffline')}</button>
        </form>
      </main>
      <LegalFooter />
    </div>
  )
}
