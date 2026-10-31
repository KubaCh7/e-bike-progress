import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { setLanguage, type AppLanguage } from '../i18n'
import type { ThemeMode } from '../state/theme'
import { useAuth } from '../state/AuthContext'
import { useData } from '../state/DataContext'
import { Segmented } from '../components/Segmented'
import { ConfirmDialog } from '../components/Modal'
import { play, setSoundsEnabled, soundsEnabled } from '../lib/sound'

/** Ustawienia w dwóch kolumnach: opis sekcji po lewej, panel po prawej. */
export function SettingsPage({ theme, onTheme }: { theme: ThemeMode; onTheme: (mode: ThemeMode) => void }) {
  const { t } = useTranslation()
  return (
    <div className="page settings">
      <div className="title-row">
        <h1>{t('view.settings')}</h1>
      </div>
      <ProfileSection />
      <AppearanceSection theme={theme} onTheme={onTheme} />
      <AccountSection />
      <DataSection />
      <DeleteSection />
    </div>
  )
}

function Section({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }) {
  return (
    <section className="settings-section">
      <div className="settings-label">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="settings-panel">{children}</div>
    </section>
  )
}

function ProfileSection() {
  const { t } = useTranslation()
  const { profile, updateProfile, showToast } = useData()
  const [name, setName] = useState(profile?.displayName ?? '')
  useEffect(() => setName(profile?.displayName ?? ''), [profile?.displayName])
  const changed = name.trim() !== (profile?.displayName ?? '') && name.trim().length > 0

  return (
    <Section title={t('settings.profile')} description={t('settings.profileDesc')}>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!changed) return
          await updateProfile({ displayName: name.trim() })
          showToast(t('settings.saved'))
        }}
      >
        <div className="field">
          <label htmlFor="profile-name">{t('profile.name')}</label>
          <input id="profile-name" className="input" value={name} maxLength={60} autoComplete="given-name" onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <button type="submit" className="btn primary" disabled={!changed}>{t('common.save')}</button>
        </div>
      </form>
    </Section>
  )
}

function AppearanceSection({ theme, onTheme }: { theme: ThemeMode; onTheme: (mode: ThemeMode) => void }) {
  const { t, i18n } = useTranslation()
  const [sounds, setSounds] = useState(soundsEnabled)
  return (
    <Section title={t('settings.appearance')} description={t('settings.appearanceDesc')}>
      <div className="field">
        <span className="label">{t('settings.theme')}</span>
        <Segmented
          label={t('settings.theme')}
          value={theme}
          onChange={onTheme}
          options={(['system', 'light', 'dark'] as ThemeMode[]).map((m) => ({ value: m, label: t(`settings.theme.${m}`) }))}
        />
      </div>
      <div className="field">
        <span className="label">{t('settings.language')}</span>
        <Segmented
          label={t('settings.language')}
          value={(i18n.language === 'en' ? 'en' : 'pl') as AppLanguage}
          onChange={setLanguage}
          options={[
            { value: 'pl', label: 'Polski' },
            { value: 'en', label: 'English' },
          ]}
        />
      </div>
      <label className="check-row">
        <span>
          <span style={{ fontWeight: 500 }}>{t('settings.sounds')}</span>
          <span className="small muted" style={{ display: 'block' }}>{t('settings.soundsDesc')}</span>
        </span>
        <input
          type="checkbox"
          className="switch"
          checked={sounds}
          onChange={(e) => {
            setSoundsEnabled(e.target.checked)
            setSounds(e.target.checked)
            if (e.target.checked) play('deposit')
          }}
        />
      </label>
    </Section>
  )
}

function AccountSection() {
  const { t } = useTranslation()
  const auth = useAuth()
  const signedIn = auth.status === 'signedIn'
  return (
    <Section title={t('settings.account')} description={signedIn ? t('settings.accountDesc') : auth.isConfigured ? t('auth.offlineHint') : t('auth.notConfigured')}>
      <div className="rows">
        <div className="row kv">
          <span>{t('auth.email')}</span>
          <span className="ellipsis">{signedIn ? (auth.email ?? 'Apple ID') : t('auth.localShort')}</span>
        </div>
        <div className="row kv">
          <span>{t('settings.version')}</span>
          <span className="num">{__APP_VERSION__}</span>
        </div>
      </div>
      <div>
        {signedIn ? (
          <button type="button" className="btn outline" onClick={() => void auth.signOut()}>{t('auth.signOut')}</button>
        ) : (
          auth.isConfigured && <button type="button" className="btn primary" onClick={auth.showSignIn}>{t('auth.signIn')}</button>
        )}
      </div>
    </Section>
  )
}

function DataSection() {
  const { t } = useTranslation()
  const { exportData } = useData()
  return (
    <Section title={t('account.privacy')} description={t('settings.dataDesc')}>
      <nav className="link-list" aria-label={t('legal.title')}>
        <a href="#prywatnosc">{t('legal.privacy')}</a>
        <a href="#regulamin">{t('legal.terms')}</a>
        <a href="#informacje">{t('legal.notices')}</a>
      </nav>
      <div>
        <button type="button" className="btn outline" onClick={() => void exportData()}>{t('account.export')}</button>
      </div>
    </Section>
  )
}

function DeleteSection() {
  const { t } = useTranslation()
  const auth = useAuth()
  const { deleteAccount } = useData()
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isLocal = auth.status !== 'signedIn'
  return (
    <Section title={isLocal ? t('account.deleteLocal') : t('account.deleteTitle')} description={isLocal ? t('account.deleteLocalDesc') : t('account.deleteDesc')}>
      <div>
        <button type="button" className="btn danger outline-danger" onClick={() => setConfirm(true)}>
          {isLocal ? t('account.deleteLocal') : t('account.delete')}
        </button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {confirm && (
        <ConfirmDialog
          title={isLocal ? t('account.deleteLocalConfirm') : t('account.deleteConfirm')}
          confirmLabel={busy ? t('common.loading') : t('account.deleteYes')}
          onCancel={() => setConfirm(false)}
          onConfirm={async () => {
            setBusy(true)
            setError(null)
            try {
              await deleteAccount()
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e))
              setConfirm(false)
            } finally {
              setBusy(false)
            }
          }}
        />
      )}
    </Section>
  )
}
