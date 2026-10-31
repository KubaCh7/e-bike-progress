import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../state/DataContext'
import { bikeName, type BikeCategory, type CatalogBike } from '../lib/types'
import { formatMoneyShort } from '../lib/format'
import { BikeArt } from './BikeArt'
import { Segmented } from './Segmented'
import { CheckIcon, PlusIcon, SearchIcon } from './Icons'

type Filter = 'all' | BikeCategory

/** Siatka popularnych e-bike'ów z wyszukiwarką i filtrem kategorii + karta "Własny". */
export function CatalogPicker({
  selected,
  onToggle,
  onCustom,
  disabledIds = [],
}: {
  selected: string[]
  onToggle: (bike: CatalogBike) => void
  onCustom: () => void
  disabledIds?: string[]
}) {
  const { t } = useTranslation()
  const { catalog } = useData()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const bikes = useMemo(() => {
    const q = query.trim().toLowerCase()
    return catalog
      .filter((b) => filter === 'all' || b.category === filter)
      .filter((b) => !q || bikeName(b).toLowerCase().includes(q))
  }, [catalog, query, filter])

  return (
    <div className="catalog">
      <div className="catalog__tools">
        <label className="search glass--clear r-pill">
          <SearchIcon size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('catalog.search')} aria-label={t('catalog.search')} />
        </label>
        <Segmented
          label={t('catalog.category')}
          className="glass--clear"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('catalog.all') },
            { value: 'moto', label: t('catalog.moto') },
            { value: 'emtb', label: t('catalog.emtb') },
            { value: 'city', label: t('catalog.city') },
          ]}
        />
      </div>

      <div className="catalog__grid">
        <button type="button" className="bike-card bike-card--custom glass--clear r-l" onClick={onCustom}>
          <span className="bike-card__plus"><PlusIcon size={28} /></span>
          <span className="bike-card__brand">{t('catalog.custom')}</span>
          <span className="faint">{t('catalog.customHint')}</span>
        </button>
        {bikes.map((bike) => {
          const isSelected = selected.includes(bike.id)
          const isDisabled = disabledIds.includes(bike.id)
          return (
            <button
              key={bike.id}
              type="button"
              className="bike-card glass--clear r-l"
              aria-pressed={isSelected}
              disabled={isDisabled}
              onClick={() => onToggle(bike)}
            >
              <span className="bike-card__art">
                <BikeArt category={bike.category} color={bike.color} />
                {isSelected && <span className="bike-card__check"><CheckIcon size={16} /></span>}
              </span>
              <span className="bike-card__brand">{bike.brand}</span>
              <span className="bike-card__model">{bike.model}</span>
              <span className="bike-card__price num">{isDisabled ? t('catalog.added') : t('catalog.from', { price: formatMoneyShort(bike.price) })}</span>
            </button>
          )
        })}
      </div>
      {bikes.length === 0 && <p className="empty faint">{t('catalog.none')}</p>}
      <p className="faint small">{t('catalog.priceNote')}</p>
    </div>
  )
}
