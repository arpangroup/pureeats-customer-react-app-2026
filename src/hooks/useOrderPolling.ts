import { useCallback, useEffect, useRef, useState } from 'react'

interface PollingState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

const TERMINAL_STATUSES = new Set(['DELIVERED', 'CANCELLED', 'SELF_PICKUP_COMPLETED'])

/**
 * Like useAsync, but re-runs `loader` on an interval so order status reflects backend changes
 * (restaurant accepting, rider assignment, delivery) without a manual reload. Pauses while the tab
 * is hidden (Page Visibility API) so backgrounded tabs don't burn requests, and stops entirely once
 * the loaded order reaches a terminal status.
 */
export function useOrderPolling<T extends { status: string } | undefined>(
  loader: () => Promise<T>,
  deps: unknown[],
  intervalMs: number,
): PollingState<T> & { reload: () => void } {
  const [state, setState] = useState<PollingState<T>>({ data: null, isLoading: true, error: null })
  const loaderRef = useRef(loader)
  loaderRef.current = loader
  const statusRef = useRef<string | undefined>(undefined)
  const [reloadToken, setReloadToken] = useState(0)

  const fetchOnce = useCallback((showLoading: boolean) => {
    if (showLoading) setState((prev) => ({ ...prev, isLoading: true, error: null }))
    return loaderRef
      .current()
      .then((data) => {
        statusRef.current = data?.status
        setState({ data: data ?? null, isLoading: false, error: null })
      })
      .catch((err) => setState({ data: null, isLoading: false, error: err?.message ?? 'Something went wrong' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    fetchOnce(true)
    const timer = setInterval(() => {
      const status = statusRef.current
      if (status && TERMINAL_STATUSES.has(status)) return
      if (document.visibilityState === 'visible') fetchOnce(false)
    }, intervalMs)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOnce, reloadToken, intervalMs])

  return { ...state, reload: () => setReloadToken((t) => t + 1) }
}
