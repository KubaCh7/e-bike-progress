import { useEffect, useState } from 'react'
import { useData } from '../state/DataContext'
import { BikeIcon } from './Icons'

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

/** Zdjęcie celu albo grafika zastępcza. */
export function GoalPhoto({ photoURL, alt, src: override }: { photoURL: string | null; alt: string; src?: string | null }) {
  const resolved = useGoalPhoto(override === undefined ? photoURL : null)
  const src = override === undefined ? resolved : override
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [src])

  if (!src || failed) {
    return (
      <div className="photo photo-placeholder" role="img" aria-label={alt}>
        <BikeIcon size={56} />
      </div>
    )
  }
  return <img className="photo" src={src} alt={alt} onError={() => setFailed(true)} loading="lazy" />
}
