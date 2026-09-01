import { useCallback, useEffect, useRef, useState } from 'react'

interface TrackingState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

interface StatusSnapshot {
  status: string
  updatedAt: string
}

const TERMINAL_STATUSES = new Set(['DELIVERED', 'CANCELLED', 'SELF_PICKUP_COMPLETED'])

/**
 * Polls a cheap status-only endpoint (`statusLoader`) on an interval, and only re-fetches the full,
 * expensive resource (`fullLoader`) when that snapshot actually changed since the last tick (or on
 * the very first tick / an explicit `reload()`). Backing an order-tracking page with the full order
 * endpoint on every poll means paying for its customer/restaurant/coupon/items/rider joins even on
 * the (vast majority of) ticks where nothing changed — this keeps the frequent part of polling to a
 * single indexed lookup and only pays for the expensive query when there's actually something new
 * to show.
 *
 * Also pauses while the tab is hidden (Page Visibility API) and stops entirely once the last-known
 * status is terminal (`DELIVERED`/`CANCELLED`/`SELF_PICKUP_COMPLETED`).
 */
export function useOrderTracking<T extends { status: string } | undefined>(
  fullLoader: () => Promise<T>,
  statusLoader: () => Promise<StatusSnapshot | undefined>,
  deps: unknown[],
  intervalMs: number,
): TrackingState<T> & { reload: () => void } {
  const [state, setState] = useState<TrackingState<T>>({ data: null, isLoading: true, error: null })
  const fullLoaderRef = useRef(fullLoader)
  fullLoaderRef.current = fullLoader
  const statusLoaderRef = useRef(statusLoader)
  statusLoaderRef.current = statusLoader
  const lastSnapshotRef = useRef<StatusSnapshot | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const fetchFull = useCallback((showLoading: boolean) => {
    if (showLoading) setState((prev) => ({ ...prev, isLoading: true, error: null }))
    return fullLoaderRef
      .current()
      .then((data) => setState({ data: data ?? null, isLoading: false, error: null }))
      .catch((err) => setState({ data: null, isLoading: false, error: err?.message ?? 'Something went wrong' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    let cancelled = false

    async function tick(forceFull: boolean) {
      const snapshot = await statusLoaderRef.current().catch(() => undefined)
      if (cancelled) return
      if (!snapshot) {
        if (forceFull) await fetchFull(true)
        return
      }
      const changed =
        forceFull ||
        !lastSnapshotRef.current ||
        lastSnapshotRef.current.status !== snapshot.status ||
        lastSnapshotRef.current.updatedAt !== snapshot.updatedAt
      lastSnapshotRef.current = snapshot
      if (changed) await fetchFull(forceFull)
    }

    tick(true)
    const timer = setInterval(() => {
      const status = lastSnapshotRef.current?.status
      if (status && TERMINAL_STATUSES.has(status)) return
      if (document.visibilityState === 'visible') tick(false)
    }, intervalMs)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFull, reloadToken, intervalMs])

  return { ...state, reload: () => setReloadToken((t) => t + 1) }
}
