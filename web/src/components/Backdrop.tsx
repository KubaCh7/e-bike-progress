import { useGoalPhoto } from './GoalPhoto'
import type { Goal } from '../lib/types'

/** Kolorowe, rozmyte tło + rozmyte zdjęcie celu – szkło ma co załamywać. */
export function Backdrop({ goal }: { goal: Goal | null }) {
  const photo = useGoalPhoto(goal?.photoURL ?? null)
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__blob" />
      <div className="backdrop__blob" />
      <div className="backdrop__blob" />
      <div className="backdrop__blob" />
      <div className="backdrop__blob" />
      {photo && <div className="backdrop__photo" style={{ backgroundImage: `url("${photo}")` }} />}
    </div>
  )
}
