import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike, MapPin, MessageSquare, ShoppingBag, Store } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/Feedback'
import { Textarea } from '@/components/ui/FormControls'
import { CartLineItem } from '@/components/cart/CartLineItem'
import { CouponBox } from '@/components/cart/CouponBox'
import { LoginBottomSheet } from '@/components/auth/LoginBottomSheet'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useActiveLocation } from '@/hooks/useLocation'
import { useAsync } from '@/hooks/useAsync'
import { restaurantService } from '@/services/restaurantService'
import { couponService } from '@/services/couponService'
import { estimateOrderPricing } from '@/lib/pricing'
import { formatCurrency, classNames } from '@/lib/format'

const TIP_OPTIONS = [0, 20, 30, 50]
type CartTab = 'delivery' | 'tip' | 'instructions'

export default function CartPage() {
  const cart = useCart()
  const { user, isAuthenticated } = useAuth()
  const { activeAddress } = useActiveLocation()
  const navigate = useNavigate()
  const { data: restaurant } = useAsync(() => (cart.restaurantId ? restaurantService.get(cart.restaurantId) : Promise.resolve(undefined)), [cart.restaurantId])
  const [tab, setTab] = useState<CartTab>('delivery')
  const [loginSheetOpen, setLoginSheetOpen] = useState(false)

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

  const canSelfPickup = restaurant?.deliveryType === 'self-pickup' || restaurant?.deliveryType === 'both'
  const pricing = estimateOrderPricing(cart.subtotal, restaurant, cart.deliveryType, cart.coupon, cart.tipAmount)
  const needsAddress = cart.deliveryType === 'DELIVERY'

  async function handleApplyCoupon(code: string) {
    if (!cart.restaurantId) return
    const result = await couponService.apply(user?.id ?? null, code, cart.restaurantId, cart.subtotal)
    cart.setCoupon({ code: result.code, discountAmount: result.discountAmount, waivesDelivery: result.waivesDelivery })
  }

  function handleProceed() {
    if (!isAuthenticated) {
      setLoginSheetOpen(true)
      return
    }
    if (needsAddress && !activeAddress) {
      navigate('/profile/addresses')
      return
    }
    navigate('/checkout')
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
          <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <MessageSquare size={15} className="text-brand-600" /> Cooking note
          </label>
          <Textarea
            value={cart.cookingNote}
            onChange={(e) => cart.setCookingNote(e.target.value)}
            placeholder="E.g. Less spicy, no onions…"
          />
          <p className="mt-1 text-xs text-slate-400">Goes straight to the restaurant kitchen.</p>
        </div>

        <div className="card mt-4 p-4">
          <CouponBox applied={cart.coupon} onApply={handleApplyCoupon} onRemove={() => cart.setCoupon(null)} />
        </div>

        <div className="card mt-4 overflow-hidden">
          <div className="flex border-b border-slate-100 dark:border-slate-800">
            <TabButton label="Delivery type" active={tab === 'delivery'} onClick={() => setTab('delivery')} />
            <TabButton label="Tip" active={tab === 'tip'} onClick={() => setTab('tip')} />
            <TabButton label="Instructions" active={tab === 'instructions'} onClick={() => setTab('instructions')} />
          </div>
          <div className="p-4">
            {tab === 'delivery' && (
              <div className="flex gap-2">
                <button
                  onClick={() => cart.setDeliveryType('DELIVERY')}
                  className={classNames(
                    'flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 text-sm font-semibold',
                    cart.deliveryType === 'DELIVERY' ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300',
                  )}
                >
                  <Bike size={18} /> Delivery
                </button>
                <button
                  onClick={() => canSelfPickup && cart.setDeliveryType('SELF_PICKUP')}
                  disabled={!canSelfPickup}
                  className={classNames(
                    'flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40',
                    cart.deliveryType === 'SELF_PICKUP' ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300',
                  )}
                >
                  <Store size={18} /> Self pickup
                </button>
              </div>
            )}
            {tab === 'tip' && (
              <div className="flex gap-2">
                {TIP_OPTIONS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => cart.setTipAmount(amount)}
                    className={classNames(
                      'flex-1 rounded-lg border py-2 text-sm font-semibold',
                      cart.tipAmount === amount ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300',
                    )}
                  >
                    {amount === 0 ? 'No tip' : formatCurrency(amount)}
                  </button>
                ))}
              </div>
            )}
            {tab === 'instructions' && (
              <Textarea
                value={cart.deliveryInstructions}
                onChange={(e) => cart.setDeliveryInstructions(e.target.value)}
                placeholder="E.g. Ring the bell, leave at the door…"
              />
            )}
          </div>
        </div>

        {needsAddress && isAuthenticated && (
          <button onClick={() => navigate('/profile/addresses')} className="card mt-4 flex w-full items-center gap-3 p-4 text-left">
            <MapPin size={18} className="shrink-0 text-brand-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{activeAddress ? activeAddress.tag ?? 'Delivery address' : 'Select delivery address'}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{activeAddress?.address ?? 'Tap to choose where to deliver'}</p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-brand-600">Change</span>
          </button>
        )}

        <div className="card mt-4 p-4">
          <p className="mb-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200">Bill details</p>
          <div className="space-y-1.5 text-sm">
            <Row label="Item total" value={formatCurrency(pricing.itemTotal)} />
            {pricing.discountAmount > 0 && <Row label="Discount" value={`-${formatCurrency(pricing.discountAmount)}`} tone="text-emerald-600" />}
            <Row label="Taxes" value={formatCurrency(pricing.tax)} />
            <Row label="Restaurant charges" value={formatCurrency(pricing.restaurantCharge)} />
            <Row label="Delivery charge" value={pricing.deliveryCharge === 0 ? 'FREE' : formatCurrency(pricing.deliveryCharge)} tone={pricing.deliveryCharge === 0 ? 'text-emerald-600' : undefined} />
            {cart.tipAmount > 0 && cart.deliveryType === 'DELIVERY' && <Row label="Delivery tip" value={formatCurrency(cart.tipAmount)} />}
            <div className="mt-1.5 flex items-center justify-between border-t border-slate-100 pt-1.5 text-base font-bold text-slate-800 dark:border-slate-800 dark:text-slate-100">
              <span>To pay</span>
              <span>{formatCurrency(pricing.payable)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleProceed}
          className="btn-primary sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] mt-4 w-full md:static"
        >
          {isAuthenticated && needsAddress && !activeAddress ? 'Select an address to continue' : `Proceed to pay · ${formatCurrency(pricing.payable)}`}
        </button>
      </div>

      <LoginBottomSheet open={loginSheetOpen} onClose={() => setLoginSheetOpen(false)} from="/checkout" />
    </div>
  )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        'flex-1 border-b-2 px-2 py-2.5 text-xs font-semibold',
        active ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 dark:text-slate-400',
      )}
    >
      {label}
    </button>
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
