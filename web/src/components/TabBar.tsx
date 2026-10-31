import { useTranslation } from 'react-i18next'
import { Segmented } from './Segmented'
import { ChartIcon, GearIcon, HomeIcon, ListIcon } from './Icons'

export type Tab = 'home' | 'history' | 'stats' | 'settings'

/** Pływający szklany dock z voltową pastylką (zawsze na dole, jak w iOS 26). */
export function TabBar({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const { t } = useTranslation()
  return (
    <nav className="dock-wrap">
      <Segmented
        tabs
        className="dock glass--clear"
        label={t('nav.tabs')}
        value={tab}
        onChange={onChange}
        options={[
          { value: 'home', label: t('tab.home'), icon: <HomeIcon size={21} /> },
          { value: 'history', label: t('tab.history'), icon: <ListIcon size={21} /> },
          { value: 'stats', label: t('tab.stats'), icon: <ChartIcon size={21} /> },
          { value: 'settings', label: t('tab.settings'), icon: <GearIcon size={21} /> },
        ]}
      />
    </nav>
  )
}
