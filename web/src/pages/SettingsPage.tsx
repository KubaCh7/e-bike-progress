import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { setLanguage, type AppLanguage } from '../i18n'
import type { ThemeMode } from '../state/theme'
import { useAuth } from '../state/AuthContext'
import { useData } from '../state/DataContext'
import { formatMoneyShort, formatNumber, formatPercent, parseAmount } from '../lib/format'
import { Segmented } from '../components/Segmented'
import { ConfirmDialog } from '../components/Modal'
import { GoalPhoto } from '../components/GoalPhoto'
import { ChevronDownIcon, LogoutIcon, PlusIcon, StarIcon } from '../components/Icons'

type Section = 'profile' | 'goals' | 'appearance' | 'account'

/** Ustawienia z zakładkami – przełączanie animowaną szklaną pastylką. */
export function SettingsPage({
  theme,
  onTheme,
  onEditGoal,
  onAddGoal,
}: {
  theme: ThemeMode
  onTheme: (mode: ThemeMode) => void
  onEditGoal: (goalId: string) => void
  onAddGoal: () => void
}) {
  const { t } = useTranslation()
  const [section, setSection] = useState<Section>('profile')

  return (
    <div className="page page--settings">
      <Segmented
        tabs
        block
        className="glass--clear"
        label={t('settings.title')}
        value={section}
        onChange={setSection}
        options={[
          { value: 'profile', label: t('settings.profile') },
          { value: 'goals', label: t('settings.goals') },
          { value: 'appearance', label: t('settings.appearance') },
          { value: 'account', label: t('settings.account') },
        ]}
      />
      <div key={section} className="settings__panel" role="tabpanel">
        {section === 'profile' && <ProfileSection />}
        {section === 'goals' && <GoalsSection onEditGoal={onEditGoal} onAddGoal={onAddGoal} />}
        {section === 'appearance' && <AppearanceSection theme={theme} onTheme={onTheme} />}
        {section === 'account' && <AccountSection />}
      </div>
    </div>
  )
}

function ProfileSection() {
  const { t } = useTranslation()
  const { profile, updateProfile, showToast } = useData()
  const [name, setName] = useState(profile?.displayName ?? '')
  useEffect(() => setName(profile?.displayName ?? ''), [profile?.displayName])
  const changed = name.trim() !== (profile?.displayName ?? '') && name.trim().length > 0

  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!changed) return
        await updateProfile({ displayName: name.trim() })
        showToast(t('settings.saved'))
      }}
    >
      <div className="avatar avatar--big glass--clear r-pill" aria-hidden="true">{(name.trim()[0] ?? '?').toUpperCase()}</div>
      <div className="group glass--clear r-l">
        <label className="row">
          <span className="row__label">{t('profile.name')}</span>
          <input className="row__input" value={name} maxLength={60} placeholder={t('profile.namePlaceholder')} onChange={(e) => setName(e.target.value)} />
        </label>
      </div>
      <button type="submit" className="btn btn--volt btn--block" disabled={!changed}>{t('common.save')}</button>
    </form>
  )
}

function GoalsSection({ onEditGoal, onAddGoal }: { onEditGoal: (id: string) => void; onAddGoal: () => void }) {
  const { t } = useTranslation()
  const { goals, currentGoal, statsFor, updateGoal, showToast } = useData()
  const [target, setTarget] = useState(currentGoal ? formatNumber(currentGoal.targetAmount) : '')
  useEffect(() => setTarget(currentGoal ? formatNumber(currentGoal.targetAmount) : ''), [currentGoal?.id, currentGoal?.targetAmount])
  const parsed = parseAmount(target)
  const canSave = !!currentGoal && parsed !== null && parsed > 0 && parsed !== currentGoal.targetAmount

  return (
    <div className="form">
      <ul className="list glass r-l">
        {goals.map((goal) => (
          <li key={goal.id}>
            <button type="button" className="list__row list__row--goal" onClick={() => onEditGoal(goal.id)}>
              <span className="thumb"><GoalPhoto goal={goal} alt="" /></span>
              <span className="list__main">
                <span className="strong ellipsis">
                  {goal.name} {goal.isDefault && <StarIcon size={12} className="star" />}
                </span>
                <span className="faint small num">
                  {formatPercent(statsFor(goal).progress)} · {formatMoneyShort(goal.targetAmount)}
                </span>
              </span>
              <ChevronDownIcon size={18} className="faint rot-270" />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn glass--clear btn--block" onClick={onAddGoal}>
        <PlusIcon size={18} /> {t('nav.addGoal')}
      </button>

      {currentGoal && (
        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!canSave || parsed === null) return
            await updateGoal(currentGoal.id, { targetAmount: parsed })
            showToast(t('settings.saved'))
          }}
        >
          <div className="group glass--clear r-l">
            <label className="row">
              <span className="row__label">{t('settings.goal')}</span>
              <input className="row__input num" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
              <span className="faint">zł</span>
            </label>
          </div>
          <p className="faint small">{t('settings.targetFor', { name: currentGoal.name })}</p>
          {canSave && <button type="submit" className="btn btn--volt btn--block">{t('common.save')}</button>}
        </form>
      )}
    </div>
  )
}

function AppearanceSection({ theme, onTheme }: { theme: ThemeMode; onTheme: (mode: ThemeMode) => void }) {
  const { t, i18n } = useTranslation()
  return (
    <div className="form">
      <p className="row__label">{t('settings.theme')}</p>
      <Segmented
        block
        className="glass--clear"
        label={t('settings.theme')}
        value={theme}
        onChange={onTheme}
        options={(['system', 'light', 'dark'] as ThemeMode[]).map((m) => ({ value: m, label: t(`settings.theme.${m}`) }))}
      />
      <p className="row__label">{t('settings.language')}</p>
      <Segmented
        block
        className="glass--clear"
        label={t('settings.language')}
        value={(i18n.language === 'en' ? 'en' : 'pl') as AppLanguage}
        onChange={setLanguage}
        options={[
          { value: 'pl', label: 'Polski' },
          { value: 'en', label: 'English' },
        ]}
      />
      <p className="faint small">{t('settings.languageHint')}</p>
    </div>
  )
}

function AccountSection() {
  const { t } = useTranslation()
  const auth = useAuth()
  const { exportData, deleteAccount } = useData()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isLocal = auth.status !== 'signedIn'
  return (
    <div className="form">
      <div className="group glass--clear r-l">
        {auth.status === 'signedIn' ? (
          <div className="row">
            <span className="row__label">{t('auth.email')}</span>
            <span className="faint ellipsis">{auth.email ?? 'Apple ID'}</span>
          </div>
        ) : (
          <div className="row"><span className="faint">{auth.isConfigured ? t('auth.offlineHint') : t('auth.notConfigured')}</span></div>
        )}
        <div className="row">
          <span className="row__label">{t('settings.version')}</span>
          <span className="faint">{__APP_VERSION__}</span>
        </div>
      </div>
      {auth.status === 'signedIn' ? (
        <button type="button" className="btn glass--clear btn--block btn--danger" onClick={() => void auth.signOut()}>
          <LogoutIcon size={18} /> {t('auth.signOut')}
        </button>
      ) : (
        auth.isConfigured && (
          <button type="button" className="btn btn--volt btn--block" onClick={auth.showSignIn}>{t('auth.signIn')}</button>
        )
      )}

      <p className="field__label">{t('account.privacy')}</p>
      <div className="group glass--clear r-l">
        <a className="row row--link" href="#prywatnosc">{t('legal.privacy')}</a>
        <a className="row row--link" href="#regulamin">{t('legal.terms')}</a>
        <a className="row row--link" href="#informacje">{t('legal.notices')}</a>
      </div>
      <button type="button" className="btn glass--clear btn--block" onClick={() => void exportData()}>
        {t('account.export')}
      </button>
      <button type="button" className="btn btn--plain btn--danger btn--block" onClick={() => setConfirmDelete(true)}>
        {isLocal ? t('account.deleteLocal') : t('account.delete')}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
      {confirmDelete && (
        <ConfirmDialog
          title={isLocal ? t('account.deleteLocalConfirm') : t('account.deleteConfirm')}
          confirmLabel={busy ? t('common.loading') : t('account.deleteYes')}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            setBusy(true)
            setError(null)
            try {
              await deleteAccount()
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e))
              setConfirmDelete(false)
            } finally {
              setBusy(false)
            }
          }}
        />
      )}
    </div>
  )
}
