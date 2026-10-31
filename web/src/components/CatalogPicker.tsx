import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../state/DataContext'
import { bikeName, type BikeCategory, type CatalogBike } from '../lib/types'
import { formatMoneyShort } from '../lib/format'
import { Segmented } from './Segmented'
import { CheckIcon } from './Icons'

type Filter = 'all' | BikeCategory
type Sort = 'popular' | 'brand' | 'price'

const TOP = 8
const rank = (b: CatalogBike) => b.popularity ?? 100

/**
 * Katalog e-bike'ów jako lista: najpopularniejsze na górze (z miejscem w rankingu), potem reszta.
 * Sortowanie: popularność / marka A–Z (grupy) / cena. Filtr kategorii i wyszukiwarka.
 */
export function CatalogPicker({
  selected,
  onToggle,
  disabledIds = [],
  multi = true,
}: {
  selected: string[]
  onToggle: (bike: CatalogBike) => void
  disabledIds?: string[]
  multi?: boolean
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

  const groups = useMemo(() => {
    if (sort === 'price') return [{ key: 'price', title: t('catalog.byPrice'), ranked: false, bikes: [...bikes].sort((a, b) => a.price - b.price) }]
    if (sort === 'brand') {
      const byBrand = new Map<string, CatalogBike[]>()
      for (const bike of bikes) byBrand.set(bike.brand, [...(byBrand.get(bike.brand) ?? []), bike])
      return [...byBrand.entries()]
        .sort(([a], [b]) => a.localeCompare(b, 'pl', { numeric: true }))
        .map(([brand, list]) => ({ key: brand, title: brand, ranked: false, bikes: list.sort((a, b) => a.price - b.price) }))
    }
    const popular = [...bikes].sort((a, b) => rank(a) - rank(b) || a.price - b.price)
    return [
      { key: 'top', title: t('catalog.top'), ranked: true, bikes: popular.slice(0, TOP) },
      ...(popular.length > TOP ? [{ key: 'rest', title: t('catalog.rest'), ranked: false, bikes: popular.slice(TOP) }] : []),
    ]
  }, [bikes, sort, t])

  const categoryLabel = (c: BikeCategory) => t(`catalog.${c}`)

  return (
    <div className={`catalog ${multi ? '' : 'single'}`}>
      <div className="catalog-tools">
        <input className="input search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('catalog.search')} aria-label={t('catalog.search')} />
        <select className="input" value={filter} onChange={(e) => setFilter(e.target.value as Filter)} aria-label={t('catalog.category')}>
          {(['all', 'moto', 'emtb', 'city'] as Filter[]).map((f) => (
            <option key={f} value={f}>{t(`catalog.${f}`)}</option>
          ))}
        </select>
        <Segmented
          label={t('catalog.sort')}
          value={sort}
          onChange={setSort}
          options={[
            { value: 'popular', label: t('catalog.sortPopular') },
            { value: 'brand', label: t('catalog.sortBrand') },
            { value: 'price', label: t('catalog.sortPrice') },
          ]}
        />
      </div>

      {groups.map((group) => (
        <section key={group.key} className="catalog-group">
          <h3>
            <span>{group.title}</span>
            <span className="num">{group.bikes.length}</span>
          </h3>
          {group.bikes.map((bike, i) => {
            const isSelected = selected.includes(bike.id)
            const isDisabled = disabledIds.includes(bike.id)
            return (
              <button
                key={bike.id}
                type="button"
                className="cat-row"
                aria-pressed={multi ? isSelected : undefined}
                disabled={isDisabled}
                onClick={() => onToggle(bike)}
              >
                {multi ? <span className="box" aria-hidden="true">{isSelected && <CheckIcon size={12} strokeWidth={2.5} />}</span> : <span className="box-slot" />}
                <span className="rank small">{group.ranked ? `${i + 1}.` : ''}</span>
                <span className="name">
                  <b className="ellipsis">{sort === 'brand' ? bike.model : bikeName(bike)}</b>
                  <span className="small muted">{categoryLabel(bike.category)}</span>
                </span>
                <span className="price">{isDisabled ? <span className="muted">{t('catalog.added')}</span> : formatMoneyShort(bike.price)}</span>
              </button>
            )
          })}
        </section>
      ))}

      {bikes.length === 0 && <p className="empty">{t('catalog.none')}</p>}
      <p className="fineprint">{t('catalog.priceNote')}</p>
    </div>
  )
}
