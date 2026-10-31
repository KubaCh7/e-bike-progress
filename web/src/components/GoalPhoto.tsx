import { useEffect, useState } from 'react'
import { useData } from '../state/DataContext'
import type { Goal } from '../lib/types'
import { BikeArt } from './BikeArt'

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

/**
 * Zdjęcie celu. Bez zdjęcia: ilustracja modelu z katalogu (kolor marki),
 * a dla własnego e-bike'a – neutralna ilustracja.
 */
export function GoalPhoto({
  goal,
  photoURL,
  catalogId,
  alt,
  src: override,
}: {
  goal?: Goal
  photoURL?: string | null
  catalogId?: string | null
  alt: string
  src?: string | null
}) {
  const { catalogById } = useData()
  const url = photoURL !== undefined ? photoURL : (goal?.photoURL ?? null)
  const resolved = useGoalPhoto(override === undefined ? url : null)
  const src = override === undefined ? resolved : override
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])

  if (src && !failed) {
    return <img className="photo" src={src} alt={alt} onError={() => setFailed(true)} loading="lazy" />
  }
  const bike = catalogById(catalogId !== undefined ? catalogId : goal?.catalogId)
  return (
    <div className="photo">
      <BikeArt category={bike?.category ?? 'emtb'} color={bike?.color ?? '#64748b'} label={alt} />
    </div>
  )
}
