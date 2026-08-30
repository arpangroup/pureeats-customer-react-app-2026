import { useCallback, useEffect, useRef, useState } from 'react'

interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

/** Runs an async loader on mount and whenever `deps` change, tracking loading/error state — works identically against mock or live services since they expose the same promise shape either way. */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, isLoading: true, error: null })
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const [reloadToken, setReloadToken] = useState(0)

  const run = useCallback(() => {
    let cancelled = false
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    loaderRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, isLoading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, isLoading: false, error: err?.message ?? 'Something went wrong' })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => run(), [run, reloadToken])

  return { ...state, reload: () => setReloadToken((t) => t + 1) }
}
