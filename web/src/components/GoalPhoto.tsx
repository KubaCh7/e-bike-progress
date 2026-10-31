import { useEffect, useState } from 'react'
import { useData } from '../state/DataContext'
import type { Goal } from '../lib/types'
import { BikeIcon } from './Icons'
import { BikeImage } from './BikeImage'

/** Zamienia photoURL (Storage / data URL / asset) na adres obrazka. */
export function useGoalPhoto(photoURL: string | null) {
  const { store } = useData()
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!photoURL) {
      setSrc(null)
      return
    }
    void store.resolvePhoto(photoURL).then((url) => {
      if (!cancelled) setSrc(url)
    })
    return () => {
      cancelled = true
    }
  }, [photoURL, store])

  return src
}

/** Ikona zastępcza, gdy e-bike nie ma zdjęcia. Z `hint` – zachęta do wgrania. */
export function PhotoPlaceholder({ label, hint }: { label?: string; hint?: string }) {
  return (
    <div className="photo-empty" role={label ? 'img' : undefined} aria-label={label}>
      <span className="photo-empty-icon"><BikeIcon size={28} /></span>
      {hint && <span className="photo-empty-hint">{hint}</span>}
    </div>
  )
}

/**
 * Zdjęcie celu (z kadrem photoPosition). Bez zdjęcia: zdjęcie modelu z katalogu,
 * a gdy go nie ma – ikona zastępcza.
 */
export function GoalPhoto({
  goal,
  photoURL,
  catalogId,
  alt,
  src: override,
  position,
  hint,
}: {
  goal?: Goal
  photoURL?: string | null
  catalogId?: string | null
  alt: string
  src?: string | null
  position?: string | null
  hint?: string
}) {
  const { catalogById } = useData()
  const url = photoURL !== undefined ? photoURL : (goal?.photoURL ?? null)
  const resolved = useGoalPhoto(override === undefined ? url : null)
  const src = override === undefined ? resolved : override
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  const pos = position !== undefined ? position : (goal?.photoPosition ?? null)

  if (src && !failed) {
    return <img className="photo" src={src} alt={alt} style={pos ? { objectPosition: pos } : undefined} onError={() => setFailed(true)} loading="lazy" draggable={false} />
  }
  const bike = catalogById(catalogId !== undefined ? catalogId : goal?.catalogId)
  if (bike?.image_url) return <div className="photo"><BikeImage bike={bike} showCredit position={pos} /></div>
  return <PhotoPlaceholder label={alt || undefined} hint={hint} />
}
