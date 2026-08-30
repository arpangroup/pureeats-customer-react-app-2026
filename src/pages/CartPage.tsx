import { useNavigate } from 'react-router-dom'
import { MapPin, ShoppingBag } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/Feedback'
import { CartLineItem } from '@/components/cart/CartLineItem'
import { CouponBox } from '@/components/cart/CouponBox'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useActiveLocation } from '@/hooks/useLocation'
import { useAsync } from '@/hooks/useAsync'
import { restaurantService } from '@/services/restaurantService'
import { couponService } from '@/services/couponService'
import { estimateOrderPricing } from '@/lib/pricing'
import { formatCurrency } from '@/lib/format'

const TIP_OPTIONS = [0, 20, 30, 50]

export default function CartPage() {
  const cart = useCart()
  const { user } = useAuth()
  const { activeAddress } = useActiveLocation()
  const navigate = useNavigate()
  const { data: restaurant } = useAsync(() => (cart.restaurantId ? restaurantService.get(cart.restaurantId) : Promise.resolve(undefined)), [cart.restaurantId])

  if (cart.lines.length === 0) {
    return (
      <div>
        <PageHeader title="Cart" />
        <EmptyState title="Your cart is empty" description="Add items from a restaurant to get started." icon={<ShoppingBag size={22} />} action={
          <button className="btn-primary mt-3" onClick={() => navigate('/')}>Browse restaurants</button>
        } />
      </div>
    )
  }

  const pricing = estimateOrderPricing(cart.subtotal, restaurant, 'DELIVERY', cart.coupon, cart.tipAmount)

  async function handleApplyCoupon(code: string) {
    if (!user || !cart.restaurantId) return
    const result = await couponService.apply(user.id, code, cart.restaurantId, cart.subtotal)
    cart.setCoupon({ code: result.code, discountAmount: result.discountAmount, waivesDelivery: result.waivesDelivery })
  }

  return (
    <div>
      <PageHeader title={cart.restaurantName ?? 'Cart'} />

      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="card divide-y divide-slate-100 px-4 dark:divide-slate-800">
          {cart.lines.map((line) => (
            <CartLineItem key={line.key} line={line} onQuantityChange={(next) => cart.updateQuantity(line.key, next)} onRemove={() => cart.removeLine(line.key)} />
          ))}
        </div>

        <button onClick={() => cart.restaurantId && navigate(`/restaurants/${cart.restaurantId}`)} className="btn-secondary mt-3 w-full">
          Add more items
        </button>

        <div className="card mt-4 p-4">
          <CouponBox applied={cart.coupon} onApply={handleApplyCoupon} onRemove={() => cart.setCoupon(null)} />
        </div>

        <div className="card mt-4 p-4">
          <p className="mb-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200">Add a tip for your delivery partner</p>
          <div className="flex gap-2">
            {TIP_OPTIONS.map((amount) => (
              <button
                key={amount}
                onClick={() => cart.setTipAmount(amount)}
                className={`flex-1 rounded-lg border py-2 text-sm font-semibold ${cart.tipAmount === amount ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}
              >
                {amount === 0 ? 'No tip' : formatCurrency(amount)}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => navigate('/profile/addresses')} className="card mt-4 flex w-full items-center gap-3 p-4 text-left">
          <MapPin size={18} className="shrink-0 text-brand-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{activeAddress ? activeAddress.tag ?? 'Delivery address' : 'Select delivery address'}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{activeAddress?.address ?? 'Tap to choose where to deliver'}</p>
          </div>
          <span className="shrink-0 text-xs font-semibold text-brand-600">Change</span>
        </button>

        <div className="card mt-4 p-4">
          <p className="mb-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200">Bill details</p>
          <div className="space-y-1.5 text-sm">
            <Row label="Item total" value={formatCurrency(pricing.itemTotal)} />
            {pricing.discountAmount > 0 && <Row label="Discount" value={`-${formatCurrency(pricing.discountAmount)}`} tone="text-emerald-600" />}
            <Row label="Taxes" value={formatCurrency(pricing.tax)} />
            <Row label="Restaurant charges" value={formatCurrency(pricing.restaurantCharge)} />
            <Row label="Delivery charge" value={pricing.deliveryCharge === 0 ? 'FREE' : formatCurrency(pricing.deliveryCharge)} tone={pricing.deliveryCharge === 0 ? 'text-emerald-600' : undefined} />
            {cart.tipAmount > 0 && <Row label="Delivery tip" value={formatCurrency(cart.tipAmount)} />}
            <div className="mt-1.5 flex items-center justify-between border-t border-slate-100 pt-1.5 text-base font-bold text-slate-800 dark:border-slate-800 dark:text-slate-100">
              <span>To pay</span>
              <span>{formatCurrency(pricing.payable)}</span>
            </div>
          </div>
        </div>

        <button
          disabled={!activeAddress}
          onClick={() => navigate('/checkout')}
          className="btn-primary sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] mt-4 w-full md:static"
        >
          {activeAddress ? `Proceed to pay · ${formatCurrency(pricing.payable)}` : 'Select an address to continue'}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
      <span>{label}</span>
      <span className={tone ?? 'text-slate-700 dark:text-slate-200'}>{value}</span>
    </div>
  )
}
