import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Deposit } from '../lib/types'
import type { SavingsStats } from '../lib/stats'
import { formatMoneyShort, localeFor, parseDay } from '../lib/format'
import { useIsDark } from '../state/theme'

const AVG_MONTH_DAYS = 30.44
const FORECAST_MONTHS_MAX = 24

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1)

/** Wartości miesięczne: suma narastająco na koniec miesiąca, od miesiąca przed pierwszą wpłatą do dziś (+ prognoza). */
export function savingsSeries(deposits: Deposit[], stats: SavingsStats, now = new Date()) {
  if (!deposits.length) return null
  const byMonth = new Map<string, number>()
  for (const d of deposits) byMonth.set(d.date.slice(0, 7), (byMonth.get(d.date.slice(0, 7)) ?? 0) + Math.round(d.amount * 100))
  const first = deposits.map((d) => parseDay(d.date)).reduce((a, b) => (a < b ? a : b))
  const start = addMonths(new Date(first.getFullYear(), first.getMonth(), 1), -1)
  const current = new Date(now.getFullYear(), now.getMonth(), 1)
  const months: Date[] = []
  for (let m = start; m <= current; m = addMonths(m, 1)) months.push(m)
  let running = 0
  const values: number[] = months.map((m) => {
    running += byMonth.get(monthKey(m)) ?? 0
    return running / 100
  })
  // wpłaty z datą w przyszłości (rzadkie) – doliczone do bieżącego miesiąca
  values[values.length - 1] = stats.total
  const today = months.length - 1
  let forecast = false
  if (!stats.isAchieved && stats.dailyRate && stats.dailyRate > 0) {
    const perMonth = stats.dailyRate * AVG_MONTH_DAYS
    for (let k = 1; k <= FORECAST_MONTHS_MAX; k++) {
      const v = Math.min(stats.total + perMonth * k, stats.target)
      months.push(addMonths(current, k))
      values.push(Math.round(v))
      forecast = true
      if (v >= stats.target) break
    }
  }
  return { months, values, today: forecast ? today : null }
}

const spread = (n: number, count: number) => {
  if (n <= count) return [...Array(n).keys()]
  const step = (n - 1) / (count - 1)
  return [...new Set([...Array(count).keys()].map((i) => Math.round(i * step)))]
}

/** Linia oszczędności (narastająco) z linią ceny i przerywaną prognozą. */
export function SavingsChart({ deposits, stats, height = 240 }: { deposits: Deposit[]; stats: SavingsStats; height?: number | (() => number) }) {
  const { t, i18n } = useTranslation()
  const dark = useIsDark()
  const ref = useRef<HTMLDivElement>(null)
  const series = useMemo(() => savingsSeries(deposits, stats), [deposits, stats])
  const locale = localeFor(i18n.language)

  useEffect(() => {
    const host = ref.current
    if (!host || !series || !window.Charts) return
    const el = document.createElement('div')
    el.className = 'chart'
    host.replaceChildren(el)
    const fmtMonth = new Intl.DateTimeFormat(locale, { month: 'short', year: '2-digit' })
    const C = window.Charts
    C.line(el, {
      labels: series.months.map((m) => fmtMonth.format(m)),
      series: [{ name: t('chart.saved'), values: series.values }],
      format: C.fmt.money('PLN', 0),
      tickFormat: C.fmt.compact,
      height,
      reference: { value: stats.target, label: t('chart.price', { amount: formatMoneyShort(stats.target) }) },
      today: series.today,
      todayLabel: t('chart.today'),
      xAt: spread(series.months.length, 5),
    })
  }, [series, stats.target, height, locale, dark, t])

  if (!series) return <p className="empty">{t('chart.empty')}</p>
  return <div ref={ref} className="chart" style={{ minHeight: typeof height === 'function' ? height() : height }} />
}

/** Sumy wpłat w miesiącach; bieżący miesiąc w kolorze danych, poprzednie szare. */
export function MonthlyBars({ deposits, height = 180 }: { deposits: Deposit[]; height?: number }) {
  const { t, i18n } = useTranslation()
  const [readout, setReadout] = useState<string | null>(null)
  const dark = useIsDark()
  const ref = useRef<HTMLDivElement>(null)
  const locale = localeFor(i18n.language)

  const data = useMemo(() => {
    if (!deposits.length) return null
    const ins = new Map<string, number>()
    const outs = new Map<string, number>()
    for (const d of deposits) {
      const map = d.amount < 0 ? outs : ins
      map.set(d.date.slice(0, 7), (map.get(d.date.slice(0, 7)) ?? 0) + Math.round(Math.abs(d.amount) * 100))
    }
    const first = deposits.map((d) => parseDay(d.date)).reduce((a, b) => (a < b ? a : b))
    const now = new Date()
    const end = new Date(now.getFullYear(), now.getMonth(), 1)
    let start = new Date(first.getFullYear(), first.getMonth(), 1)
    // co najmniej 6 słupków, żeby jeden miesiąc nie był ścianą
    if (addMonths(start, 5) > end) start = addMonths(end, -5)
    const months: Date[] = []
    for (let m = start; m <= end; m = addMonths(m, 1)) months.push(m)
    return {
      months,
      values: months.map((m) => (ins.get(monthKey(m)) ?? 0) / 100),
      outs: months.map((m) => (outs.get(monthKey(m)) ?? 0) / 100),
      hasOut: outs.size > 0,
    }
  }, [deposits])

  useEffect(() => {
    const host = ref.current
    if (!host || !data || !window.Charts) return
    const el = document.createElement('div')
    el.className = 'chart'
    host.replaceChildren(el)
    const fmtMonth = new Intl.DateTimeFormat(locale, { month: 'short' })
    const C = window.Charts
    const grey = getComputedStyle(host).getPropertyValue('--chart-2').trim() || '#8a8a8a'
    const labels = data.months.map((m) => fmtMonth.format(m))
    if (data.hasOut) {
      // wpłaty w górę (kolor danych), wypłaty w dół (szare)
      C.diverging(el, {
        labels,
        up: data.values,
        down: data.outs,
        above: t('deposit.kindIn'),
        below: t('deposit.kindOut'),
        format: C.fmt.money('PLN', 0),
        tickFormat: C.fmt.compact,
        height,
        xAt: spread(data.months.length, 8),
      })
      return
    }
    C.bars(el, {
      labels,
      values: data.values,
      format: C.fmt.money('PLN', 0),
      tickFormat: C.fmt.compact,
      height,
      highlight: data.months.length - 1,
      mutedColour: grey,
      xAt: spread(data.months.length, 8),
    })
  }, [data, height, locale, dark, t])

  if (!data) return <p className="empty">{t('chart.empty')}</p>
  return (
    <>
      <div
        ref={ref}
        className="chart"
        style={{ minHeight: height }}
        onClick={(e) => {
          // na telefonie nie ma najechania – dotknięcie słupka pokazuje jego wartość
          const title = (e.target as Element).closest('rect')?.querySelector('title')?.textContent
          setReadout(title ?? null)
        }}
      />
      <p className="chart-readout" aria-live="polite">{readout ?? t('chart.tapHint')}</p>
    </>
  )
}
