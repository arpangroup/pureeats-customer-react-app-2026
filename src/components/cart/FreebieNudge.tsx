import { Sparkles } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { Coupon } from '@/types/entities'

/** "Add ₹X more to unlock {coupon}" — sits just above the floating cart bar, encouraging the customer toward the next coupon tier. */
export function FreebieNudge({ coupons, subtotal }: { coupons: Coupon[]; subtotal: number }) {
  const nextCoupon = coupons
    .filter((c) => c.minOrderAmount > subtotal)
    .sort((a, b) => a.minOrderAmount - b.minOrderAmount)[0]

  if (!nextCoupon) return null

  const gap = nextCoupon.minOrderAmount - subtotal
  const rewardText = nextCoupon.discountType === 'free_delivery' ? 'FREE delivery' : nextCoupon.name

  return (
    <div className="fixed inset-x-3 z-30 mx-auto flex max-w-md items-center gap-2 rounded-xl bg-slate-800 px-3.5 py-2.5 text-white shadow-lg animate-fade-in bottom-[calc(8rem+env(safe-area-inset-bottom))] md:bottom-20 md:right-6 md:left-auto md:mx-0 dark:bg-slate-700">
      <Sparkles size={16} className="shrink-0 text-amber-300" />
      <p className="text-xs font-medium">
        Add items worth <span className="font-bold text-amber-300">{formatCurrency(gap)}</span> to unlock {rewardText}
      </p>
    </div>
  )
}
