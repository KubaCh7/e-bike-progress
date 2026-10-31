import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../state/DataContext'
import { bikeName, DEFAULT_GOAL, type CatalogBike } from '../lib/types'
import { formatMoneyShort } from '../lib/format'
import { CatalogPicker } from './CatalogPicker'
import { GoalModal } from './GoalModal'
import { ArrowLeftIcon, BikeIcon } from './Icons'

/**
 * Powitanie po założeniu konta / pierwszym uruchomieniu:
 * 1) imię, 2) wybór e-bike'ów z katalogu (e-ride pro SR zaznaczony jako główny) lub własny.
 */
export function Onboarding() {
  const { t } = useTranslation()
  const { profile, goals, catalog, createGoal, updateProfile, selectGoal } = useData()
  const [step, setStep] = useState<'name' | 'bikes'>(profile?.displayName ? 'bikes' : 'name')
  const [name, setName] = useState(profile?.displayName ?? '')
  const owned = goals.map((g) => g.catalogId).filter((id): id is string => !!id)
  const [selected, setSelected] = useState<string[]>(owned.includes(DEFAULT_GOAL.catalogId) ? [] : [DEFAULT_GOAL.catalogId])
  const [customOpen, setCustomOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const toggle = (bike: CatalogBike) =>
    setSelected((list) => (list.includes(bike.id) ? list.filter((id) => id !== bike.id) : [...list, bike.id]))

  async function saveName(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await updateProfile({ displayName: name.trim() })
    setStep('bikes')
  }

  async function finish() {
    setBusy(true)
    try {
      const bikes = selected.map((id) => catalog.find((b) => b.id === id)).filter((b): b is CatalogBike => !!b)
      const hasDefault = goals.some((g) => g.isDefault)
      let main: string | null = goals.find((g) => g.isDefault)?.id ?? null
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
        const created = await createGoal({ name: DEFAULT_GOAL.name, targetAmount: DEFAULT_GOAL.targetAmount, catalogId: DEFAULT_GOAL.catalogId, photoURL: DEFAULT_GOAL.photoURL, isDefault: true })
        main = created.id
      }
      // po powitaniu aplikacja pokazuje cel główny
      if (main) selectGoal(main)
      await updateProfile({ onboarded: true })
    } finally {
      setBusy(false)
    }
  }

  const total = selected.reduce((sum, id) => sum + (catalog.find((b) => b.id === id)?.price ?? 0), 0)

  return (
    <main className="onboarding">
      <div className="steps" aria-hidden="true">
        <span className={step === 'name' ? 'is-active' : ''} />
        <span className={step === 'bikes' ? 'is-active' : ''} />
      </div>

      {step === 'name' ? (
        <form key="name" className="onboarding__card glass r-xl" onSubmit={saveName}>
          <div className="logo"><BikeIcon size={36} /></div>
          <h1 className="title center">{t('onboarding.helloTitle')}</h1>
          <p className="faint center">{t('onboarding.helloText')}</p>
          <input
            className="big-input glass--clear r-l"
            value={name}
            maxLength={60}
            autoFocus
            placeholder={t('profile.namePlaceholder')}
            onChange={(e) => setName(e.target.value)}
            aria-label={t('profile.name')}
          />
          <button type="submit" className="btn btn--prominent btn--lg btn--block" disabled={!name.trim()}>{t('common.next')}</button>
        </form>
      ) : (
        <section key="bikes" className="onboarding__wide">
          <div className="onboarding__head">
            <button type="button" className="btn btn--icon glass--clear" onClick={() => setStep('name')} aria-label={t('common.back')}>
              <ArrowLeftIcon size={18} />
            </button>
            <div>
              <h1 className="title">{t('onboarding.bikesTitle', { name: name.trim() || profile?.displayName || '' })}</h1>
              <p className="faint">{t('onboarding.bikesText')}</p>
            </div>
          </div>

          <CatalogPicker selected={selected} disabledIds={owned} onToggle={toggle} onCustom={() => setCustomOpen(true)} />

          <div className="onboarding__bar glass--clear r-pill">
            <span className="small">
              <strong>{t('onboarding.selected', { count: selected.length + goals.length })}</strong>
              {total > 0 && <span className="faint num"> · {formatMoneyShort(total)}</span>}
            </span>
            <button type="button" className="btn btn--prominent" disabled={busy} onClick={() => void finish()}>
              {busy ? t('common.loading') : t('onboarding.start')}
            </button>
          </div>
        </section>
      )}

      {customOpen && <GoalModal preset={null} onClose={() => setCustomOpen(false)} />}
    </main>
  )
}
