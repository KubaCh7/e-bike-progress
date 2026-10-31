import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { bikeName, DEFAULT_GOAL, SUGGESTED_PHOTO_URL, type CatalogBike, type Goal } from '../lib/types'
import { formatNumber, parseAmount } from '../lib/format'
import { useData } from '../state/DataContext'
import { Modal, ConfirmDialog } from './Modal'
import { PhotoPicker, type PhotoChoice } from './PhotoPicker'
import { CatalogPicker } from './CatalogPicker'
import { StarIcon, TrashIcon } from './Icons'

/**
 * Dodawanie e-bike'a: najpierw katalog popularnych modeli (lub "Własny"),
 * potem formularz z nazwą, ceną i zdjęciem.
 */
export function AddGoalModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { goals } = useData()
  const [preset, setPreset] = useState<CatalogBike | null | undefined>(undefined)

  if (preset !== undefined) return <GoalModal preset={preset} onClose={onClose} onBack={() => setPreset(undefined)} />

  const owned = goals.map((g) => g.catalogId).filter((id): id is string => !!id)
  return (
    <Modal title={t('nav.addGoal')} onClose={onClose} wide>
      <CatalogPicker selected={[]} disabledIds={owned} onToggle={(bike) => setPreset(bike)} onCustom={() => setPreset(null)} />
    </Modal>
  )
}

/** Formularz celu: nowy (z katalogu lub własny) albo edycja istniejącego (nazwa, cena, zdjęcie). */
export function GoalModal({
  goal,
  preset = null,
  onClose,
  onBack,
}: {
  goal?: Goal
  preset?: CatalogBike | null
  onClose: () => void
  onBack?: () => void
}) {
  const { t } = useTranslation()
  const { createGoal, updateGoal, deleteGoal, setDefaultGoal, showToast, goals } = useData()
  const [name, setName] = useState(goal?.name ?? (preset ? bikeName(preset) : ''))
  const [priceText, setPriceText] = useState(goal ? formatNumber(goal.targetAmount) : preset ? formatNumber(preset.price) : '')
  const [makeDefault, setMakeDefault] = useState(goal?.isDefault ?? goals.length === 0)
  const [photo, setPhoto] = useState<PhotoChoice>(
    !goal && preset?.id === DEFAULT_GOAL.catalogId ? { kind: 'suggested' } : { kind: 'keep' },
  )
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const catalogId = goal?.catalogId ?? preset?.id ?? null
  const price = parseAmount(priceText)
  const trimmed = name.trim()
  const valid = trimmed.length > 0 && trimmed.length <= 120 && price !== null && price > 0
  const showSuggested = catalogId === DEFAULT_GOAL.catalogId || /pro\s*sr/i.test(trimmed)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid || price === null) return
    setBusy(true)
    try {
      const photoURL = photo.kind === 'suggested' ? SUGGESTED_PHOTO_URL : photo.kind === 'remove' ? null : undefined
      const blob = photo.kind === 'file' ? photo.blob : null
      if (goal) {
        await updateGoal(
          goal.id,
          {
            name: trimmed,
            targetAmount: price,
            ...(photoURL !== undefined && { photoURL }),
            ...(makeDefault && !goal.isDefault && { isDefault: true }),
          },
          blob,
        )
      } else {
        await createGoal({ name: trimmed, targetAmount: price, photoURL: photoURL ?? null, isDefault: makeDefault, catalogId }, blob)
      }
      showToast(t('goals.saved'))
      onClose()
    } finally {
      setBusy(false)
    }
  }

  if (confirmDelete && goal) {
    return (
      <ConfirmDialog
        title={t('goals.confirmDelete', { name: goal.name })}
        confirmLabel={t('goals.delete')}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteGoal(goal.id)
          onClose()
        }}
      />
    )
  }

  return (
    <Modal title={goal ? t('goals.edit') : t('goals.new')} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <PhotoPicker
          catalogId={catalogId}
          currentPhotoURL={goal?.photoURL ?? null}
          suggestedURL={SUGGESTED_PHOTO_URL}
          showSuggested={showSuggested}
          choice={photo}
          onChange={setPhoto}
        />

        <div className="group glass--clear r-l">
          <label className="row">
            <span className="row__label">{t('goals.name')}</span>
            <input className="row__input" value={name} maxLength={120} placeholder={t('goals.namePlaceholder')} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="row">
            <span className="row__label">{t('goals.price')}</span>
            <input className="row__input num" inputMode="decimal" placeholder="30 000,00" value={priceText} onChange={(e) => setPriceText(e.target.value)} />
            <span className="faint">zł</span>
          </label>
          {!goal?.isDefault && (
            <label className="row">
              <span className="row__label"><StarIcon size={14} className="star" /> {t('goals.makeDefault')}</span>
              <input type="checkbox" className="switch" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} />
            </label>
          )}
        </div>
        {priceText !== '' && (price === null || price <= 0) && <p className="error small">{t('goals.invalidPrice')}</p>}
        {preset && <p className="faint small">{t('catalog.priceNote')}</p>}

        <div className="form__actions">
          {onBack && !goal && (
            <button type="button" className="btn glass--clear" onClick={onBack}>{t('common.back')}</button>
          )}
          {goal && (
            <button type="button" className="btn btn--plain btn--danger" onClick={() => setConfirmDelete(true)}>
              <TrashIcon size={16} /> {t('goals.delete')}
            </button>
          )}
          {goal && !goal.isDefault && (
            <button type="button" className="btn btn--plain" onClick={() => void setDefaultGoal(goal.id).then(onClose)}>
              <StarIcon size={16} className="star" /> {t('goals.setDefault')}
            </button>
          )}
          <span className="spacer" />
          <button type="submit" className="btn btn--prominent" disabled={!valid || busy}>{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  )
}
