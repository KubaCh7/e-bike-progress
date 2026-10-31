import { useTranslation } from 'react-i18next'
import { Segmented } from './Segmented'
import { ChartIcon, GearIcon, HomeIcon, ListIcon } from './Icons'

export type Tab = 'home' | 'history' | 'stats' | 'settings'

/** Pływający szklany pasek zakładek z przesuwaną pastylką (na dole na telefonie, u góry na komputerze). */
export function TabBar({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const { t } = useTranslation()
  return (
    <nav className="tabbar-wrap">
      <Segmented
        tabs
        className="tabbar glass--clear"
        label={t('nav.tabs')}
        value={tab}
        onChange={onChange}
        options={[
          { value: 'home', label: t('tab.home'), icon: <HomeIcon size={22} /> },
          { value: 'history', label: t('tab.history'), icon: <ListIcon size={22} /> },
          { value: 'stats', label: t('tab.stats'), icon: <ChartIcon size={22} /> },
          { value: 'settings', label: t('tab.settings'), icon: <GearIcon size={22} /> },
        ]}
      />
    </nav>
  )
}
