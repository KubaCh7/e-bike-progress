import { useState } from 'react'
import type { CatalogBike } from '../lib/types'
import { PhotoPlaceholder } from './GoalPhoto'

/** Zdjęcie modelu z katalogu (wolna licencja, z podpisem) albo ikona zastępcza. */
export function BikeImage({ bike, showCredit = false, position }: { bike: CatalogBike; showCredit?: boolean; position?: string | null }) {
  const [failed, setFailed] = useState(false)
  if (!bike.image_url || failed) return <PhotoPlaceholder label={`${bike.brand} ${bike.model}`} />
  return (
    <>
      <img
        className="photo"
        src={bike.image_url}
        alt={`${bike.brand} ${bike.model}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        style={position ? { objectPosition: position } : undefined}
        onError={() => setFailed(true)}
      />
      {showCredit && bike.image_credit && (
        <a className="photo-credit" href={bike.image_source ?? undefined} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
          {bike.image_credit}
        </a>
      )}
    </>
  )
}
