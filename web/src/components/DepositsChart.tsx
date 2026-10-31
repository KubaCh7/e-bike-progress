import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Deposit } from '../lib/types'
import { cumulativeSeries, monthlyTotals, type ChartPoint } from '../lib/stats'
import { formatMoney, formatMoneyShort, localeFor } from '../lib/format'
import { Segmented } from './Segmented'

type Mode = 'cumulative' | 'monthly'

/** Kolory wykresu z tokenów CSS (zmieniają się z motywem). */
function useChartColors() {
  const read = () => {
    const css = getComputedStyle(document.documentElement)
    const v = (name: string) => css.getPropertyValue(name).trim()
    return { line: v('--chart-line'), fill: v('--chart-fill'), grid: v('--chart-grid'), target: v('--chart-target'), text: v('--ink-3') }
  }
  const [colors, setColors] = useState(read)
  useEffect(() => {
    const update = () => setColors(read())
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', update)
    return () => {
      observer.disconnect()
      media.removeEventListener('change', update)
    }
  }, [])
  return colors
}

const compactFmt = new Intl.NumberFormat('pl-PL', { notation: 'compact', maximumFractionDigits: 1 })

/** Wykres wpłat w czasie: suma narastająco (z linią celu) lub sumy miesięczne. */
export function DepositsChart({ deposits, target, compact = false }: { deposits: Deposit[]; target: number; compact?: boolean }) {
  const { t, i18n } = useTranslation()
  const [mode, setMode] = useState<Mode>('cumulative')
  const colors = useChartColors()
  const locale = localeFor(i18n.language)

  const data = useMemo(() => (mode === 'cumulative' ? cumulativeSeries(deposits) : monthlyTotals(deposits)), [deposits, mode])
  const fmtDay = (time: number) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(time)
  const fmtMonth = (time: number) => new Intl.DateTimeFormat(locale, { month: 'short', year: '2-digit' }).format(time)
  const fmtLong = (time: number) =>
    new Intl.DateTimeFormat(locale, mode === 'monthly' ? { month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long', year: 'numeric' }).format(time)

  const tooltip = ({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload?: ChartPoint }> }) => {
    const point = active ? payload?.[0]?.payload : undefined
    if (!point) return null
    return (
      <div className="chart-tooltip glass r-m">
        <span className="muted">{fmtLong(point.time)}</span>
        <strong className="num">{formatMoney(point.value)}</strong>
      </div>
    )
  }

  const axisProps = { stroke: colors.text, tick: { fill: colors.text, fontSize: 12 }, tickLine: false, axisLine: false }

  return (
    <section className={`card glass r-xl ${compact ? 'card--compact' : ''}`} aria-label={t('stats.chart')}>
      <div className="card__head">
        <h2 className="section-title">{t('stats.chart')}</h2>
        <Segmented
          className="glass--clear seg--sm"
          label={t('stats.chart')}
          value={mode}
          onChange={setMode}
          options={(['cumulative', 'monthly'] as Mode[]).map((m) => ({ value: m, label: t(`stats.${m}`) }))}
        />
      </div>

      {data.length === 0 ? (
        <p className="empty">{t('stats.empty')}</p>
      ) : (
        <div className={`chart ${compact ? 'chart--compact' : ''}`}>
          <ResponsiveContainer width="100%" height="100%">
            {mode === 'cumulative' ? (
              <AreaChart data={data} margin={{ top: 24, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillSaved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.line} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={colors.line} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={colors.grid} vertical={false} />
                <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={fmtDay} minTickGap={32} {...axisProps} />
                <YAxis width={64} tickFormatter={(v: number) => compactFmt.format(v)} domain={[0, (max: number) => Math.max(max, target) * 1.05]} {...axisProps} />
                <Tooltip content={tooltip} cursor={{ stroke: colors.target, strokeWidth: 1 }} />
                <ReferenceLine
                  y={target}
                  stroke={colors.target}
                  strokeDasharray="4 4"
                  label={{ value: t('stats.targetLine', { amount: formatMoneyShort(target) }), position: 'insideTopLeft', fill: colors.text, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="value" stroke={colors.line} strokeWidth={2} fill="url(#fillSaved)" activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--bg)' }} dot={false} />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 24, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={colors.grid} vertical={false} />
                <XAxis dataKey="time" tickFormatter={fmtMonth} minTickGap={16} {...axisProps} />
                <YAxis width={64} tickFormatter={(v: number) => compactFmt.format(v)} {...axisProps} />
                <Tooltip content={tooltip} cursor={{ fill: colors.grid }} />
                <Bar dataKey="value" fill={colors.line} radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
