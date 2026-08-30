import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { readStorage, writeStorage } from '@/lib/storage'

const FAVORITES_STORAGE_KEY = 'pureeats.favorites'

interface FavoritesContextValue {
  favoriteIds: number[]
  isFavorite: (restaurantId: number) => boolean
  toggleFavorite: (restaurantId: number) => void
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined)

/**
 * Favorites/wishlist has no backend endpoint yet (confirmed absent from
 * both the domain model and every controller) — this stays purely
 * localStorage-backed even in live mode until the backend adds one.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => readStorage<number[]>(FAVORITES_STORAGE_KEY, []))

  const toggleFavorite = useCallback((restaurantId: number) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(restaurantId) ? prev.filter((id) => id !== restaurantId) : [...prev, restaurantId]
      writeStorage(FAVORITES_STORAGE_KEY, next)
      return next
    })
  }, [])

  const isFavorite = useCallback((restaurantId: number) => favoriteIds.includes(restaurantId), [favoriteIds])

  const value = useMemo<FavoritesContextValue>(() => ({ favoriteIds, isFavorite, toggleFavorite }), [favoriteIds, isFavorite, toggleFavorite])

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}
