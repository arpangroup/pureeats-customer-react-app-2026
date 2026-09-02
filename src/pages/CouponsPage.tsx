import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState, LoadingBlock } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { couponService } from '@/services/couponService'
import { formatCurrency, classNames } from '@/lib/format'
import type { Coupon } from '@/types/entities'

function discountLabel(c: Coupon): string {
  if (c.discountType === 'percentage') return `${c.discount}% OFF`
  if (c.discountType === 'free_delivery') return 'FREE DELIVERY'
  return `${formatCurrency(c.discount)} OFF`
}

export default function CouponsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const cart = useCart()
  const { data: coupons, isLoading } = useAsync(() => (cart.restaurantId ? couponService.listForRestaurant(cart.restaurantId) : Promise.resolve([])), [cart.restaurantId])
  const [code, setCode] = useState('')
  const [applyingCode, setApplyingCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function applyCode(rawCode: string) {
    if (!cart.restaurantId || !rawCode.trim()) return
    setApplyingCode(rawCode)
    setError(null)
    try {
      const result = await couponService.apply(user?.id ?? null, rawCode.trim(), cart.restaurantId, cart.subtotal)
      cart.setCoupon({ code: result.code, discountAmount: result.discountAmount, waivesDelivery: result.waivesDelivery })
      navigate('/cart', { replace: true })
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not apply this coupon')
    } finally {
      setApplyingCode(null)
    }
  }

  function removeCoupon() {
    cart.setCoupon(null)
    navigate('/cart', { replace: true })
  }

  const applied = coupons?.find((c) => c.code.toUpperCase() === cart.coupon?.code.toUpperCase())
  const others = (coupons ?? []).filter((c) => c.code.toUpperCase() !== cart.coupon?.code.toUpperCase())
  const eligible = others.filter((c) => cart.subtotal >= c.minOrderAmount)
  const almostEligible = others.filter((c) => cart.subtotal < c.minOrderAmount)

  return (
    <div>
      <PageHeader title="Apply Coupon" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <p className="-mt-1 mb-4 text-sm text-slate-400 md:mt-0">Your cart: {formatCurrency(cart.subtotal)}</p>

        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && applyCode(code)}
            placeholder="Enter Coupon Code"
            className="input flex-1"
          />
          <button className="btn-secondary" onClick={() => applyCode(code)} disabled={!!applyingCode || !code.trim()}>
            {applyingCode === code ? 'Applying…' : 'Apply'}
          </button>
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-500">{error}</p>}

        {isLoading ? (
          <LoadingBlock />
        ) : (
          <>
            {applied && cart.coupon && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-100">Applied coupon</p>
                <CouponTicket coupon={applied} onRemove={removeCoupon} />
              </div>
            )}

            {almostEligible.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-100">Great deal you're missing out on!</p>
                <div className="space-y-3">
                  {almostEligible.map((c) => (
                    <CouponRow
                      key={c.id}
                      coupon={c}
                      subtotal={cart.subtotal}
                      applying={applyingCode === c.code}
                      onApply={() => applyCode(c.code)}
                    />
                  ))}
                </div>
              </div>
            )}

            {eligible.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-100">More offers</p>
                <div className="space-y-3">
                  {eligible.map((c) => (
                    <CouponRow
                      key={c.id}
                      coupon={c}
                      subtotal={cart.subtotal}
                      applying={applyingCode === c.code}
                      onApply={() => applyCode(c.code)}
                    />
                  ))}
                </div>
              </div>
            )}

            {!applied && eligible.length === 0 && almostEligible.length === 0 && (
              <div className="mt-6">
                <EmptyState title="No coupons available" description="Check back later for offers on this restaurant." icon={<Tag size={22} />} />
              </div>
            )}
          </>
        )}

         {/* CartFloatingBar and OngoingOrderBar are `fixed` — they float over content rather than
            pushing it up, and can stack up to ~13rem tall together (cart bar + an active order).
            Reserves enough bottom space that the last grid row never renders underneath them. */}
        <div className="h-8 md:hidden" aria-hidden="true" />
      </div>
    </div>
  )
}

function CouponRow({ coupon, subtotal, applying, onApply }: { coupon: Coupon; subtotal: number; applying: boolean; onApply: () => void }) {
  const eligible = subtotal >= coupon.minOrderAmount
  const gap = coupon.minOrderAmount - subtotal

  return (
    <div className="card flex overflow-hidden">
      <div className="flex w-16 shrink-0 items-center justify-center bg-brand-600 p-2 text-center text-[11px] font-extrabold uppercase leading-tight text-white">
        {discountLabel(coupon)}
      </div>
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100">{coupon.code}</p>
          <button
            onClick={onApply}
            disabled={!eligible || applying}
            className={classNames(
              'shrink-0 text-xs font-bold uppercase tracking-wide',
              eligible ? 'text-brand-600' : 'cursor-not-allowed text-slate-300 dark:text-slate-600',
            )}
          >
            {applying ? 'Applying…' : 'Apply'}
          </button>
        </div>
        {eligible ? (
          <p className="mt-0.5 text-xs font-medium text-emerald-600">{coupon.name}</p>
        ) : (
          <p className="mt-0.5 text-xs font-medium text-emerald-600">
            Add {formatCurrency(gap)} more to unlock {coupon.uptoAmount ? `up to ${formatCurrency(coupon.uptoAmount)}` : coupon.name}
          </p>
        )}
        <div className="my-2 border-t border-dashed border-slate-200 dark:border-slate-700" />
        <p className="text-xs text-slate-500 dark:text-slate-400">{coupon.description}</p>
      </div>
    </div>
  )
}

function CouponTicket({ coupon, onRemove }: { coupon: Coupon; onRemove: () => void }) {
  return (
    <div className="card flex overflow-hidden border-emerald-200 dark:border-emerald-500/30">
      <div className="flex w-16 shrink-0 items-center justify-center bg-emerald-600 p-2 text-center text-[11px] font-extrabold uppercase leading-tight text-white">
        {discountLabel(coupon)}
      </div>
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100">{coupon.code}</p>
          <button onClick={onRemove} className="flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wide text-brand-600">
            <X size={12} /> Remove
          </button>
        </div>
        <p className="mt-0.5 text-xs font-medium text-emerald-600">{coupon.name}</p>
        <div className="my-2 border-t border-dashed border-slate-200 dark:border-slate-700" />
        <p className="text-xs text-slate-500 dark:text-slate-400">{coupon.description}</p>
      </div>
    </div>
  )
}
