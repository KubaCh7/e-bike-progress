import { useTranslation } from 'react-i18next'
import { setLanguage, type AppLanguage } from '../i18n'
import { Segmented } from './Segmented'

/** Przełącznik języka (PL / EN) – zmiana od razu, zapis w localStorage. */
export function LanguagePicker({ className = '' }: { className?: string }) {
  const { t, i18n } = useTranslation()
  return (
    <Segmented
      className={className}
      label={t('settings.language')}
      value={(i18n.language === 'en' ? 'en' : 'pl') as AppLanguage}
      onChange={setLanguage}
      options={[
        { value: 'pl', label: 'Polski' },
        { value: 'en', label: 'English' },
      ]}
    />
  )
}
