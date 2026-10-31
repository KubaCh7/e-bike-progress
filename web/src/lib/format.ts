// Formatowanie w polskim formacie – waluta zawsze PLN: "12 500,00 zł".

const money = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: 'always',
} as Intl.NumberFormatOptions)

const moneyShort = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  maximumFractionDigits: 0,
  useGrouping: 'always',
} as Intl.NumberFormatOptions)

const number2 = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: 'always',
} as Intl.NumberFormatOptions)

export const formatMoney = (value: number) => money.format(value)
export const formatMoneyShort = (value: number) => moneyShort.format(value)
export const formatNumber = (value: number) => number2.format(value)

export const formatPercent = (progress: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'percent', maximumFractionDigits: 0 }).format(progress)

/** Parsuje "12 500,50", "12500.5", "1 000 zł". Zwraca null dla błędnych danych. */
export function parseAmount(text: string): number | null {
  let cleaned = text.replace(/zł|pln/gi, '').replace(/[\s  ]/g, '')
  if (cleaned.includes(',') && cleaned.includes('.')) cleaned = cleaned.replace(/\./g, '')
  cleaned = cleaned.replace(',', '.')
  if (!cleaned || !/^\d+(\.\d+)?$/.test(cleaned)) return null
  return Math.round(parseFloat(cleaned) * 100) / 100
}

export const localeFor = (lang: string) => (lang === 'en' ? 'en-GB' : 'pl-PL')

export function formatDate(iso: string, lang: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Intl.DateTimeFormat(localeFor(lang), opts).format(parseDay(iso))
}

/** "yyyy-mm-dd" → Date (lokalna północ). */
export function parseDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** Date → "yyyy-mm-dd" w lokalnej strefie. */
export function toDay(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const today = () => toDay(new Date())
