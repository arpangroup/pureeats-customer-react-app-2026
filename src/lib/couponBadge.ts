import { formatCurrency } from '@/lib/format'
import type { Coupon } from '@/types/entities'

export interface CouponBadge {
  headline: string
  subline: string | null
}

/** Shown when no coupon data applies to a card yet (backend hasn't returned any, or none exist) — keeps every card's layout consistent instead of some cards having a badge and others not. */
export const DEFAULT_COUPON_BADGE: CouponBadge = { headline: '0% OFF', subline: `UPTO ${formatCurrency(100)}` }

/**
 * The discount badge shown on a restaurant card's image (gradient overlay, bottom-left) — mirrors
 * the "70% OFF / UPTO ₹140" pattern from major food-delivery apps. Prefers a restaurant-specific
 * coupon over a sitewide one, then the larger percentage/flat value; `free_delivery` coupons don't
 * make a good image badge (no number to headline), so they're excluded here — the coupon strip
 * elsewhere on Home still surfaces those.
 */
export function bestCouponBadge(coupons: Coupon[], restaurantId: number): CouponBadge | null {
  const applicable = coupons.filter(
    (c) => c.isActive && c.discountType !== 'free_delivery' && (c.restaurantId === null || c.restaurantId === restaurantId),
  )
  if (applicable.length === 0) return null

  const best = [...applicable].sort((a, b) => {
    const aSpecific = a.restaurantId !== null ? 1 : 0
    const bSpecific = b.restaurantId !== null ? 1 : 0
    if (aSpecific !== bSpecific) return bSpecific - aSpecific
    if (a.discountType !== b.discountType) return a.discountType === 'percentage' ? -1 : 1
    return b.discount - a.discount
  })[0]

  if (best.discountType === 'percentage') {
    return { headline: `${best.discount}% OFF`, subline: best.uptoAmount ? `UPTO ${formatCurrency(best.uptoAmount)}` : null }
  }
  return { headline: `${formatCurrency(best.discount)} OFF`, subline: best.minOrderAmount > 0 ? `ABOVE ${formatCurrency(best.minOrderAmount)}` : null }
}
