import type { BikeCategory } from '../lib/types'

/**
 * Ilustracja e-bike'a (bez pobierania zdjęć z internetu): sylwetka zależna
 * od kategorii, w kolorze marki. Użytkownik może podmienić ją na własne zdjęcie.
 */
export function BikeArt({ category, color, label }: { category: BikeCategory; color: string; label?: string }) {
  const id = `g-${color.replace('#', '')}-${category}`
  return (
    <svg className="bike-art" viewBox="0 0 400 260" role="img" aria-label={label} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.95" />
          <stop offset="1" stopColor={color} stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.3" cy="0.2" r="0.9">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="260" fill={`url(#${id})`} />
      <rect width="400" height="260" fill={`url(#${id}-glow)`} />
      <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">
        {category === 'moto' ? <Moto /> : category === 'emtb' ? <Mtb /> : <City />}
      </g>
    </svg>
  )
}

/* elektryczny cross / enduro (Sur-Ron, Talaria, E-Ride…) */
const Moto = () => (
  <>
    {/* opony z klockami i felgi */}
    <circle cx="108" cy="186" r="46" strokeWidth="14" strokeDasharray="7 4" />
    <circle cx="296" cy="186" r="46" strokeWidth="14" strokeDasharray="7 4" />
    <circle cx="108" cy="186" r="30" strokeWidth="3" strokeOpacity="0.7" />
    <circle cx="296" cy="186" r="30" strokeWidth="3" strokeOpacity="0.7" />
    {/* wahacz i amortyzator */}
    <path d="M108 186 L196 158" strokeWidth="10" />
    <path d="M150 170 L178 118" strokeWidth="6" strokeOpacity="0.8" />
    {/* widelec, kierownica, błotnik */}
    <path d="M296 186 L258 82" strokeWidth="10" />
    <path d="M258 82 L256 62 M238 60 L276 56" strokeWidth="7" />
    <path d="M266 122 Q296 112 322 128" strokeWidth="8" />
    {/* siedzisko z ogonem */}
    <path d="M96 108 L132 100 L222 94" strokeWidth="14" />
    {/* rama z baterią */}
    <path d="M180 104 L246 98 L236 158 L194 162 Z" fill="#fff" fillOpacity="0.9" strokeWidth="4" />
    <path d="M214 112 l-11 18 h12 l-7 15 l19 -22 h-12 l7 -11z" fill="#0005" stroke="none" />
    <circle cx="200" cy="168" r="9" fill="#fff" stroke="none" />
  </>
)

/* elektryczny rower górski z pełnym zawieszeniem */
const Mtb = () => (
  <>
    <circle cx="110" cy="182" r="48" strokeWidth="8" />
    <circle cx="292" cy="182" r="48" strokeWidth="8" />
    <path d="M110 182 L178 120 L262 112 L292 182" strokeWidth="8" />
    <path d="M178 120 L205 182 L110 182" strokeWidth="7" />
    <path d="M262 112 L250 82 L280 76" strokeWidth="7" />
    <path d="M178 120 L170 92 M155 92 L190 92" strokeWidth="7" />
    <path d="M190 126 L246 118 L232 150 L200 154 Z" fill="#fff" fillOpacity="0.85" stroke="none" />
  </>
)

/* miejski / cruiser */
const City = () => (
  <>
    <circle cx="112" cy="184" r="46" strokeWidth="8" />
    <circle cx="292" cy="184" r="46" strokeWidth="8" />
    <path d="M112 184 L170 130 L250 130 L292 184" strokeWidth="8" />
    <path d="M170 130 L200 184 L112 184" strokeWidth="7" />
    <path d="M250 130 L258 92 L240 86" strokeWidth="7" />
    <path d="M165 112 L200 112" strokeWidth="10" />
    <path d="M178 140 L236 140" strokeWidth="12" strokeOpacity="0.85" />
  </>
)
