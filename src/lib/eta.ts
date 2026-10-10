import { useEffect, useState } from 'react'

/** Shown instead of a number once the buffered countdown has run out but the order isn't delivered yet. */
export const ARRIVING_SOON_SECONDS = 60

/**
 * The customer's delivery countdown, deliberately slowed down: the base ETA (T1 + T2 + T3, from when the order was
 * placed) counts down `slowdown` times slower than real time - with 1.5, 90 real seconds take one minute off. Minor
 * traffic or kitchen delays are absorbed instead of the ETA suddenly jumping. Never goes below "arriving soon".
 *
 * @returns remaining seconds to show, or null when there's no ETA for this order.
 */
export function bufferedRemainingSeconds(etaMinutes: number | null | undefined, placedAt: string, slowdown: number | null | undefined, now = Date.now()): number | null {
  if (!etaMinutes || etaMinutes <= 0) return null
  const placed = new Date(placedAt).getTime()
  if (Number.isNaN(placed)) return null
  const factor = slowdown && slowdown >= 1 ? slowdown : 1.5
  const elapsedSeconds = Math.max(0, (now - placed) / 1000)
  return Math.max(ARRIVING_SOON_SECONDS, Math.round(etaMinutes * 60 - elapsedSeconds / factor))
}

/** Ticks once a second. */
export function useBufferedEta(etaMinutes: number | null | undefined, placedAt: string | null | undefined, slowdown: number | null | undefined, active: boolean): number | null {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active])
  if (!active || !placedAt) return null
  return bufferedRemainingSeconds(etaMinutes, placedAt, slowdown, now)
}

export function formatEtaClock(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}
