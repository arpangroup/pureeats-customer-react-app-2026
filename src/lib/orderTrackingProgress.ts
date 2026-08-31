import { useEffect, useState } from 'react'
import type { OrderStatus } from '@/types/entities'

export interface LatLng {
  lat: number
  lng: number
}

export function lerp(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }
}

/**
 * Eases a simulated rider marker along the restaurant→destination route once picked up — purely
 * cosmetic (no real GPS feed), shared by the Google and OpenStreetMap tracking maps so both
 * backends animate identically.
 */
export function useRiderProgress(status: OrderStatus): number {
  const [progress, setProgress] = useState(status === 'PICKED_UP' ? 0.15 : status === 'DELIVERED' || status === 'SELF_PICKUP_COMPLETED' ? 1 : 0)

  useEffect(() => {
    if (status !== 'PICKED_UP') return
    const interval = setInterval(() => setProgress((p) => Math.min(0.95, p + 0.05)), 2000)
    return () => clearInterval(interval)
  }, [status])

  return progress
}
