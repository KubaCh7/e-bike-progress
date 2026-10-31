// Kolor marki na danych: przyciemniony (jasny motyw) albo rozjaśniony (ciemny), aż ma ≥ 3:1 względem powierzchni.

type RGB = [number, number, number]

const hex = (c: string): RGB | null => {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const toHex = ([r, g, b]: RGB) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
const lum = ([r, g, b]: RGB) => {
  const f = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const contrast = (a: RGB, b: RGB) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

export const FALLBACK_HUE = '#1d5fbf'

/** Kolor danych dla marki: czytelny na białym (#fff) lub ciemnym (#111) tle. */
export function dataHue(color: string | null | undefined, dark: boolean): string {
  const base = hex(color ?? '') ?? hex(FALLBACK_HUE)!
  const surface: RGB = dark ? [17, 17, 17] : [255, 255, 255]
  const toward: RGB = dark ? [255, 255, 255] : [0, 0, 0]
  let c = base
  for (let i = 0; i < 20 && contrast(c, surface) < 3.2; i++) c = mix(base, toward, (i + 1) * 0.05)
  return toHex(c)
}
