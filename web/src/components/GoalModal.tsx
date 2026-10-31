import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_GOAL, SUGGESTED_PHOTO_URL, type Goal } from '../lib/types'
import { formatNumber, parseAmount } from '../lib/format'
import { useData } from '../state/DataContext'
import { Modal, ConfirmDialog } from './Modal'
import { PhotoPicker, type PhotoChoice } from './PhotoPicker'
import { StarIcon, TrashIcon } from './Icons'

/** Dodawanie własnego e-bike'a (nazwa, cena, zdjęcie) i edycja / usuwanie celu. */
export function GoalModal({ goal, onClose }: { goal?: Goal; onClose: () => void }) {
  const { t } = useTranslation()
  const { createGoal, updateGoal, deleteGoal, setDefaultGoal, showToast, goals } = useData()
  const [name, setName] = useState(goal?.name ?? '')
  const [priceText, setPriceText] = useState(goal ? formatNumber(goal.targetAmount) : '')
  const [makeDefault, setMakeDefault] = useState(goal?.isDefault ?? false)
  const [photo, setPhoto] = useState<PhotoChoice>({ kind: 'keep' })
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const price = parseAmount(priceText)
  const trimmed = name.trim()
  const valid = trimmed.length > 0 && trimmed.length <= 120 && price !== null && price > 0
  const showSuggested = goal?.seedKey === DEFAULT_GOAL.seedKey || /pro\s*sr/i.test(trimmed)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid || price === null) return
    setBusy(true)
    try {
      const photoURL = photo.kind === 'suggested' ? SUGGESTED_PHOTO_URL : photo.kind === 'remove' ? null : undefined
      const blob = photo.kind === 'file' ? photo.blob : null
      if (goal) {
        await updateGoal(goal.id, { name: trimmed, targetAmount: price, ...(photoURL !== undefined && { photoURL }), ...(makeDefault && !goal.isDefault && { isDefault: true }) }, blob)
      } else {
        await createGoal({ name: trimmed, targetAmount: price, photoURL: photoURL ?? null, isDefault: makeDefault || goals.length === 0 }, blob)
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
      <form onSubmit={submit} style={{ display: 'contents' }}>
        <label className="field">
          <span className="field__label">{t('goals.name')}</span>
          <input className="input" value={name} maxLength={120} placeholder={t('goals.namePlaceholder')} onChange={(e) => setName(e.target.value)} />
        </label>

        <label className="field">
          <span className="field__label">{t('goals.price')}</span>
          <span className="input-wrap">
            <input className="input num" inputMode="decimal" placeholder="30 000,00" value={priceText} onChange={(e) => setPriceText(e.target.value)} />
            <span className="input-wrap__suffix">zł</span>
          </span>
          {priceText !== '' && (price === null || price <= 0) && <span className="field__error">{t('goals.invalidPrice')}</span>}
        </label>

        <PhotoPicker currentPhotoURL={goal?.photoURL ?? null} suggestedURL={SUGGESTED_PHOTO_URL} showSuggested={showSuggested} choice={photo} onChange={setPhoto} />

        {!goal?.isDefault && (
          <label className="check">
            <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} />
            <StarIcon size={16} className="star" /> {t('goals.makeDefault')}
          </label>
        )}

        <div className="modal__foot" style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', gap: 8 }}>
            {goal && (
              <button type="button" className="btn btn--danger" onClick={() => setConfirmDelete(true)}>
                <TrashIcon size={16} /> {t('goals.delete')}
              </button>
            )}
            {goal && !goal.isDefault && (
              <button type="button" className="btn hide-mobile" onClick={() => void setDefaultGoal(goal.id).then(onClose)}>
                <StarIcon size={16} className="star" /> {t('goals.setDefault')}
              </button>
            )}
          </span>
          <span style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn btn--primary" disabled={!valid || busy}>{t('common.save')}</button>
          </span>
        </div>
      </form>
    </Modal>
  )
}
