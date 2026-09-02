import { getOpenStatus } from '@/lib/restaurantHours'
import type { Restaurant } from '@/types/entities'

/**
 * Whether a restaurant can currently take an order — inactive/not-yet-accepted (admin-side flags)
 * or simply outside its posted hours. Drives the grayed-out treatment on restaurant cards
 * everywhere they render (RestaurantCard, used by Home/Search/category listing/Top Picks/Favorites)
 * and on its menu items (RestaurantDetailPage/MenuItemCard) — a customer shouldn't be able to add
 * an item from a restaurant that can't accept the order right now.
 */
export function isRestaurantOrderable(restaurant: Pick<Restaurant, 'isActive' | 'isAccepted' | 'openingTime' | 'closingTime'>): boolean {
  if (!restaurant.isActive || !restaurant.isAccepted) return false
  return getOpenStatus(restaurant.openingTime, restaurant.closingTime).isOpen
}
