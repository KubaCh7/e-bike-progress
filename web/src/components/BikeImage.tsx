import { useState } from 'react'
import type { CatalogBike } from '../lib/types'
import { BikeArt } from './BikeArt'

/** Zdjęcie modelu z katalogu (wolna licencja, z podpisem) albo ilustracja w kolorze marki. */
export function BikeImage({ bike, showCredit = false }: { bike: CatalogBike; showCredit?: boolean }) {
  const [failed, setFailed] = useState(false)
  if (!bike.image_url || failed) return <BikeArt category={bike.category} color={bike.color} label={`${bike.brand} ${bike.model}`} />
  return (
    <>
      <img
        className="photo"
        src={bike.image_url}
        alt={`${bike.brand} ${bike.model}`}
        loading="lazy"
        referrerPolicy="no-referrer"
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
