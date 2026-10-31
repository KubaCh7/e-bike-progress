import { useGoalPhoto } from './GoalPhoto'
import type { Goal } from '../lib/types'

/** Tapeta: miękkie kolorowe plamy + mocno rozmyte zdjęcie celu. */
export function Wallpaper({ goal }: { goal?: Goal | null }) {
  const photo = useGoalPhoto(goal?.photoURL ?? null)
  return (
    <div className="wallpaper" aria-hidden="true">
      {photo && <div className="wallpaper__photo" style={{ backgroundImage: `url("${photo}")` }} />}
    </div>
  )
}

/** Tapeta bez danych (ekran logowania). */
export function PlainWallpaper() {
  return <div className="wallpaper" aria-hidden="true" />
}
