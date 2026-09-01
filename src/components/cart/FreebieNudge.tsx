import { Sparkles } from 'lucide-react'
import { formatCurrency, classNames } from '@/lib/format'
import type { Coupon } from '@/types/entities'

export function nextCouponFor(coupons: Coupon[], subtotal: number): Coupon | undefined {
  return coupons
    .filter((c) => c.minOrderAmount > subtotal)
    .sort((a, b) => a.minOrderAmount - b.minOrderAmount)[0]
}

/**
 * "Add ₹X more to unlock {coupon}" — encourages the customer toward the next coupon tier.
 * `variant="floating"` (default) overlays it above the cart bar while browsing a long scrollable
 * menu (RestaurantDetailPage) — fine there since it's just floating over item cards. `variant="inline"`
 * renders it as a normal block instead (CartPage): that page's content can be short enough to fit
 * in one screen, where a `position: fixed` banner would sit on top of the address card/CTA button
 * instead of being pushed out of the way by them.
 */
export function FreebieNudge({ coupons, subtotal, variant = 'floating' }: { coupons: Coupon[]; subtotal: number; variant?: 'floating' | 'inline' }) {
  const nextCoupon = nextCouponFor(coupons, subtotal)

  if (!nextCoupon) return null

  const gap = nextCoupon.minOrderAmount - subtotal
  const rewardText = nextCoupon.discountType === 'free_delivery' ? 'FREE delivery' : nextCoupon.name

  return (
    <div
      className={classNames(
        'flex items-center gap-2 rounded-xl bg-slate-800 px-3.5 py-2.5 text-white shadow-lg dark:bg-slate-700',
        variant === 'floating' &&
          'fixed inset-x-3 z-30 mx-auto max-w-md animate-fade-in bottom-[calc(8rem+env(safe-area-inset-bottom))] md:bottom-20 md:right-6 md:left-auto md:mx-0',
      )}
    >
      <Sparkles size={16} className="shrink-0 text-amber-300" />
      <p className="text-xs font-medium">
        Add items worth <span className="font-bold text-amber-300">{formatCurrency(gap)}</span> to unlock {rewardText}
      </p>
    </div>
  )
}
