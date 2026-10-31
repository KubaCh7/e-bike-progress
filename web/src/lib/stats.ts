// Statystyki celu – ta sama logika co w ios/Shared/Stats/SavingsStats.swift.
import type { Deposit } from './types'
import { parseDay, toDay } from './format'

export interface SavingsStats {
  target: number
  total: number
  remaining: number
  /** 0…1 */
  progress: number
  count: number
  average: number | null
  thisMonth: number
  /** zł / dzień */
  dailyRate: number | null
  forecastDate: Date | null
  isAchieved: boolean
}

/** Minimalne okno do liczenia tempa (chroni przed absurdalną prognozą po jednej wpłacie). */
export const MIN_WINDOW_DAYS = 30
const DAY_MS = 86_400_000

const cents = (v: number) => Math.round(v * 100)

export function computeStats(target: number, deposits: Deposit[], now = new Date()): SavingsStats {
  const totalCents = deposits.reduce((sum, d) => sum + cents(d.amount), 0)
  const total = totalCents / 100
  const remaining = Math.max(target - total, 0)
  const progress = target > 0 ? Math.min(Math.max(total / target, 0), 1) : 0
  // średnia i liczba liczą tylko wpłaty (bez wypłat)
  const incoming = deposits.filter((d) => d.amount > 0)
  const count = incoming.length
  const average = count ? Math.round(incoming.reduce((s, d) => s + cents(d.amount), 0) / count) / 100 : null

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonth =
    deposits.filter((d) => parseDay(d.date) >= monthStart).reduce((sum, d) => sum + cents(d.amount), 0) / 100

  let dailyRate: number | null = null
  let forecastDate: Date | null = null
  if (deposits.length && total > 0) {
    const first = deposits.map((d) => parseDay(d.date).getTime()).reduce((a, b) => Math.min(a, b))
    const todayStart = parseDay(toDay(now)).getTime()
    const days = Math.round((todayStart - first) / DAY_MS) + 1
    const rate = total / Math.max(days, MIN_WINDOW_DAYS)
    dailyRate = Math.round(rate * 100) / 100
    if (total < target) {
      const daysLeft = Math.min(Math.ceil((target - total) / rate), 36_500)
      forecastDate = new Date(todayStart + daysLeft * DAY_MS)
    }
  }

  return { target, total, remaining, progress, count, average, thisMonth, dailyRate, forecastDate, isAchieved: target > 0 && total >= target }
}

export interface ChartPoint {
  date: string
  time: number
  value: number
}

/** Suma narastająco – punkt na każdy dzień z wpłatą. */
export function cumulativeSeries(deposits: Deposit[]): ChartPoint[] {
  const byDay = new Map<string, number>()
  for (const d of deposits) byDay.set(d.date, (byDay.get(d.date) ?? 0) + cents(d.amount))
  let running = 0
  return [...byDay.keys()].sort().map((day) => {
    running += byDay.get(day) ?? 0
    return { date: day, time: parseDay(day).getTime(), value: running / 100 }
  })
}

/** Suma w miesiącach (z pustymi miesiącami pomiędzy). */
export function monthlyTotals(deposits: Deposit[]): ChartPoint[] {
  if (!deposits.length) return []
  const byMonth = new Map<string, number>()
  for (const d of deposits) {
    const key = d.date.slice(0, 7)
    byMonth.set(key, (byMonth.get(key) ?? 0) + cents(d.amount))
  }
  const keys = [...byMonth.keys()].sort()
  const [fy, fm] = keys[0].split('-').map(Number)
  const [ly, lm] = keys[keys.length - 1].split('-').map(Number)
  const result: ChartPoint[] = []
  for (let y = fy, m = fm; y < ly || (y === ly && m <= lm); m === 12 ? ((m = 1), y++) : m++) {
    const key = `${y}-${String(m).padStart(2, '0')}`
    result.push({ date: `${key}-01`, time: new Date(y, m - 1, 1).getTime(), value: (byMonth.get(key) ?? 0) / 100 })
  }
  return result
}
