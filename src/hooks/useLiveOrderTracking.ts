import { useEffect, useRef, useState } from 'react'
import { orderService } from '@/services/orderService'
import { ACTIVE_STATUSES, RIDER_ON_THE_WAY_STATUSES } from '@/lib/orderStatus'
import type { OrderStatus, OrderTracking } from '@/types/entities'

/** Rider on the order: refresh their position often. Otherwise (still at the restaurant) just occasionally, to pick up coordinates/assignment. */
const RIDER_POLL_MS = 8000
const IDLE_POLL_MS = 30000

/**
 * Polls GET /orders/{id}/tracking for the live map - fast while a rider is out on the order, slow
 * before that, and not at all once it's finished. Pauses while the tab is hidden and refreshes
 * immediately when the customer comes back to it.
 */
export function useLiveOrderTracking(userId: number | undefined, orderId: number, status: OrderStatus | undefined) {
  const [tracking, setTracking] = useState<OrderTracking | null>(null)
  const inFlight = useRef(false)
  const active = !!userId && !!status && ACTIVE_STATUSES.includes(status)
  const riderOut = !!status && RIDER_ON_THE_WAY_STATUSES.includes(status)

  useEffect(() => {
    if (!active || !userId) return
    let cancelled = false
    const load = async () => {
      if (inFlight.current || document.visibilityState !== 'visible') return
      inFlight.current = true
      try {
        const t = await orderService.tracking(userId, orderId)
        if (!cancelled && t) setTracking(t)
      } catch {
        // transient - the map keeps its last state and the next tick retries
      } finally {
        inFlight.current = false
      }
    }
    load()
    const id = window.setInterval(load, riderOut ? RIDER_POLL_MS : IDLE_POLL_MS)
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [active, riderOut, userId, orderId, status])

  return tracking
}
