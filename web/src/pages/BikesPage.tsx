import { useTranslation } from 'react-i18next'
import { useData } from '../state/DataContext'
import { formatMoneyShort, formatPercent, localeFor } from '../lib/format'
import { GoalPhoto } from '../components/GoalPhoto'

/** E-bike'i (cele): na które zbierasz i ile brakuje do każdego. */
export function BikesPage({ onAdd, onEdit, onOpen }: { onAdd: () => void; onEdit: (goalId: string) => void; onOpen: (goalId: string) => void }) {
  const { t, i18n } = useTranslation()
  const { goals, currentGoal, statsFor, setDefaultGoal, showToast } = useData()
  const monthYear = new Intl.DateTimeFormat(localeFor(i18n.language), { month: 'short', year: 'numeric' })

  return (
    <div className="page">
      <div className="title-row">
        <div>
          <h1>{t('view.bikes')}</h1>
          <p className="sub">{t('bikes.sub')}</p>
        </div>
        <div className="actions desk">
          <button type="button" className="btn primary" onClick={onAdd}>{t('nav.addGoal')}</button>
        </div>
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table className="bikes-table">
            <thead>
              <tr>
                <th>{t('bikes.bike')}</th>
                <th className="n">{t('home.saved')}</th>
                <th className="n">{t('goals.price')}</th>
                <th className="n">{t('overview.left')}</th>
                <th className="n">{t('stats.forecast')}</th>
                <th className="acts"><span className="visually-hidden">{t('deposits.actions')}</span></th>
              </tr>
            </thead>
            <tbody>
              {goals.map((goal) => {
                const s = statsFor(goal)
                return (
                  <tr key={goal.id}>
                    <td>
                      <div className="bike-cell">
                        <span className="thumb big"><GoalPhoto goal={goal} alt="" /></span>
                        <span className="grow">
                          <span>
                            <button type="button" className="link-plain" onClick={() => onOpen(goal.id)}>{goal.name}</button>{' '}
                            {goal.isDefault && <span className="pill">{t('goals.main')}</span>}{' '}
                            {goal.id === currentGoal?.id && <span className="pill">{t('bikes.shown')}</span>}
                          </span>
                          <span className="small muted num">
                            {t('bikes.line', { saved: formatMoneyShort(s.total), target: formatMoneyShort(s.target), pct: formatPercent(s.progress) })}
                          </span>
                          <span className="meter" aria-hidden="true"><span style={{ width: `${s.progress * 100}%` }} /></span>
                        </span>
                      </div>
                    </td>
                    <td className="n num fig">{formatMoneyShort(s.total)}</td>
                    <td className="n num fig">{formatMoneyShort(s.target)}</td>
                    <td className="n num fig">{s.isAchieved ? <span className="pill pos">{t('home.achieved')}</span> : formatMoneyShort(s.remaining)}</td>
                    <td className="n num fig">{s.forecastDate ? monthYear.format(s.forecastDate) : <span className="muted">—</span>}</td>
                    <td className="acts">
                      <span className="row-actions">
                        {!goal.isDefault && (
                          <button
                            type="button"
                            className="btn ghost sm"
                            onClick={async () => {
                              await setDefaultGoal(goal.id)
                              showToast(t('bikes.mainSet', { name: goal.name }))
                            }}
                          >
                            {t('goals.setDefault')}
                          </button>
                        )}
                        <button type="button" className="btn outline sm" onClick={() => onEdit(goal.id)}>{t('common.edit')}</button>
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="fineprint">{t('bikes.mainHint')}</p>
      </section>
    </div>
  )
}
