import type { BikeCategory } from '../lib/types'

/**
 * Płaska ilustracja e-bike'a (gdy nie ma zdjęcia): sama sylwetka liniowa w kolorze tekstu,
 * bez poświaty i gradientów.
 */
export function BikeArt({ category, label }: { category: BikeCategory; color?: string; label?: string }) {
  return (
    <svg className="bike-art" viewBox="0 0 400 260" role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
      <g className="bike-art__lines" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {category === 'moto' ? <Moto /> : category === 'emtb' ? <Mtb /> : <City />}
      </g>
    </svg>
  )
}

/* elektryczny cross / enduro (Sur-Ron, Talaria, E-Ride, Falcon…) */
const Moto = () => (
  <>
    <circle cx="108" cy="186" r="44" strokeWidth="11" strokeDasharray="6 3.5" />
    <circle cx="296" cy="186" r="44" strokeWidth="11" strokeDasharray="6 3.5" />
    <circle cx="108" cy="186" r="28" strokeWidth="2.5" />
    <circle cx="296" cy="186" r="28" strokeWidth="2.5" />
    <path d="M108 186 L196 158" strokeWidth="8" />
    <path d="M150 170 L178 120" strokeWidth="4" />
    <path d="M296 186 L258 82" strokeWidth="8" />
    <path d="M258 82 L256 64 M238 62 L276 58" strokeWidth="6" />
    <path d="M266 122 Q296 112 322 128" strokeWidth="6" />
    <path d="M96 110 L132 102 L222 96" strokeWidth="11" />
    <path className="bike-art__fill" d="M180 106 L246 100 L236 158 L194 162 Z" strokeWidth="3" />
    <path className="bike-art__bolt" d="M214 114 l-11 18 h12 l-7 15 l19 -22 h-12 l7 -11z" />
  </>
)

/* elektryczny rower górski z pełnym zawieszeniem */
const Mtb = () => (
  <>
    <circle cx="110" cy="184" r="46" strokeWidth="6" />
    <circle cx="292" cy="184" r="46" strokeWidth="6" />
    <circle cx="110" cy="184" r="40" strokeWidth="2" strokeDasharray="2 5" />
    <circle cx="292" cy="184" r="40" strokeWidth="2" strokeDasharray="2 5" />
    <path d="M110 184 L178 122 L262 114 L292 184" strokeWidth="7" />
    <path d="M178 122 L205 184 L110 184" strokeWidth="6" />
    <path d="M262 114 L250 84 L282 78" strokeWidth="6" />
    <path d="M178 122 L170 94 M154 94 L190 94" strokeWidth="6" />
    <path className="bike-art__fill" d="M190 128 L246 120 L232 152 L200 156 Z" strokeWidth="3" />
    <path className="bike-art__bolt" d="M220 126 l-8 13 h9 l-5 11 l14 -16 h-9 l5 -8z" />
  </>
)

/* miejski / cruiser */
const City = () => (
  <>
    <circle cx="112" cy="186" r="44" strokeWidth="7" />
    <circle cx="292" cy="186" r="44" strokeWidth="7" />
    <path d="M112 186 L170 132 L250 132 L292 186" strokeWidth="7" />
    <path d="M170 132 L200 186 L112 186" strokeWidth="6" />
    <path d="M250 132 L258 94 L238 88" strokeWidth="6" />
    <path d="M160 114 L202 114" strokeWidth="10" />
    <path className="bike-art__fill" d="M180 136 L238 136 L232 154 L188 154 Z" strokeWidth="3" />
    <path className="bike-art__bolt" d="M212 138 l-6 8 h7 l-4 7 l11 -10 h-7 l4 -5z" />
  </>
)
