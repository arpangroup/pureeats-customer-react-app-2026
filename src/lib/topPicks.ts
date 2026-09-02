import type { Restaurant } from '@/types/entities'

/**
 * No dedicated "top picks" backend endpoint — an explicit `isFeatured` flag wins when a backend
 * sets it (matches the demo seed data), otherwise this falls back to the highest-rated restaurants
 * from the regular listing already on hand, so the Home page's slider (and the "See all" page) always
 * has something to show without an extra request. Shared by HomePage and TopPicksPage so both agree
 * on the same set.
 */
export function selectTopPicks(restaurants: Restaurant[], limit = 8): Restaurant[] {
  if (restaurants.length === 0) return []
  const featured = restaurants.filter((r) => r.isFeatured)
  const source = featured.length > 0 ? featured : [...restaurants].sort((a, b) => b.rating - a.rating)
  return source.slice(0, limit)
}
