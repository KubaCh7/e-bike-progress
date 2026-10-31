import { useEffect, useRef, useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { compressImage } from '../lib/image'
import { GoalPhoto, PhotoPlaceholder } from './GoalPhoto'
import { useData } from '../state/DataContext'

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
  position,
  onPositionChange,
}: {
  position: string | null
  onPositionChange: (position: string | null) => void
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
      onPositionChange(null)
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
  const { catalogById } = useData()
  const catalogHasImage = choice.kind !== 'remove' && !hasPhoto && !!catalogById(catalogId)?.image_url

  return (
    <div className="field">
      <span className="label">{t('goals.photo')}</span>
      <div className="photo-field">
        {hasPhoto || catalogHasImage ? (
          <CropFrame position={position} onChange={onPositionChange} label={t('photo.cropHint')}>
            {choice.kind === 'file' ? (
              <GoalPhoto photoURL={null} catalogId={catalogId} src={preview} alt="" position={position} />
            ) : (
              <GoalPhoto photoURL={shownURL} catalogId={catalogId} alt="" position={position} />
            )}
          </CropFrame>
        ) : (
          <div
            className="dropzone-empty"
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
            <PhotoPlaceholder hint={processing ? t('photo.processing') : t('photo.add')} />
          </div>
        )}
        <div className="side">
          <span className="small muted">{hasPhoto || catalogHasImage ? t('photo.cropText') : t('photo.drop')}</span>
          {(hasPhoto || catalogHasImage) && position && (
            <div>
              <button type="button" className="btn sm ghost" onClick={() => onPositionChange(null)}>{t('photo.center')}</button>
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => void handleFile(e.target.files?.[0])} />
      </div>

      {showSuggested && <p className="hint">{t('photo.suggestionHint')}</p>}
      <div className="chips">
        {showSuggested && (
          <button type="button" className="btn sm outline" onClick={() => onChange({ kind: 'suggested' })}>
            {t('photo.useSuggested')}
          </button>
        )}
        <button type="button" className="btn sm outline" onClick={() => inputRef.current?.click()}>
          {t('photo.uploadOwn')}
        </button>
        <button type="button" className="btn sm outline" onClick={() => setLinkOpen((v) => !v)} aria-expanded={linkOpen}>
          {t('photo.fromLink')}
        </button>
        {hasPhoto && (
          <button type="button" className="btn sm danger" onClick={() => onChange({ kind: 'remove' })}>
            {t('photo.remove')}
          </button>
        )}
      </div>
      {linkOpen && (
        <div className="link-row">
          <input
            className="input"
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
            className="btn primary"
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
      {linkOpen && <span className="hint">{t('photo.linkHint')}</span>}
      {error && <span className="hint error">{error}</span>}
    </div>
  )
}

const clamp = (v: number) => Math.round(Math.min(100, Math.max(0, v)))
const parse = (p: string | null): [number, number] => {
  const m = /^(\d{1,3})% (\d{1,3})%$/.exec(p ?? '')
  return m ? [Number(m[1]), Number(m[2])] : [50, 50]
}

/** Ramka kadrowania: przeciągnij zdjęcie (albo strzałki), żeby ustawić, co ma być widać. */
function CropFrame({ position, onChange, label, children }: { position: string | null; onChange: (p: string) => void; label: string; children: React.ReactNode }) {
  const start = useRef<{ x: number; y: number; px: number; py: number; w: number; h: number } | null>(null)
  const [x, y] = parse(position)
  const set = (nx: number, ny: number) => onChange(`${clamp(nx)}% ${clamp(ny)}%`)
  return (
    <div
      className="crop"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuetext={`${x}% ${y}%`}
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        start.current = { x: e.clientX, y: e.clientY, px: x, py: y, w: r.width, h: r.height }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        const s0 = start.current
        if (!s0) return
        // przesunięcie zdjęcia w prawo pokazuje jego lewą część → mniejsze x
        set(s0.px - ((e.clientX - s0.x) / s0.w) * 100, s0.py - ((e.clientY - s0.y) / s0.h) * 100)
      }}
      onPointerUp={() => (start.current = null)}
      onPointerCancel={() => (start.current = null)}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 10 : 4
        const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }
        const m = moves[e.key]
        if (!m) return
        e.preventDefault()
        set(x + m[0], y + m[1])
      }}
    >
      {children}
      <span className="crop-hint">{label}</span>
    </div>
  )
}
