import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { bikeName, DEFAULT_GOAL, SUGGESTED_PHOTO_URL, type CatalogBike, type Goal } from '../lib/types'
import { formatNumber, parseAmount } from '../lib/format'
import { useData } from '../state/DataContext'
import { play } from '../lib/sound'
import { Modal, ConfirmDialog } from './Modal'
import { PhotoPicker, type PhotoChoice } from './PhotoPicker'
import { CatalogPicker } from './CatalogPicker'

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
      <div className="form-actions" style={{ marginBottom: 16 }}>
        <button type="button" className="btn outline" onClick={() => setPreset(null)}>{t('catalog.custom')}</button>
        <span className="small muted">{t('catalog.customHint')}</span>
      </div>
      <CatalogPicker multi={false} selected={[]} disabledIds={owned} onToggle={(bike) => setPreset(bike)} />
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
  const { createGoal, updateGoal, deleteGoal, showToast, goals } = useData()
  const [name, setName] = useState(goal?.name ?? (preset ? bikeName(preset) : ''))
  const [priceText, setPriceText] = useState(goal ? formatNumber(goal.targetAmount) : preset ? formatNumber(preset.price) : '')
  const [makeDefault, setMakeDefault] = useState(goal?.isDefault ?? goals.length === 0)
  const [photo, setPhoto] = useState<PhotoChoice>(
    !goal && preset?.id === DEFAULT_GOAL.catalogId ? { kind: 'suggested' } : { kind: 'keep' },
  )
  const [position, setPosition] = useState<string | null>(goal?.photoPosition ?? null)
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
      const photoURL =
        photo.kind === 'suggested' ? SUGGESTED_PHOTO_URL : photo.kind === 'url' ? photo.url : photo.kind === 'remove' ? null : undefined
      const blob = photo.kind === 'file' ? photo.blob : null
      if (goal) {
        await updateGoal(
          goal.id,
          {
            name: trimmed,
            targetAmount: price,
            ...(photoURL !== undefined && { photoURL }),
            photoPosition: position,
            ...(makeDefault && !goal.isDefault && { isDefault: true }),
          },
          blob,
        )
      } else {
        await createGoal({ name: trimmed, targetAmount: price, photoURL: photoURL ?? null, isDefault: makeDefault, catalogId, photoPosition: position }, blob)
        play('bike')
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
          play('remove')
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
          position={position}
          onPositionChange={setPosition}
        />

        <div className="field">
          <label htmlFor="goal-name">{t('goals.name')}</label>
          <input id="goal-name" className="input" value={name} maxLength={120} placeholder={t('goals.namePlaceholder')} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="goal-price">{t('goals.price')}</label>
          <div className="input-affix">
            <input id="goal-price" className="input num" inputMode="decimal" placeholder="30 000,00" value={priceText} onChange={(e) => setPriceText(e.target.value)} />
            <span className="affix">zł</span>
          </div>
          {priceText !== '' && (price === null || price <= 0) && <span className="hint error">{t('goals.invalidPrice')}</span>}
          {preset && <span className="hint">{t('catalog.priceNote')}</span>}
        </div>
        {!goal?.isDefault && (
          <label className="check-row">
            <span>
              <span style={{ fontWeight: 500 }}>{t('goals.makeDefault')}</span>
              <span className="hint small muted" style={{ display: 'block' }}>{t('bikes.mainHint')}</span>
            </span>
            <input type="checkbox" className="switch" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} />
          </label>
        )}

        <div className="form-actions">
          {onBack && !goal && (
            <button type="button" className="btn ghost" onClick={onBack}>{t('common.back')}</button>
          )}
          {goal && (
            <button type="button" className="btn danger" onClick={() => setConfirmDelete(true)}>{t('goals.delete')}</button>
          )}
          <span className="spacer" />
          <button type="submit" className="btn primary" disabled={!valid || busy}>{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  )
}
