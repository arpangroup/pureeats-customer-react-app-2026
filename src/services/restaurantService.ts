import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { toNumber } from '@/lib/format'
import { placeholderImage } from '@/lib/placeholderImage'
import { IS_MOCK } from '@/config/env'
import { restaurants } from '@/mocks/fixtures/restaurants'
import { restaurantCategories } from '@/mocks/fixtures/restaurantCategories'
import type { Restaurant, RestaurantCategory, RestaurantDeliveryType, RestaurantOpenStatus } from '@/types/entities'

// The live /restaurant-categories endpoint doesn't return an image yet — fall back to a
// placeholder built client-side, same as mock mode. Known cuisine names get the same
// emoji/colors the mock fixtures use; anything else gets a deterministic pick from a
// varied palette so unrelated categories don't all look identical.
const CATEGORY_ICONS: Record<string, [emoji: string, from: string, to: string]> = {
  'north indian': ['🍛', '#fb923c', '#e04a1a'],
  'south indian': ['🥞', '#fbbf24', '#d97706'],
  pizza: ['🍕', '#f87171', '#b91c1c'],
  chinese: ['🥡', '#fb7185', '#be123c'],
  biryani: ['🍚', '#fbbf24', '#b45309'],
  desserts: ['🍰', '#f0abfc', '#a21caf'],
  healthy: ['🥗', '#86efac', '#15803d'],
  'fast food': ['🍔', '#fdba74', '#c2410c'],
}

const FALLBACK_CATEGORY_ICONS: [emoji: string, from: string, to: string][] = [
  ['🍜', '#93c5fd', '#1d4ed8'],
  ['🍣', '#5eead4', '#0f766e'],
  ['🌮', '#fde68a', '#b45309'],
  ['🥘', '#fca5a5', '#b91c1c'],
  ['🍱', '#c4b5fd', '#6d28d9'],
  ['🥙', '#fdba74', '#c2410c'],
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0
  return Math.abs(hash)
}

function defaultCategoryImage(name: string): string {
  const known = CATEGORY_ICONS[name.trim().toLowerCase()]
  const [emoji, from, to] = known ?? FALLBACK_CATEGORY_ICONS[hashString(name) % FALLBACK_CATEGORY_ICONS.length]
  return placeholderImage(emoji, from, to)
}

interface LiveRestaurantSummary {
  id: number
  name: string
  slug: string
  image: string
  rating: string
  deliveryTime: string
  priceRange: string
  isPureveg: boolean
  isActive: boolean
  isAccepted: boolean
  minOrderPrice: string
  deliveryCharges: string
  // Carried on the summary too (not just the detail response) so card grids — Home, Search,
  // category listing, Top Picks — can gray out a closed restaurant without a per-card detail fetch.
  openingTime: string
  closingTime: string
  isFeatured: boolean
  openStatus: RestaurantOpenStatus
}

interface LiveRestaurantDetail extends LiveRestaurantSummary {
  description: string
  contactNumber: string
  address: string
  pincode: string
  landmark: string
  certificate: string | null
  latitude: string
  longitude: string
  deliveryRadius: string
  deliveryType: RestaurantDeliveryType
  isSchedulable: boolean
  isAcceptCod: boolean
}

function mapLive(d: LiveRestaurantSummary | LiveRestaurantDetail): Restaurant {
  const detail = d as Partial<LiveRestaurantDetail>
  return {
    id: d.id,
    name: d.name,
    slug: d.slug,
    description: detail.description ?? '',
    image: d.image,
    coverImage: d.image,
    contactNumber: detail.contactNumber ?? '',
    rating: toNumber(d.rating),
    ratingCount: 0,
    deliveryTimeMinutes: toNumber(d.deliveryTime),
    priceRange: toNumber(d.priceRange, 1),
    isPureveg: d.isPureveg,
    address: detail.address ?? '',
    pincode: detail.pincode ?? '',
    landmark: detail.landmark ?? '',
    latitude: toNumber(detail.latitude),
    longitude: toNumber(detail.longitude),
    distanceKm: 0,
    deliveryCharge: toNumber(d.deliveryCharges),
    minOrderAmount: toNumber(d.minOrderPrice),
    deliveryRadiusKm: toNumber(detail.deliveryRadius),
    deliveryType: detail.deliveryType ?? 'delivery',
    isSchedulable: detail.isSchedulable ?? false,
    isActive: d.isActive,
    isAccepted: d.isAccepted,
    isFeatured: d.isFeatured,
    isAcceptCod: detail.isAcceptCod ?? true,
    openingTime: d.openingTime ?? '00:00',
    closingTime: d.closingTime ?? '23:59',
    certificate: detail.certificate ?? null,
    categoryIds: [],
    openStatus: d.openStatus,
  }
}

// Module-level cache for list() — the full restaurant listing is fetched identically by HomePage,
// SearchPage's empty-query state, and TopPicksPage (each computing their own "top picks" selection
// client-side from it, see lib/topPicks.ts). Whichever of those mounts first pays for the request;
// everyone else in the same session reuses that promise instead of re-fetching, so e.g. navigating
// Home -> Search never fires a second /restaurants call. Cleared on failure so the next caller
// retries rather than getting stuck on a rejected promise for the rest of the session.
let listCache: Promise<Restaurant[]> | null = null

export const restaurantService = {
  async list(): Promise<Restaurant[]> {
    if (!listCache) {
      listCache = (async () => {
        if (IS_MOCK) {
          await mockDelay()
          return restaurants.filter((r) => r.isActive && r.isAccepted)
        }
        const { data } = await apiClient.get<{ data: LiveRestaurantSummary[] }>('/restaurants')
        return data.data.map(mapLive)
      })()
      listCache.catch(() => {
        listCache = null
      })
    }
    return listCache
  },

  async search(query: string): Promise<Restaurant[]> {
    if (IS_MOCK) {
      await mockDelay()
      const q = query.trim().toLowerCase()
      if (!q) return []
      return restaurants.filter((r) => r.isActive && (r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)))
    }
    const { data } = await apiClient.get<{ data: LiveRestaurantSummary[] }>('/restaurants/search', { params: { q: query } })
    return data.data.map(mapLive)
  },

  async byCategory(categoryId: number): Promise<Restaurant[]> {
    if (IS_MOCK) {
      await mockDelay()
      return restaurants.filter((r) => r.isActive && r.categoryIds.includes(categoryId))
    }
    const { data } = await apiClient.get<{ data: LiveRestaurantSummary[] }>(`/restaurant-categories/${categoryId}/restaurants`)
    return data.data.map(mapLive)
  },

  async get(id: number): Promise<Restaurant | undefined> {
    if (IS_MOCK) {
      await mockDelay()
      return restaurants.find((r) => r.id === id)
    }
    const { data } = await apiClient.get<{ data: LiveRestaurantDetail }>(`/restaurants/${id}`)
    return mapLive(data.data)
  },

  async categories(): Promise<RestaurantCategory[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      return restaurantCategories.filter((c) => c.isActive)
    }
    const { data } = await apiClient.get<{ data: RestaurantCategory[] }>('/restaurant-categories')
    return data.data.map((c) => ({ ...c, image: c.image || defaultCategoryImage(c.name) }))
  },
}
