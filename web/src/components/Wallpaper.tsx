import { useGoalPhoto } from './GoalPhoto'
import type { Goal } from '../lib/types'

/** Tło: aurora, siatka "toru", ziarno i bardzo rozmyte zdjęcie celu. */
export function Wallpaper({ goal }: { goal?: Goal | null }) {
  const photo = useGoalPhoto(goal?.photoURL ?? null)
  return (
    <div className="wallpaper" aria-hidden="true">
      {photo && <div className="wallpaper__photo" style={{ backgroundImage: `url("${photo}")` }} />}
      <div className="wallpaper__grid" />
    </div>
  )
}

/** Tło bez danych (logowanie, powitanie). */
export function PlainWallpaper() {
  return (
    <div className="wallpaper" aria-hidden="true">
      <div className="wallpaper__grid" />
    </div>
  )
}
