import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { toNumber } from '@/lib/format'
import { IS_MOCK } from '@/config/env'
import { restaurants } from '@/mocks/fixtures/restaurants'
import { restaurantCategories } from '@/mocks/fixtures/restaurantCategories'
import type { Restaurant, RestaurantCategory, RestaurantDeliveryType } from '@/types/entities'

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
}

interface LiveRestaurantDetail extends LiveRestaurantSummary {
  description: string
  contactNumber: string
  openingTime: string
  closingTime: string
  address: string
  pincode: string
  landmark: string
  certificate: string | null
  latitude: string
  longitude: string
  deliveryRadius: string
  deliveryType: RestaurantDeliveryType
  isSchedulable: boolean
  isFeatured: boolean
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
    isFeatured: detail.isFeatured ?? false,
    isAcceptCod: detail.isAcceptCod ?? true,
    openingTime: detail.openingTime ?? '00:00',
    closingTime: detail.closingTime ?? '23:59',
    certificate: detail.certificate ?? null,
    categoryIds: [],
  }
}

export const restaurantService = {
  async list(): Promise<Restaurant[]> {
    if (IS_MOCK) {
      await mockDelay()
      return restaurants.filter((r) => r.isActive && r.isAccepted)
    }
    const { data } = await apiClient.get<{ data: LiveRestaurantSummary[] }>('/restaurants')
    return data.data.map(mapLive)
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
    return data.data
  },
}
