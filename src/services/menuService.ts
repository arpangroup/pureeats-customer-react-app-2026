import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { toNumber } from '@/lib/format'
import { IS_MOCK } from '@/config/env'
import { items } from '@/mocks/fixtures/items'
import { itemCategories } from '@/mocks/fixtures/itemCategories'
import { addonCategories } from '@/mocks/fixtures/addonCategories'
import { addons } from '@/mocks/fixtures/addons'
import { restaurants } from '@/mocks/fixtures/restaurants'
import type { Addon, AddonCategory, ItemCategory, MenuItem } from '@/types/entities'

export interface PopularItem extends MenuItem {
  restaurantName: string
}

export interface RecommendedItem extends MenuItem {
  restaurantName: string
  restaurantImage: string
}

interface LiveRecommendedItem {
  id: number
  restaurantId: number
  restaurantName: string
  restaurantImage: string
  itemCategoryId: number
  name: string
  price: string
  oldPrice: string | null
  image: string
  desc: string
  isVeg: boolean
}

function mapLiveRecommended(d: LiveRecommendedItem): RecommendedItem {
  return {
    id: d.id,
    restaurantId: d.restaurantId,
    restaurantName: d.restaurantName,
    restaurantImage: d.restaurantImage,
    itemCategoryId: d.itemCategoryId,
    name: d.name,
    description: d.desc,
    price: toNumber(d.price),
    oldPrice: d.oldPrice ? toNumber(d.oldPrice) : null,
    image: d.image,
    isVeg: d.isVeg,
    isRecommended: true,
    isPopular: false,
    isNew: false,
    isActive: true,
    addonCategoryIds: [],
  }
}

interface LiveItem {
  id: number
  restaurantId: number
  itemCategoryId: number
  name: string
  price: string
  oldPrice: string | null
  image: string
  desc: string
  isRecommended: boolean
  isPopular: boolean
  isNew: boolean
  isVeg: boolean
  isActive: boolean
}

function mapLiveItem(d: LiveItem): MenuItem {
  return {
    id: d.id,
    restaurantId: d.restaurantId,
    itemCategoryId: d.itemCategoryId,
    name: d.name,
    description: d.desc,
    price: toNumber(d.price),
    oldPrice: d.oldPrice ? toNumber(d.oldPrice) : null,
    image: d.image,
    isVeg: d.isVeg,
    isRecommended: d.isRecommended,
    isPopular: d.isPopular,
    isNew: d.isNew,
    isActive: d.isActive,
    // The backend has no confirmed customer-facing addon-fetch endpoint yet — live-mode items
    // simply carry no addons until one exists. See addonCategoriesForItem()'s live branch below.
    addonCategoryIds: [],
  }
}

export const menuService = {
  async itemsForRestaurant(restaurantId: number): Promise<MenuItem[]> {
    if (IS_MOCK) {
      await mockDelay()
      return items.filter((i) => i.restaurantId === restaurantId && i.isActive)
    }
    const { data } = await apiClient.get<{ data: LiveItem[] }>(`/restaurants/${restaurantId}/items`)
    return data.data.map(mapLiveItem)
  },

  async itemCategoriesForRestaurant(restaurantId: number): Promise<ItemCategory[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      return itemCategories.filter((c) => c.restaurantId === restaurantId && c.isEnabled)
    }
    // No confirmed plain customer-facing item-category listing endpoint — derive categories
    // client-side from the items response instead (itemsForRestaurant already carries itemCategoryId).
    return []
  },

  async addonCategoriesForItem(itemId: number): Promise<AddonCategory[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      return addonCategories.filter((c) => c.itemId === itemId)
    }
    // TODO(backend): no customer-facing per-item addon endpoint confirmed yet — degrade gracefully.
    return []
  },

  async addonsForCategory(addonCategoryId: number): Promise<Addon[]> {
    if (IS_MOCK) {
      await mockDelay(100)
      return addons.filter((a) => a.addonCategoryId === addonCategoryId && a.isActive)
    }
    return []
  },

  /** Convenience wrapper for the item-detail addon sheet — one call instead of chaining category → addons. */
  async addonGroupsForItem(itemId: number): Promise<{ category: AddonCategory; addons: Addon[] }[]> {
    const categories = await menuService.addonCategoriesForItem(itemId)
    return Promise.all(categories.map(async (category) => ({ category, addons: await menuService.addonsForCategory(category.id) })))
  },

  /** Trending dishes across every restaurant — powers the Search page's empty state. Mock-only: there's no cross-restaurant "popular items" endpoint on the backend. */
  async popularItems(limit = 8): Promise<PopularItem[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      return items
        .filter((i) => i.isActive && i.isPopular)
        .slice(0, limit)
        .map((i) => ({ ...i, restaurantName: restaurants.find((r) => r.id === i.restaurantId)?.name ?? 'Restaurant' }))
    }
    return []
  },

  /** Cross-restaurant recommended items — powers the Home page's "Recommended" section. */
  async recommendedItems(limit = 12): Promise<RecommendedItem[]> {
    if (IS_MOCK) {
      await mockDelay(200)
      return items
        .filter((i) => i.isActive && i.isRecommended)
        .slice(0, limit)
        .map((i) => {
          const restaurant = restaurants.find((r) => r.id === i.restaurantId)
          return { ...i, restaurantName: restaurant?.name ?? 'Restaurant', restaurantImage: restaurant?.image ?? '' }
        })
    }
    const { data } = await apiClient.get<{ data: LiveRecommendedItem[] }>('/items/recommended', { params: { limit } })
    return data.data.map(mapLiveRecommended)
  },

  /** Cross-restaurant dish name search — powers the Search page's "Dishes" tab, alongside restaurantService.search's restaurant-name search. */
  async search(query: string, limit = 20): Promise<RecommendedItem[]> {
    const q = query.trim().toLowerCase()
    if (!q) return []
    if (IS_MOCK) {
      await mockDelay()
      return items
        .filter((i) => i.isActive && i.name.toLowerCase().includes(q))
        .slice(0, limit)
        .map((i) => {
          const restaurant = restaurants.find((r) => r.id === i.restaurantId)
          return { ...i, restaurantName: restaurant?.name ?? 'Restaurant', restaurantImage: restaurant?.image ?? '' }
        })
    }
    const { data } = await apiClient.get<{ data: LiveRecommendedItem[] }>('/items/search', { params: { q: query, limit } })
    return data.data.map(mapLiveRecommended)
  },
}
