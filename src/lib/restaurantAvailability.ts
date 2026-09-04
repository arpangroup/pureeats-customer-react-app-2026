import { describeOpenStatus, getOpenStatus } from '@/lib/restaurantHours'
import type { Restaurant } from '@/types/entities'

export interface RestaurantAvailability {
  orderable: boolean
  isOpen: boolean
  isClosingSoon: boolean
  label: string
}

type AvailabilityInput = Pick<Restaurant, 'isActive' | 'isAccepted' | 'openingTime' | 'closingTime' | 'openStatus'>

/**
 * The single place that turns a restaurant's raw flags/hours into "can it take an order right now"
 * plus display text. Prefers the server-computed, day-aware openStatus (live API); falls back to
 * the legacy client-side single-window check only for mock fixtures, which don't carry openStatus.
 */
export function getAvailability(restaurant: AvailabilityInput): RestaurantAvailability {
  if (!restaurant.isActive || !restaurant.isAccepted) {
    return { orderable: false, isOpen: false, isClosingSoon: false, label: 'Currently unavailable' }
  }
  if (restaurant.openStatus) {
    const { isOpen, isClosingSoon, label } = describeOpenStatus(restaurant.openStatus)
    return { orderable: isOpen, isOpen, isClosingSoon, label }
  }
  const legacy = getOpenStatus(restaurant.openingTime, restaurant.closingTime)
  return {
    orderable: legacy.isOpen,
    isOpen: legacy.isOpen,
    isClosingSoon: false,
    label: legacy.isOpen ? `Open now · Closes ${legacy.closesAt}` : `Closed · Opens ${legacy.opensAt}`,
  }
}

/**
 * Whether a restaurant can currently take an order — inactive/not-yet-accepted (admin-side flags)
 * or simply outside its posted hours. Drives the grayed-out treatment on restaurant cards
 * everywhere they render (RestaurantCard, used by Home/Search/category listing/Top Picks/Favorites)
 * and on its menu items (RestaurantDetailPage/MenuItemCard) — a customer shouldn't be able to add
 * an item from a restaurant that can't accept the order right now.
 */
export function isRestaurantOrderable(restaurant: AvailabilityInput): boolean {
  return getAvailability(restaurant).orderable
}
