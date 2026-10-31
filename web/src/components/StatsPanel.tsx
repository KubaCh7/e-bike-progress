import { useTranslation } from 'react-i18next'
import type { SavingsStats } from '../lib/stats'
import { formatMoney, formatMoneyShort, localeFor } from '../lib/format'
import { CalendarIcon, DivideIcon, FlagIcon, GaugeIcon } from './Icons'
import type { ReactNode } from 'react'

const DAY_MS = 86_400_000

/** Kafelki statystyk: średnia wpłata, suma w miesiącu, prognoza, tempo. */
export function StatsPanel({ stats }: { stats: SavingsStats }) {
  const { t, i18n } = useTranslation()

  let forecast = t('stats.forecastNone')
  let forecastDetail: string | null = null
  if (stats.isAchieved) {
    forecast = t('stats.forecastAchieved')
  } else if (stats.forecastDate) {
    forecast = new Intl.DateTimeFormat(localeFor(i18n.language), { month: 'short', year: 'numeric' }).format(stats.forecastDate)
    const days = Math.max(0, Math.round((stats.forecastDate.getTime() - new Date().setHours(0, 0, 0, 0)) / DAY_MS))
    forecastDetail = t('stats.inDays', { count: days })
  }

  return (
    <section aria-label={t('stats.title')}>
      <div className="stats">
        <Tile icon={<DivideIcon size={16} />} label={t('stats.average')} value={stats.average !== null ? formatMoney(stats.average) : '—'} />
        <Tile icon={<CalendarIcon size={16} />} label={t('stats.thisMonth')} value={formatMoney(stats.thisMonth)} />
        <Tile icon={<FlagIcon size={16} />} label={t('stats.forecast')} value={forecast} detail={forecastDetail} />
        <Tile
          icon={<GaugeIcon size={16} />}
          label={t('stats.pace')}
          value={stats.dailyRate !== null ? t('stats.perMonth', { amount: formatMoneyShort(stats.dailyRate * 30) }) : '—'}
          detail={t('history.count', { count: stats.count })}
        />
      </div>
    </section>
  )
}

function Tile({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail?: string | null }) {
  return (
    <div className="tile glass glass--l">
      <div className="tile__label">{icon} {label}</div>
      <div className="tile__value num" title={value}>{value}</div>
      <div className="tile__detail">{detail ?? ''}</div>
    </div>
  )
}
