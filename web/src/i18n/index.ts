import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import pl from './pl.json'
import en from './en.json'

export type AppLanguage = 'pl' | 'en'
export const LANGUAGE_KEY = 'appLanguage'

function storedLanguage(): AppLanguage {
  try {
    const value = localStorage.getItem(LANGUAGE_KEY)
    return value === 'en' ? 'en' : 'pl'
  } catch {
    return 'pl'
  }
}

void i18n.use(initReactI18next).init({
  resources: { pl: { translation: pl }, en: { translation: en } },
  lng: storedLanguage(),
  fallbackLng: 'pl',
  // klucze są płaskie ("settings.theme.dark"), więc bez separatora
  keySeparator: false,
  interpolation: { escapeValue: false },
})

document.documentElement.lang = i18n.language

/** Zmiana języka od razu, bez przeładowania; wybór zapisany w localStorage. */
export function setLanguage(lang: AppLanguage) {
  void i18n.changeLanguage(lang)
  document.documentElement.lang = lang
  try {
    localStorage.setItem(LANGUAGE_KEY, lang)
  } catch {
    /* tryb prywatny – trudno */
  }
}

export default i18n
