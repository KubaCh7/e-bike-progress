import { useEffect, useState } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'
const KEY = 'appTheme'

function read(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

/** Ustawia data-theme na <html> (brak atrybutu = motyw systemowy). */
export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'system') delete root.dataset.theme
  else root.dataset.theme = mode
  const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#000000' : '#f8f8f8')
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(read)

  useEffect(() => {
    applyTheme(mode)
    try {
      localStorage.setItem(KEY, mode)
    } catch {
      /* ignoruj */
    }
    if (mode !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mode])

  return [mode, setMode] as const
}

applyTheme(read())

/** true, gdy aktywny jest ciemny motyw (atrybut data-theme albo ustawienie systemu). */
export function useIsDark() {
  const check = () => {
    const forced = document.documentElement.dataset.theme
    return forced ? forced === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  const [dark, setDark] = useState(check)
  useEffect(() => {
    const update = () => setDark(check())
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', update)
    return () => {
      observer.disconnect()
      media.removeEventListener('change', update)
    }
  }, [])
  return dark
}
