import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../state/DataContext'
import { bikeName, DEFAULT_GOAL, type CatalogBike } from '../lib/types'
import { formatMoneyShort } from '../lib/format'
import { CatalogPicker } from './CatalogPicker'
import { GoalModal } from './GoalModal'
import { LanguagePicker } from './LanguagePicker'
import { LegalFooter } from './Legal'
import { Brand } from './Shell'
import { play } from '../lib/sound'

/**
 * Powitanie: 1 imię → 2 wybór e-bike'ów (najpopularniejsze na górze) albo własny.
 * Pierwszy wybrany model zostaje celem głównym.
 */
export function Onboarding() {
  const { t } = useTranslation()
  const { profile, goals, catalog, createGoal, updateProfile, selectGoal } = useData()
  const [step, setStep] = useState<'name' | 'bikes'>(profile?.displayName ? 'bikes' : 'name')
  const [name, setName] = useState(profile?.displayName ?? '')
  const owned = goals.map((g) => g.catalogId).filter((id): id is string => !!id)
  const [selected, setSelected] = useState<string[]>([])
  const [customOpen, setCustomOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = (bike: CatalogBike) =>
    setSelected((list) => (list.includes(bike.id) ? list.filter((id) => id !== bike.id) : [...list, bike.id]))

  async function saveName(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    try {
      await updateProfile({ displayName: name.trim() })
      setStep('bikes')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function finish() {
    setBusy(true)
    setError(null)
    try {
      const bikes = selected.map((id) => catalog.find((b) => b.id === id)).filter((b): b is CatalogBike => !!b)
      const hasDefault = goals.some((g) => g.isDefault)
      let main: string | null = goals.find((g) => g.isDefault)?.id ?? goals[0]?.id ?? null
      for (const [index, bike] of bikes.entries()) {
        const created = await createGoal({
          name: bikeName(bike),
          targetAmount: bike.price,
          catalogId: bike.id,
          photoURL: bike.id === DEFAULT_GOAL.catalogId ? DEFAULT_GOAL.photoURL : null,
          isDefault: !hasDefault && index === 0,
        })
        if (!hasDefault && index === 0) main = created.id
      }
      if (!bikes.length && !goals.length) {
        // nic nie wybrano – domyślnie e-ride pro SR
        const created = await createGoal({
          name: DEFAULT_GOAL.name,
          targetAmount: DEFAULT_GOAL.targetAmount,
          catalogId: DEFAULT_GOAL.catalogId,
          photoURL: DEFAULT_GOAL.photoURL,
          isDefault: true,
        })
        main = created.id
      }
      if (main) selectGoal(main)
      play('bike')
      await updateProfile({ onboarded: true })
    } catch (err) {
      setError(t('onboarding.saveError', { message: err instanceof Error ? err.message : String(err) }))
    } finally {
      setBusy(false)
    }
  }

  const total = selected.reduce((sum, id) => sum + (catalog.find((b) => b.id === id)?.price ?? 0), 0)
  const displayName = name.trim() || profile?.displayName || ''
  const count = selected.length + goals.length

  if (step === 'name') {
    return (
      <div className="solo">
        <div className="solo-top">
          <Brand />
          <LanguagePicker />
        </div>
        <main className="solo-main">
          <p className="step small">{t('onboarding.step', { step: 1, of: 2 })}</p>
          <h1>{t('onboarding.helloTitle')}</h1>
          <p className="lead">{t('onboarding.helloText')}</p>
          <form className="form" onSubmit={saveName}>
            <div className="field">
              <label htmlFor="ob-name">{t('profile.name')}</label>
              <input id="ob-name" className="input" value={name} maxLength={60} autoFocus autoComplete="given-name" onChange={(e) => setName(e.target.value)} />
            </div>
            {error && <p className="error" role="alert">{error}</p>}
            <button type="submit" className="btn primary block" disabled={!name.trim()}>{t('common.next')}</button>
          </form>
        </main>
        <LegalFooter />
      </div>
    )
  }

  return (
    <div className="solo">
      <div className="solo-top">
        <Brand />
        <LanguagePicker />
      </div>
      <main className="solo-main wide">
        <button type="button" className="link-button small" onClick={() => setStep('name')}>{t('common.back')}</button>
        <p className="step small" style={{ marginTop: 16 }}>{t('onboarding.step', { step: 2, of: 2 })}</p>
        <h1>{displayName ? t('onboarding.bikesTitle', { name: displayName }) : t('onboarding.bikesTitleNoName')}</h1>
        <p className="lead">{t('onboarding.bikesText')}</p>
        <div style={{ margin: '16px 0 20px' }}>
          <button type="button" className="btn outline" onClick={() => setCustomOpen(true)}>{t('catalog.custom')}</button>
        </div>

        <section className="panel">
          <CatalogPicker selected={selected} disabledIds={owned} onToggle={toggle} />
        </section>

        <div className="tray" role="region" aria-live="polite" aria-label={t('onboarding.selectedLabel')}>
          <span>
            {t('onboarding.selected', { count })}
            {total > 0 && <span className="muted num"> · {formatMoneyShort(total)}</span>}
          </span>
          <button type="button" className="btn primary" disabled={busy} onClick={() => void finish()}>
            {busy ? t('common.loading') : t('onboarding.start')}
          </button>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
      </main>
      <LegalFooter />

      {customOpen && <GoalModal preset={null} onClose={() => setCustomOpen(false)} />}
    </div>
  )
}
