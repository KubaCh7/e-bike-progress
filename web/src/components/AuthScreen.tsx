import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../state/AuthContext'
import { Segmented } from './Segmented'
import { BikeIcon } from './Icons'

type Mode = 'signIn' | 'signUp'

/** Logowanie / rejestracja (z imieniem), Sign in with Apple albo praca bez konta. */
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
    <main className="auth">
      <form className="auth__card glass r-xl" onSubmit={submit}>
        <div className="logo"><BikeIcon size={36} /></div>
        <h1 className="title center">{t('app.title')}</h1>
        <p className="faint center">{t('auth.subtitle')}</p>

        <Segmented
          block
          className="glass--clear"
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

        <div className="group glass--clear r-l">
          {isSignUp && (
            <label className="row">
              <span className="row__label">{t('profile.name')}</span>
              <input className="row__input" autoComplete="given-name" maxLength={60} placeholder={t('profile.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
          )}
          <label className="row">
            <span className="row__label">{t('auth.email')}</span>
            <input className="row__input" type="email" autoComplete="email" placeholder="ty@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="row">
            <span className="row__label">{t('auth.passwordShort')}</span>
            <input
              className="row__input"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              placeholder={t('auth.passwordHint')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        </div>

        {error && <p className="error small center" role="alert">{error}</p>}
        {info && <p className="positive small center" role="status">{info}</p>}

        <button type="submit" className="btn btn--prominent btn--lg btn--block" disabled={!canSubmit}>
          {busy ? t('common.loading') : isSignUp ? t('auth.signUp') : t('auth.signIn')}
        </button>

        <div className="divider small faint">{t('auth.or')}</div>

        <button type="button" className="btn btn--apple btn--block" onClick={() => auth.signInWithApple().catch((e: Error) => setError(e.message))}>
          {t('auth.apple')}
        </button>
        <button type="button" className="btn btn--plain btn--block faint" onClick={auth.continueLocal}>{t('auth.continueOffline')}</button>
      </form>
    </main>
  )
}
