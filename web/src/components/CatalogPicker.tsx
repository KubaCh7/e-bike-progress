import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../state/DataContext'
import { bikeName, type BikeCategory, type CatalogBike } from '../lib/types'
import { formatMoneyShort } from '../lib/format'
import { BikeImage } from './BikeImage'
import { Segmented } from './Segmented'
import { CheckIcon, SearchIcon } from './Icons'

type Filter = 'all' | BikeCategory
type Sort = 'popular' | 'brand' | 'price'

const TOP = 8
const rank = (b: CatalogBike) => b.popularity ?? 100

/**
 * Katalog e-bike'ów: najpopularniejsze na górze (TOP z numerami), potem reszta.
 * Sortowanie: popularność / marka A–Z (sekcje) / cena. Filtr kategorii i wyszukiwarka.
 */
export function CatalogPicker({
  selected,
  onToggle,
  disabledIds = [],
}: {
  selected: string[]
  onToggle: (bike: CatalogBike) => void
  disabledIds?: string[]
}) {
  const { t } = useTranslation()
  const { catalog } = useData()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('popular')

  const bikes = useMemo(() => {
    const q = query.trim().toLowerCase()
    return catalog
      .filter((b) => filter === 'all' || b.category === filter)
      .filter((b) => !q || bikeName(b).toLowerCase().includes(q))
  }, [catalog, query, filter])

  const sections = useMemo(() => {
    if (sort === 'price') return [{ key: 'price', title: null as string | null, color: null as string | null, top: false, bikes: [...bikes].sort((a, b) => a.price - b.price) }]
    if (sort === 'brand') {
      const byBrand = new Map<string, CatalogBike[]>()
      for (const bike of bikes) byBrand.set(bike.brand, [...(byBrand.get(bike.brand) ?? []), bike])
      return [...byBrand.entries()]
        .sort(([a], [b]) => a.localeCompare(b, 'pl', { numeric: true }))
        .map(([brand, list]) => ({ key: brand, title: brand, color: list[0].color, top: false, bikes: list.sort((a, b) => rank(a) - rank(b)) }))
    }
    const popular = [...bikes].sort((a, b) => rank(a) - rank(b) || a.price - b.price)
    const top = popular.slice(0, TOP)
    const rest = popular.slice(TOP)
    return [
      { key: 'top', title: t('catalog.top'), color: null, top: true, bikes: top },
      ...(rest.length ? [{ key: 'rest', title: t('catalog.rest'), color: null, top: false, bikes: rest }] : []),
    ]
  }, [bikes, sort, t])

  return (
    <div className="catalog">
      <div className="catalog__tools">
        <label className="search glass--clear r-pill">
          <SearchIcon size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('catalog.search')} aria-label={t('catalog.search')} />
        </label>
        <Segmented
          label={t('catalog.sort')}
          className="glass--clear"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'popular', label: t('catalog.sortPopular') },
            { value: 'brand', label: t('catalog.sortBrand') },
            { value: 'price', label: t('catalog.sortPrice') },
          ]}
        />
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

      {sections.map((section) => (
        <section key={section.key} className="catalog__section">
          {section.title && (
            <h3 className="catalog__title">
              {section.color && <span className="catalog__dot" style={{ background: section.color }} />}
              <span>{section.title}</span>
              <span className="catalog__count">{section.bikes.length}</span>
            </h3>
          )}
          <div className={`catalog__grid ${section.top ? 'catalog__grid--top' : ''}`}>
            {section.bikes.map((bike, i) => {
              const isSelected = selected.includes(bike.id)
              const isDisabled = disabledIds.includes(bike.id)
              const place = section.top ? i + 1 : null
              return (
                <button
                  key={bike.id}
                  type="button"
                  className={`bike-card ${section.top ? 'bike-card--top' : ''}`}
                  aria-pressed={isSelected}
                  disabled={isDisabled}
                  onClick={() => onToggle(bike)}
                  style={{ ['--brand' as string]: bike.color, animationDelay: `${Math.min(i, 12) * 35}ms` }}
                >
                  <span className="bike-card__art">
                    <BikeImage bike={bike} />
                    {place && <span className="plate display">#{place}</span>}
                    {isSelected && <span className="bike-card__check"><CheckIcon size={16} /></span>}
                  </span>
                  <span className="bike-card__brand display">{bike.brand}</span>
                  <span className="bike-card__model">{bike.model}</span>
                  <span className="bike-card__price num">
                    {isDisabled ? t('catalog.added') : `≈ ${formatMoneyShort(bike.price)}`}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      ))}

      {bikes.length === 0 && <p className="empty">{t('catalog.none')}</p>}
      <p className="fineprint">{t('catalog.priceNote')}</p>
    </div>
  )
}
