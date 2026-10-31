import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../state/DataContext'
import { bikeName, DEFAULT_GOAL, type CatalogBike } from '../lib/types'
import { formatMoneyShort } from '../lib/format'
import { CatalogPicker } from './CatalogPicker'
import { GoalModal } from './GoalModal'
import { LanguagePicker } from './LanguagePicker'
import { LegalFooter } from './Legal'
import { ArrowLeftIcon, ArrowRightIcon, BoltIcon, PlusIcon } from './Icons'

/**
 * Powitanie: 01 imię → 02 wybór e-bike'ów (najpopularniejsze na górze) albo własny.
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
      await updateProfile({ onboarded: true })
    } catch (err) {
      // wcześniej błąd był połykany i przycisk "nic nie robił"
      setError(t('onboarding.saveError', { message: err instanceof Error ? err.message : String(err) }))
    } finally {
      setBusy(false)
    }
  }

  const total = selected.reduce((sum, id) => sum + (catalog.find((b) => b.id === id)?.price ?? 0), 0)
  const displayName = name.trim() || profile?.displayName || ''

  if (step === 'name') {
    return (
      <main className="onboarding onboarding--name">
        <LanguagePicker />
        <form key="name" className="hello" onSubmit={saveName}>
          <span className="step display">01 / 02</span>
          <h1 className="headline display">{t('onboarding.helloTitle')}</h1>
          <p className="lead">{t('onboarding.helloText')}</p>
          <input
            className="name-input display"
            value={name}
            maxLength={60}
            autoFocus
            placeholder={t('profile.namePlaceholder')}
            onChange={(e) => setName(e.target.value)}
            aria-label={t('profile.name')}
          />
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" className="btn btn--volt btn--lg" disabled={!name.trim()}>
            {t('common.next')} <ArrowRightIcon size={20} />
          </button>
        </form>
        <LegalFooter />
      </main>
    )
  }

  return (
    <main className="onboarding">
      <header className="onboarding__head">
        <button type="button" className="btn btn--icon glass--clear" onClick={() => setStep('name')} aria-label={t('common.back')}>
          <ArrowLeftIcon size={18} />
        </button>
        <span className="step display">02 / 02</span>
      </header>

      <div className="onboarding__hero">
        <h1 className="headline display">
          {displayName ? t('onboarding.bikesTitle', { name: displayName }) : t('onboarding.bikesTitleNoName')}
        </h1>
        <p className="lead">{t('onboarding.bikesText')}</p>
        <button type="button" className="btn glass--clear custom-btn" onClick={() => setCustomOpen(true)}>
          <PlusIcon size={18} /> {t('catalog.custom')}
        </button>
      </div>

      <CatalogPicker selected={selected} disabledIds={owned} onToggle={toggle} />

      <div className="tray glass r-pill" role="region" aria-live="polite">
        <div className="tray__info">
          <span className="tray__count display">{selected.length + goals.length}</span>
          <span className="tray__text">
            {t('onboarding.selectedLabel')}
            {total > 0 && <span className="num"> · {formatMoneyShort(total)}</span>}
          </span>
        </div>
        <button type="button" className="btn btn--volt" disabled={busy} onClick={() => void finish()}>
          {busy ? t('common.loading') : t('onboarding.start')} {!busy && <BoltIcon size={16} />}
        </button>
      </div>
      {error && <p className="tray-error glass r-l" role="alert">{error}</p>}

      {customOpen && <GoalModal preset={null} onClose={() => setCustomOpen(false)} />}
    </main>
  )
}
