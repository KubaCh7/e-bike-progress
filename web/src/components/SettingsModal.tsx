import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { setLanguage, type AppLanguage } from '../i18n'
import type { ThemeMode } from '../state/theme'
import { useAuth } from '../state/AuthContext'
import { useData } from '../state/DataContext'
import { formatMoneyShort, formatNumber, formatPercent, parseAmount } from '../lib/format'
import { Modal } from './Modal'
import { GoalPhoto } from './GoalPhoto'
import { EditIcon, LogoutIcon, StarIcon } from './Icons'

/** Ustawienia: język, motyw, zarządzanie celami, kwota celu, konto. */
export function SettingsModal({
  theme,
  onTheme,
  onClose,
  onEditGoal,
}: {
  theme: ThemeMode
  onTheme: (mode: ThemeMode) => void
  onClose: () => void
  onEditGoal: (goalId: string) => void
}) {
  const { t, i18n } = useTranslation()
  const auth = useAuth()
  const { currentGoal, goals, updateGoal, setDefaultGoal, statsFor, showToast } = useData()
  const [target, setTarget] = useState(currentGoal ? formatNumber(currentGoal.targetAmount) : '')
  const parsed = parseAmount(target)
  const canSave = !!currentGoal && parsed !== null && parsed > 0 && parsed !== currentGoal.targetAmount

  return (
    <Modal title={t('settings.title')} onClose={onClose}>
      <div className="field">
        <span className="field__label">{t('settings.language')}</span>
        <div className="segmented glass glass--pill" role="group" aria-label={t('settings.language')}>
          {(['pl', 'en'] as AppLanguage[]).map((lang) => (
            <button key={lang} type="button" aria-pressed={i18n.language === lang} onClick={() => setLanguage(lang)}>
              {lang === 'pl' ? 'Polski' : 'English'}
            </button>
          ))}
        </div>
        <span className="field__hint">{t('settings.languageHint')}</span>
      </div>

      <div className="field">
        <span className="field__label">{t('settings.theme')}</span>
        <div className="segmented glass glass--pill" role="group" aria-label={t('settings.theme')}>
          {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
            <button key={mode} type="button" aria-pressed={theme === mode} onClick={() => onTheme(mode)}>
              {t(`settings.theme.${mode}`)}
            </button>
          ))}
        </div>
      </div>

      {currentGoal && (
        <form
          className="field"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!canSave || parsed === null) return
            await updateGoal(currentGoal.id, { targetAmount: parsed })
            setTarget(formatNumber(parsed))
            showToast(t('settings.saved'))
          }}
        >
          <span className="field__label">{t('settings.goal')}</span>
          <span style={{ display: 'flex', gap: 8 }}>
            <span className="input-wrap" style={{ flex: 1 }}>
              <input className="input num" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
              <span className="input-wrap__suffix">zł</span>
            </span>
            <button type="submit" className="btn btn--primary" disabled={!canSave}>{t('common.save')}</button>
          </span>
          <span className="field__hint">{t('settings.targetFor', { name: currentGoal.name })}</span>
        </form>
      )}

      <div className="field">
        <span className="field__label">{t('settings.manageGoals')}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {goals.map((goal) => (
            <div key={goal.id} className="goal-item" style={{ cursor: 'default', gridTemplateColumns: '44px minmax(0,1fr) auto' }}>
              <div className="goal-item__photo" style={{ width: 44, height: 44 }}><GoalPhoto photoURL={goal.photoURL} alt="" /></div>
              <div style={{ minWidth: 0 }}>
                <div className="goal-item__name"><span>{goal.name}</span>{goal.isDefault && <StarIcon size={14} className="star" />}</div>
                <div className="goal-item__meta num">{formatPercent(statsFor(goal).progress)} · {formatMoneyShort(goal.targetAmount)}</div>
              </div>
              <span style={{ display: 'flex', gap: 4 }}>
                {!goal.isDefault && (
                  <button type="button" className="btn btn--icon btn--sm" onClick={() => void setDefaultGoal(goal.id)} aria-label={t('goals.setDefault')} title={t('goals.setDefault')}>
                    <StarIcon size={16} />
                  </button>
                )}
                <button type="button" className="btn btn--icon btn--sm" onClick={() => onEditGoal(goal.id)} aria-label={t('common.edit')} title={t('common.edit')}>
                  <EditIcon size={16} />
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field__label">{t('settings.account')}</span>
        {!auth.isConfigured ? (
          <span className="field__hint">{t('auth.notConfigured')}</span>
        ) : auth.status === 'signedIn' ? (
          <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="muted">{t('auth.signedInAs', { email: auth.email ?? 'Apple ID' })}</span>
            <button type="button" className="btn btn--sm" onClick={() => void auth.signOut()}>
              <LogoutIcon size={16} /> {t('auth.signOut')}
            </button>
          </span>
        ) : (
          <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="field__hint">{t('auth.offlineHint')}</span>
            <button type="button" className="btn btn--sm btn--primary" onClick={auth.showSignIn}>{t('auth.signIn')}</button>
          </span>
        )}
      </div>
    </Modal>
  )
}
