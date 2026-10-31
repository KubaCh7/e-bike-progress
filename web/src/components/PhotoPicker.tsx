import { useEffect, useRef, useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { compressImage } from '../lib/image'
import { GoalPhoto } from './GoalPhoto'
import { ImageIcon, LinkIcon, SparkIcon, TrashIcon } from './Icons'

export type PhotoChoice =
  | { kind: 'keep' }
  | { kind: 'file'; blob: Blob }
  | { kind: 'suggested' }
  | { kind: 'remove' }
  | { kind: 'url'; url: string }

/** Wybór zdjęcia: sugerowane (SR), plik z dysku (input / drag & drop), usunięcie. */
export function PhotoPicker({
  currentPhotoURL,
  suggestedURL,
  showSuggested,
  choice,
  onChange,
  catalogId = null,
}: {
  catalogId?: string | null
  currentPhotoURL: string | null
  suggestedURL: string
  showSuggested: boolean
  choice: PhotoChoice
  onChange: (choice: PhotoChoice) => void
}) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [link, setLink] = useState('')
  const linkValid = /^https:\/\/\S+$/i.test(link.trim())

  // podgląd świeżo wybranego pliku
  useEffect(() => {
    if (choice.kind !== 'file') return setPreview(null)
    const url = URL.createObjectURL(choice.blob)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [choice])

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError(t('photo.error'))
    setError(null)
    setProcessing(true)
    try {
      onChange({ kind: 'file', blob: await compressImage(file) })
    } catch {
      setError(t('photo.error'))
    } finally {
      setProcessing(false)
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void handleFile(e.dataTransfer.files[0])
  }

  const shownURL =
    choice.kind === 'suggested'
      ? suggestedURL
      : choice.kind === 'url'
        ? choice.url
        : choice.kind === 'remove'
          ? null
          : choice.kind === 'keep'
            ? currentPhotoURL
            : null
  const hasPhoto = choice.kind === 'file' || !!shownURL

  return (
    <div className="field">
      <span className="field__label">{t('goals.photo')}</span>
      <div
        className="dropzone"
        data-active={dragging}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        aria-label={t('photo.drop')}
      >
        <div className="dropzone__preview">
          {choice.kind === 'file' ? <GoalPhoto photoURL={null} catalogId={catalogId} src={preview} alt="" /> : <GoalPhoto photoURL={shownURL} catalogId={catalogId} alt="" />}
        </div>
        <span className="faint small">{processing ? t('photo.processing') : t('photo.drop')}</span>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => void handleFile(e.target.files?.[0])} />
      </div>

      {showSuggested && <p className="field__hint">{t('photo.suggestionHint')}</p>}
      <div className="quick">
        {showSuggested && (
          <button type="button" className="btn btn--sm btn--prominent" onClick={() => onChange({ kind: 'suggested' })}>
            <SparkIcon size={16} /> {t('photo.useSuggested')}
          </button>
        )}
        <button type="button" className="btn btn--sm glass--clear" onClick={() => inputRef.current?.click()}>
          <ImageIcon size={16} /> {t('photo.uploadOwn')}
        </button>
        <button type="button" className="btn btn--sm glass--clear" onClick={() => setLinkOpen((v) => !v)} aria-expanded={linkOpen}>
          <LinkIcon size={16} /> {t('photo.fromLink')}
        </button>
        {hasPhoto && (
          <button type="button" className="btn btn--sm btn--plain btn--danger" onClick={() => onChange({ kind: 'remove' })}>
            <TrashIcon size={16} /> {t('photo.remove')}
          </button>
        )}
      </div>
      {linkOpen && (
        <div className="link-row">
          <input
            className="search glass--clear r-pill"
            type="url"
            inputMode="url"
            placeholder="https://…/zdjecie.jpg"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && linkValid) {
                e.preventDefault()
                onChange({ kind: 'url', url: link.trim() })
                setLinkOpen(false)
              }
            }}
            aria-label={t('photo.fromLink')}
          />
          <button
            type="button"
            className="btn btn--sm btn--prominent"
            disabled={!linkValid}
            onClick={() => {
              onChange({ kind: 'url', url: link.trim() })
              setLinkOpen(false)
            }}
          >
            {t('common.ok')}
          </button>
        </div>
      )}
      {linkOpen && <span className="field__hint">{t('photo.linkHint')}</span>}
      {error && <span className="field__error">{error}</span>}
    </div>
  )
}
