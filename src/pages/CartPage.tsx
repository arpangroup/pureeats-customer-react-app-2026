import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike, MapPin, MessageSquare, ShieldCheck, ShoppingBag, Store } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/Feedback'
import { Textarea } from '@/components/ui/FormControls'
import { CartLineItem } from '@/components/cart/CartLineItem'
import { CouponBox } from '@/components/cart/CouponBox'
import { FreebieNudge } from '@/components/cart/FreebieNudge'
import { LoginBottomSheet } from '@/components/auth/LoginBottomSheet'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useActiveLocation } from '@/hooks/useLocation'
import { useAsync } from '@/hooks/useAsync'
import { useCartValidation } from '@/hooks/useCartValidation'
import { restaurantService } from '@/services/restaurantService'
import { couponService } from '@/services/couponService'
import { estimateOrderPricing, type OrderPricing } from '@/lib/pricing'
import { formatCurrency, classNames } from '@/lib/format'

const TIP_OPTIONS = [0, 20, 30, 50]
type CartTab = 'delivery' | 'tip' | 'instructions'

export default function CartPage() {
  const cart = useCart()
  const { user, isAuthenticated } = useAuth()
  const { activeAddress } = useActiveLocation()
  const navigate = useNavigate()
  const { data: restaurant } = useAsync(() => (cart.restaurantId ? restaurantService.get(cart.restaurantId) : Promise.resolve(undefined)), [cart.restaurantId])
  const { data: restaurantCoupons } = useAsync(() => (cart.restaurantId ? couponService.listForRestaurant(cart.restaurantId) : Promise.resolve([])), [cart.restaurantId])
  const { result: validation, guestQuote } = useCartValidation()
  const [tab, setTab] = useState<CartTab>('delivery')
  const [loginSheetOpen, setLoginSheetOpen] = useState(false)
  const [couponRemovedNotice, setCouponRemovedNotice] = useState<string | null>(null)

  // The backend's live re-validation can invalidate a coupon the customer already applied (expired,
  // usage limit hit since they added it, no longer meets the minimum after an item became
  // unavailable, ...) — clear it locally so the bill and "proceed" button don't drift from what the
  // server will actually charge.
  useEffect(() => {
    if (validation?.coupon && !validation.coupon.valid && cart.coupon) {
      setCouponRemovedNotice(`"${cart.coupon.code}" is no longer valid${validation.coupon.reason ? `: ${validation.coupon.reason}` : ''}`)
      cart.setCoupon(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validation?.coupon?.valid, validation?.coupon?.reason])

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
  const needsAddress = cart.deliveryType === 'DELIVERY'
  const clientEstimate = estimateOrderPricing(cart.subtotal, restaurant, cart.deliveryType, cart.coupon, cart.tipAmount)

  // Authenticated (live mode): trust the server's own numbers — item total already excludes
  // whatever it flagged unavailable. Guest (live mode, delivery): keep the client estimate but swap
  // in the IP-location-based delivery quote. Mock mode / not-yet-loaded: unchanged client estimate.
  const pricing: OrderPricing = validation
    ? {
        itemTotal: validation.pricing.itemTotal,
        tax: validation.pricing.tax,
        restaurantCharge: validation.pricing.restaurantCharge,
        deliveryCharge: validation.pricing.deliveryCharge,
        discountAmount: validation.pricing.discountAmount,
        total: validation.pricing.itemTotal - validation.pricing.discountAmount + validation.pricing.tax + validation.pricing.restaurantCharge,
        payable: validation.pricing.payable + (cart.deliveryType === 'DELIVERY' ? cart.tipAmount : 0),
      }
    : guestQuote
      ? { ...clientEstimate, deliveryCharge: guestQuote.deliveryCharge, payable: clientEstimate.total + guestQuote.deliveryCharge + cart.tipAmount }
      : clientEstimate

  const unavailableItemIds = new Map((validation?.items ?? []).filter((i) => !i.available).map((i) => [i.itemId, i.reason]))
  const restaurantUnavailable = validation ? !validation.restaurant.available : false
  const blockedFromCheckout = validation?.anyUnavailable ?? false

  async function handleApplyCoupon(code: string) {
    if (!cart.restaurantId) return
    setCouponRemovedNotice(null)
    const result = await couponService.apply(user?.id ?? null, code, cart.restaurantId, cart.subtotal)
    cart.setCoupon({ code: result.code, discountAmount: result.discountAmount, waivesDelivery: result.waivesDelivery })
  }

  function handleProceed() {
    if (!isAuthenticated) {
      setLoginSheetOpen(true)
      return
    }
    if (needsAddress && !activeAddress) {
      navigate('/profile/addresses', { state: { from: '/cart' } })
      return
    }
    if (blockedFromCheckout) return
    navigate('/checkout')
  }

  return (
    <div>
      <PageHeader title={cart.restaurantName ?? 'Cart'} />

      <div className="mx-auto max-w-lg px-4 py-4">
        {restaurantUnavailable && (
          <div className="card mb-4 border-rose-200 bg-rose-50 p-3.5 text-sm font-medium text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
            {validation?.restaurant.reason ?? 'This restaurant is currently unavailable.'}
          </div>
        )}

        <div className="card divide-y divide-slate-100 px-4 dark:divide-slate-800">
          {cart.lines.map((line) => (
            <CartLineItem
              key={line.key}
              line={line}
              unavailableReason={unavailableItemIds.get(line.itemId)}
              onQuantityChange={(next) => cart.updateQuantity(line.key, next)}
              onRemove={() => cart.removeLine(line.key)}
            />
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
          <CouponBox applied={cart.coupon} onApply={handleApplyCoupon} onRemove={() => { setCouponRemovedNotice(null); cart.setCoupon(null) }} />
          {couponRemovedNotice && <p className="mt-1.5 text-xs text-rose-500">{couponRemovedNotice}</p>}
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

        {/* The "Proceed to pay" button below is `fixed` on mobile (always visible without
            scrolling), occupying a constant band roughly 4.5rem-7.5rem above the viewport bottom.
            Trailing padding on the page can't protect content ABOVE it in the DOM (padding after
            the last element doesn't push earlier siblings down) — this spacer, placed before
            everything that could otherwise land in that band (address card, nudge, bill details,
            policy text), is what actually guarantees none of it renders underneath the button,
            regardless of how short the cart is or which of those sections are present. */}
        <div className="h-28 md:hidden" aria-hidden="true" />

        {needsAddress && isAuthenticated && (
          <button onClick={() => navigate('/profile/addresses', { state: { from: '/cart' } })} className="card mt-4 flex w-full items-center gap-3 p-4 text-left">
            <MapPin size={18} className="shrink-0 text-brand-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{activeAddress ? activeAddress.tag ?? 'Delivery address' : 'Select delivery address'}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{activeAddress?.address ?? 'Tap to choose where to deliver'}</p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-brand-600">Change</span>
          </button>
        )}

        {restaurant && restaurantCoupons && restaurantCoupons.length > 0 && (
          <div className="mt-4">
            <FreebieNudge coupons={restaurantCoupons} subtotal={cart.subtotal} variant="inline" />
          </div>
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

        <div className="mt-3 flex items-start gap-2 px-1 text-xs text-slate-400">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" />
          <p>
            Free cancellation before the restaurant accepts your order. Once accepted, cancellations may be subject to a partial charge to
            cover preparation already in progress — cancelled orders are refunded to your PureEats wallet.
          </p>
        </div>

        <button
          onClick={handleProceed}
          disabled={isAuthenticated && blockedFromCheckout}
          className="btn-primary fixed inset-x-3 z-20 mx-auto max-w-[calc(32rem-1.5rem)] bottom-[calc(4.5rem+env(safe-area-inset-bottom))] disabled:cursor-not-allowed disabled:opacity-50 md:static md:z-auto md:mx-0 md:mt-4 md:max-w-none md:w-full"
        >
          {isAuthenticated && needsAddress && !activeAddress
            ? 'Select an address to continue'
            : isAuthenticated && blockedFromCheckout
              ? 'Remove unavailable items to continue'
              : `Proceed to pay · ${formatCurrency(pricing.payable)}`}
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
