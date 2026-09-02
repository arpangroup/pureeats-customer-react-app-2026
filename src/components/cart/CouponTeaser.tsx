import { Link } from 'react-router-dom'
import { Check, ChevronRight, Tag } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { nextCouponFor } from '@/components/cart/FreebieNudge'
import type { AppliedCoupon } from '@/lib/pricing'
import type { Coupon } from '@/types/entities'

/**
 * "Savings corner" — replaces the old inline coupon-code text field with a link out to the full
 * coupons page (browse/search/apply there), per the reference screenshots. Collapses to a compact
 * "saved" summary once a coupon is applied; removal also lives on the coupons page.
 */
export function CouponTeaser({ applied, coupons, subtotal }: { applied: AppliedCoupon | null; coupons: Coupon[]; subtotal: number }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Savings corner</p>
      {applied ? (
        <Link
          to="/coupons"
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Tag size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {applied.waivesDelivery ? `Free delivery with ${applied.code}` : `${formatCurrency(applied.discountAmount)} saved with ${applied.code}`}
            </p>
            <p className="mt-0.5 flex items-center gap-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              View all coupons <ChevronRight size={12} />
            </p>
          </div>
          <Check size={16} className="shrink-0 text-emerald-600" />
        </Link>
      ) : (
        <Link to="/coupons" className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 dark:border-slate-700">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Tag size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Apply Coupon</p>
            <p className="truncate text-xs text-slate-400">{teaserSubtitle(coupons, subtotal)}</p>
          </div>
          <ChevronRight size={16} className="shrink-0 text-slate-400" />
        </Link>
      )}
    </div>
  )
}

function teaserSubtitle(coupons: Coupon[], subtotal: number): string {
  const next = nextCouponFor(coupons, subtotal)
  if (next) return `Unlock ${next.code} with items worth ${formatCurrency(next.minOrderAmount - subtotal)}`
  if (coupons.length > 0) return `${coupons.length} offer${coupons.length > 1 ? 's' : ''} available`
  return 'View available offers'
}
