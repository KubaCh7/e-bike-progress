import { useTranslation } from 'react-i18next'
import { useData } from '../state/DataContext'
import { formatDate, formatMoneyShort, formatPercent, localeFor } from '../lib/format'
import type { CatalogBike, Deposit } from '../lib/types'
import type { SavingsStats } from '../lib/stats'
import { useRef, useState } from 'react'
import { GoalPhoto } from '../components/GoalPhoto'
import { compressImage } from '../lib/image'
import type { Goal } from '../lib/types'
import { SavingsChart } from '../components/Charts'

const QUICK = [100, 200, 500]
const RECENT = 5
const AVG_MONTH_DAYS = 30.44
const chartHeight = () => (window.innerWidth < 860 ? 220 : 320)

/** Przegląd: ile brakuje do e-bike'a i kiedy go kupisz. */
export function OverviewPage({
  onAddDeposit,
  onWithdraw,
  onQuickDeposit,
  onEditGoal,
  onChangePrice,
  onEditDeposit,
  onShowDeposits,
}: {
  onAddDeposit: () => void
  onWithdraw: () => void
  onQuickDeposit: (amount: number) => void
  onEditGoal: () => void
  onChangePrice: () => void
  onEditDeposit: (d: Deposit) => void
  onShowDeposits: () => void
}) {
  const { t, i18n } = useTranslation()
  const { currentGoal: goal, currentStats: stats, currentDeposits: deposits, catalog, catalogById } = useData()
  if (!goal || !stats) return null
  const locale = localeFor(i18n.language)
  const monthYear = (d: Date) => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d)
  const perMonth = stats.dailyRate !== null ? stats.dailyRate * AVG_MONTH_DAYS : null
  const first = deposits.length ? deposits[deposits.length - 1] : null
  const bike = catalogById(goal.catalogId)

  return (
    <div className="page">
      <div className="title-row">
        <div>
          <h1>{goal.name}</h1>
          <p className="sub">
            {deposits.length === 0 ? (
              t('overview.findingEmpty')
            ) : stats.isAchieved ? (
              t('overview.findingDone')
            ) : stats.forecastDate && perMonth ? (
              <>
                {t('overview.findingForecast')} <strong>{monthYear(stats.forecastDate)}</strong>
                {', '}
                {t('overview.findingPace', { amount: formatMoneyShort(perMonth) })}
              </>
            ) : (
              t('stats.forecastNone')
            )}
          </p>
        </div>
        <div className="actions desk">
          <button type="button" className="btn ghost" onClick={onEditGoal}>{t('overview.editBike')}</button>
          <button type="button" className="btn outline" onClick={onWithdraw} disabled={stats.total <= 0}>{t('deposit.kindOut')}</button>
          <button type="button" className="btn primary" onClick={onAddDeposit}>{t('home.addDeposit')}</button>
        </div>
      </div>

      <div className="stack">
        <section className="panel" aria-label={t('home.progress')}>
          <div className="plan">
            <PlanPhoto goal={goal} hasCatalogImage={!!bike?.image_url} onEdit={onEditGoal} />
            <div>
              <div className="plan-figures">
                <div>
                  <div className="muted">{t('home.saved')}</div>
                  <div className="plan-saved">
                    {formatMoneyShort(stats.total)}
                    <small>{t('overview.ofPrice', { amount: formatMoneyShort(stats.target) })}</small>
                  </div>
                  <button type="button" className="link-button small" onClick={onChangePrice}>{t('price.title')}</button>
                </div>
                <div className="plan-left">
                  <div className="muted">{stats.isAchieved ? t('overview.done') : t('overview.left')}</div>
                  <div className="v">{stats.isAchieved ? formatPercent(1) : formatMoneyShort(stats.remaining)}</div>
                </div>
              </div>
              <PlanBar stats={stats} bike={bike} catalog={catalog} />
            </div>
          </div>
        </section>

        <div className="kpis">
          <div className="kpi">
            <div className="kpi-label">{t('stats.thisMonth')}</div>
            <div className="kpi-value num">{formatMoneyShort(stats.thisMonth)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">{t('stats.pace')}</div>
            <div className="kpi-value num">{perMonth !== null ? formatMoneyShort(perMonth) : '—'}</div>
            <div className="kpi-sub">{t('overview.perMonthAvg')}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">{t('stats.average')}</div>
            <div className="kpi-value num">{stats.average !== null ? formatMoneyShort(stats.average) : '—'}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">{t('overview.count')}</div>
            <div className="kpi-value num">{stats.count}</div>
            <div className="kpi-sub">{first ? t('overview.since', { date: formatDate(first.date, i18n.language) }) : '—'}</div>
          </div>
        </div>

        <div className="grid stretch">
          <section className="panel span-8">
            <div className="panel-head">
              <h2>{t('overview.chartTitle')}</h2>
              <span className="meta">{t('overview.chartMeta')}</span>
            </div>
            <SavingsChart deposits={deposits} stats={stats} height={chartHeight} />
          </section>

          <section className="panel span-4 col">
            <div className="panel-head">
              <h2>{t('home.recent')}</h2>
              {deposits.length > 0 && (
                <button type="button" className="card-link" onClick={onShowDeposits}>
                  {t('overview.all', { count: deposits.length })}
                </button>
              )}
            </div>
            {deposits.length === 0 ? (
              <p className="empty">{t('history.emptyDesc')}</p>
            ) : (
              <ul className="rows">
                {deposits.slice(0, RECENT).map((d) => (
                  <li key={d.id}>
                    <button type="button" className="row row-button" onClick={() => onEditDeposit(d)} aria-label={`${t('common.edit')}: ${formatDate(d.date, i18n.language)}`}>
                      <span className="grow">
                        <span>{formatDate(d.date, i18n.language)}</span>
                        {(d.note || d.amount < 0) && <span className="small muted ellipsis">{d.note || t('deposit.kindOut')}</span>}
                      </span>
                      <span className={`amount ${d.amount < 0 ? 'neg' : ''}`}>{d.amount < 0 ? '−' : ''}{formatMoneyShort(Math.abs(d.amount))}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="panel-foot pin">
              <span className="muted">{t('home.quick')}</span>
              <div className="chips">
                {QUICK.map((amount) => (
                  <button key={amount} type="button" className="btn sm outline num" onClick={() => onQuickDeposit(amount)}>
                    +{amount} zł
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

/**
 * Pasek planu: uzbierana kwota na tle ceny w kolorze marki. Pod paskiem drabinka cen –
 * tańsze modele tej samej marki, żeby widać było, na który już cię stać.
 */
function PlanBar({ stats, bike, catalog }: { stats: SavingsStats; bike: CatalogBike | null | undefined; catalog: CatalogBike[] }) {
  const { t } = useTranslation()
  const pct = Math.min(stats.progress, 1)
  const ladder: { bike: CatalogBike; at: number }[] = []
  if (bike && stats.target > 0) {
    const cheaper = catalog
      .filter((b) => b.brand === bike.brand && b.id !== bike.id && (b.popularity ?? 100) < 100 && b.price < stats.target * 0.97 && b.price > stats.target * 0.08)
      .sort((a, b) => a.price - b.price)
    for (const b of cheaper) {
      const at = b.price / stats.target
      // etykiety nie mogą na siebie nachodzić
      if (ladder.length && at - ladder[ladder.length - 1].at < 0.22) continue
      ladder.push({ bike: b, at })
      if (ladder.length === 3) break
    }
  }

  return (
    <div className="plan-bar">
      <div
        className="plan-track"
        role="progressbar"
        aria-label={t('home.progress')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct * 100)}
        aria-valuetext={formatPercent(pct)}
      >
        <div className="plan-fill" style={{ width: `${pct * 100}%` }} />
      </div>
      {ladder.length > 0 ? (
        <>
          <div className={`plan-ticks ${ladder.length > 1 ? 'many' : ''}`} aria-label={t('overview.ladder', { brand: bike?.brand })}>
            {ladder.map(({ bike: b, at }, i) => (
              <span
                key={b.id}
                className={`plan-tick ${at > 0.72 ? 'flip' : ''} ${i % 2 ? 'low' : ''} ${stats.total >= b.price ? 'reached' : ''}`}
                style={{ left: `${at * 100}%` }}
                title={`${b.brand} ${b.model}`}
              >
                {b.model}
                <span className="p">{formatMoneyShort(b.price)}</span>
              </span>
            ))}
          </div>
          <p className="plan-note small">{t('overview.ladderNote', { brand: bike?.brand })}</p>
        </>
      ) : (
        <div className="plan-scale">
          <span>{formatPercent(pct)}</span>
          <span>{formatMoneyShort(stats.target)}</span>
        </div>
      )}
    </div>
  )
}

/** Zdjęcie e-bike'a. Bez zdjęcia: ikona z „Dodaj zdjęcie” – kliknięcie od razu otwiera wybór pliku. */
function PlanPhoto({ goal, hasCatalogImage, onEdit }: { goal: Goal; hasCatalogImage: boolean; onEdit: () => void }) {
  const { t } = useTranslation()
  const { updateGoal, showToast } = useData()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const empty = !goal.photoURL && !hasCatalogImage

  async function upload(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return
    setBusy(true)
    try {
      await updateGoal(goal.id, { photoPosition: null }, await compressImage(file))
      showToast(t('photo.added'))
    } catch {
      showToast(t('photo.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="plan-photo">
      <button
        type="button"
        className="plan-photo-button"
        onClick={() => (empty ? input.current?.click() : onEdit())}
        aria-label={empty ? t('photo.add') : t('photo.change')}
        title={empty ? t('photo.add') : t('photo.change')}
      >
        <GoalPhoto goal={goal} alt={goal.name} hint={busy ? t('photo.processing') : t('photo.add')} />
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void upload(e.target.files?.[0])} />
    </div>
  )
}
