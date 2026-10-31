import { useTranslation } from 'react-i18next'
import { useData } from '../state/DataContext'
import { formatMoney, formatMoneyShort, localeFor } from '../lib/format'
import { DepositsChart } from '../components/DepositsChart'

const DAY_MS = 86_400_000

/** Statystyki: średnia wpłata, suma w miesiącu, prognoza, tempo + wykres. */
export function StatsPage() {
  const { t, i18n } = useTranslation()
  const { currentGoal, currentStats: stats, currentDeposits } = useData()
  if (!currentGoal || !stats) return null

  let forecast = t('stats.forecastNone')
  let forecastDetail = ''
  if (stats.isAchieved) forecast = t('stats.forecastAchieved')
  else if (stats.forecastDate) {
    forecast = new Intl.DateTimeFormat(localeFor(i18n.language), { month: 'long', year: 'numeric' }).format(stats.forecastDate)
    const days = Math.max(0, Math.round((stats.forecastDate.getTime() - new Date().setHours(0, 0, 0, 0)) / DAY_MS))
    forecastDetail = t('stats.inDays', { count: days })
  }

  const tiles = [
    { label: t('stats.forecast'), value: forecast, detail: forecastDetail, big: true },
    { label: t('stats.average'), value: stats.average !== null ? formatMoney(stats.average) : '—' },
    { label: t('stats.thisMonth'), value: formatMoney(stats.thisMonth) },
    {
      label: t('stats.pace'),
      value: stats.dailyRate !== null ? t('stats.perMonth', { amount: formatMoneyShort(stats.dailyRate * 30) }) : '—',
      detail: t('history.count', { count: stats.count }),
    },
  ]

  return (
    <div className="page page--stats">
      <div className="tiles">
        {tiles.map((tile) => (
          <div key={tile.label} className={`tile ${tile.big ? 'tile--big' : ''}`}>
            <span className="faint small">{tile.label}</span>
            <span className="tile__value num cap">{tile.value}</span>
            {tile.detail && <span className="faint small">{tile.detail}</span>}
          </div>
        ))}
      </div>
      <DepositsChart deposits={currentDeposits} target={currentGoal.targetAmount} />
      <p className="faint small center">{t('stats.forecastHint')}</p>
    </div>
  )
}
