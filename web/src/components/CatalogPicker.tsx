import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../state/DataContext'
import { bikeName, type BikeCategory, type CatalogBike } from '../lib/types'
import { formatMoneyShort } from '../lib/format'
import { BikeImage } from './BikeImage'
import { Segmented } from './Segmented'
import { CheckIcon, PlusIcon, SearchIcon } from './Icons'

type Filter = 'all' | BikeCategory
type Sort = 'brand' | 'price'

/** Katalog popularnych e-bike'ów: wyszukiwarka, kategorie, sortowanie po marce (sekcje A–Z) lub cenie. */
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
  const [sort, setSort] = useState<Sort>('brand')

  const bikes = useMemo(() => {
    const q = query.trim().toLowerCase()
    return catalog
      .filter((b) => filter === 'all' || b.category === filter)
      .filter((b) => !q || bikeName(b).toLowerCase().includes(q))
  }, [catalog, query, filter])

  // grupy: marka A–Z (modele wg ceny) albo jedna lista wg ceny
  const groups = useMemo(() => {
    if (sort === 'price') return [{ brand: null as string | null, bikes: [...bikes].sort((a, b) => a.price - b.price) }]
    const byBrand = new Map<string, CatalogBike[]>()
    for (const bike of bikes) byBrand.set(bike.brand, [...(byBrand.get(bike.brand) ?? []), bike])
    return [...byBrand.entries()]
      .sort(([a], [b]) => a.localeCompare(b, 'pl', { numeric: true }))
      .map(([brand, list]) => ({ brand, bikes: list.sort((a, b) => a.price - b.price) }))
  }, [bikes, sort])

  const card = (bike: CatalogBike) => {
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
          <BikeImage bike={bike} />
          {isSelected && <span className="bike-card__check"><CheckIcon size={16} /></span>}
        </span>
        <span className="bike-card__brand" style={{ ['--brand' as string]: bike.color }}>{bike.brand}</span>
        <span className="bike-card__model">{bike.model}</span>
        <span className="bike-card__price num">{isDisabled ? t('catalog.added') : t('catalog.from', { price: formatMoneyShort(bike.price) })}</span>
      </button>
    )
  }

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
        <Segmented
          label={t('catalog.sort')}
          className="glass--clear"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'brand', label: t('catalog.sortBrand') },
            { value: 'price', label: t('catalog.sortPrice') },
          ]}
        />
      </div>

      <div className="catalog__grid">
        <button type="button" className="bike-card bike-card--custom glass--clear r-l" onClick={onCustom}>
          <span className="bike-card__plus"><PlusIcon size={28} /></span>
          <span className="bike-card__model">{t('catalog.custom')}</span>
          <span className="faint small">{t('catalog.customHint')}</span>
        </button>
      </div>

      {groups.map((group) => (
        <section key={group.brand ?? 'all'} className="catalog__group">
          {group.brand && (
            <h3 className="catalog__brand">
              <span className="catalog__dot" style={{ background: group.bikes[0]?.color }} />
              {group.brand}
              <span className="faint small">{group.bikes.length}</span>
            </h3>
          )}
          <div className="catalog__grid">{group.bikes.map(card)}</div>
        </section>
      ))}

      {bikes.length === 0 && <p className="empty faint">{t('catalog.none')}</p>}
      <p className="faint small">{t('catalog.priceNote')}</p>
    </div>
  )
}
