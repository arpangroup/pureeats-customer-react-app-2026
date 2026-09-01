import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Banknote, CheckCircle2, Smartphone, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/Feedback'
import { classNames, formatCurrency } from '@/lib/format'
import { estimateOrderPricing } from '@/lib/pricing'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useActiveLocation } from '@/hooks/useLocation'
import { useAsync } from '@/hooks/useAsync'
import { restaurantService } from '@/services/restaurantService'
import { orderService } from '@/services/orderService'
import { walletService } from '@/services/walletService'
import { buildUpiLaunchUrl, isMobileDevice } from '@/lib/upi'
import { useAppConfig } from '@/context/AppConfigContext'
import type { PaymentMode } from '@/types/entities'

const PAYMENT_OPTIONS: { mode: PaymentMode; label: string; icon: typeof Banknote; description: string }[] = [
  { mode: 'COD', label: 'Cash on Delivery', icon: Banknote, description: 'Pay when your order arrives' },
  { mode: 'WALLET', label: 'PureEats Wallet', icon: Wallet, description: 'Pay using your wallet balance' },
  { mode: 'UPI', label: 'UPI', icon: Smartphone, description: 'Pay via GPay, PhonePe, Paytm & more' },
]

/** Combines the two separate Cart-page notes into the single orderComment field the backend accepts. */
function buildOrderComment(cookingNote: string, deliveryInstructions: string): string | null {
  const parts = []
  if (cookingNote.trim()) parts.push(`Cooking note: ${cookingNote.trim()}`)
  if (deliveryInstructions.trim()) parts.push(`Delivery instructions: ${deliveryInstructions.trim()}`)
  return parts.length > 0 ? parts.join(' | ') : null
}

export default function CheckoutPage() {
  const cart = useCart()
  const { user, isAuthenticated } = useAuth()
  const { activeAddress } = useActiveLocation()
  const navigate = useNavigate()
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('COD')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [upiAwaitingConfirmation, setUpiAwaitingConfirmation] = useState(false)
  const [upiLaunchFailed, setUpiLaunchFailed] = useState(false)

  function selectPaymentMode(mode: PaymentMode) {
    setPaymentMode(mode)
    setUpiAwaitingConfirmation(false)
    setUpiLaunchFailed(false)
  }

  const { data: restaurant } = useAsync(() => (cart.restaurantId ? restaurantService.get(cart.restaurantId) : Promise.resolve(undefined)), [cart.restaurantId])
  const { data: walletBalance } = useAsync(() => (user ? walletService.balance(user.id) : Promise.resolve(0)), [user?.id])
  const { enabledPaymentMethods } = useAppConfig()
  // Empty list means the admin hasn't restricted anything — show every option, same as before this existed.
  const paymentOptions = enabledPaymentMethods.length === 0
    ? PAYMENT_OPTIONS
    : PAYMENT_OPTIONS.filter((o) => enabledPaymentMethods.includes(o.mode))

  const needsAddress = cart.deliveryType === 'DELIVERY'

  // Direct-URL-access guard — the actual gate (the "Almost there" sheet) lives on the Cart page's
  // Proceed button; this only covers someone bookmarking/typing /checkout while signed out.
  if (!isAuthenticated) {
    return <Navigate to="/cart" replace />
  }

  if (cart.lines.length === 0) {
    return (
      <div>
        <PageHeader title="Checkout" />
        <EmptyState title="Nothing to check out" description="Add items to your cart first." />
      </div>
    )
  }

  if (needsAddress && !activeAddress) {
    return (
      <div>
        <PageHeader title="Checkout" />
        <EmptyState
          title="Add a delivery address"
          description="You'll need a saved address before you can check out."
          action={
            <button className="btn-primary mt-3" onClick={() => navigate('/profile/addresses/new')}>
              Add address
            </button>
          }
        />
      </div>
    )
  }

  const pricing = estimateOrderPricing(cart.subtotal, restaurant, cart.deliveryType, cart.coupon, cart.tipAmount)
  const walletInsufficient = paymentMode === 'WALLET' && (walletBalance ?? 0) < pricing.payable
  const upiOnMobile = paymentMode === 'UPI' && isMobileDevice()

  /** No payment gateway backs this — same trust model as Cash on Delivery. Opening the UPI app is
   * real (a genuine upi://pay intent), but "did they actually pay" is the user's own confirmation. */
  function handleOpenUpiApp() {
    const url = buildUpiLaunchUrl({
      amountInRupees: pricing.payable,
      transactionRef: `PE${Date.now()}`,
      note: `PureEats order${restaurant?.name ? ` · ${restaurant.name}` : ''}`,
    })
    setUpiLaunchFailed(false)
    window.location.href = url
    setUpiAwaitingConfirmation(true)
    // If a UPI app actually opened, the tab loses visibility almost immediately (backgrounded in
    // favor of the app); if we're still visible after a beat, nothing claimed the intent.
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') setUpiLaunchFailed(true)
    }, 1500)
  }

  async function handlePlaceOrder() {
    if (!user || !cart.restaurantId) return
    setPlacing(true)
    setError(null)
    try {
      const order = await orderService.placeOrder(user.id, {
        restaurantId: cart.restaurantId,
        addressId: needsAddress ? activeAddress!.id : 0,
        address: needsAddress ? `${activeAddress!.house}, ${activeAddress!.address}` : `${restaurant?.name ?? 'Restaurant'} (self pickup)`,
        items: cart.lines.map((l) => ({ itemId: l.itemId, name: l.name, price: l.price, quantity: l.quantity, addons: l.addons.map((a) => ({ addonCategoryName: a.addonCategoryName, addonName: a.addonName, addonPrice: a.addonPrice })) })),
        paymentMode,
        deliveryType: cart.deliveryType,
        coupon: cart.coupon,
        orderComment: buildOrderComment(cart.cookingNote, cart.deliveryInstructions),
        driverTipAmount: needsAddress ? cart.tipAmount : 0,
      })
      cart.clearCart()
      navigate(`/orders/${order.id}/confirmation`, { replace: true })
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not place your order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div>
      <PageHeader title="Checkout" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="card p-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{needsAddress ? 'Delivering to' : 'Pickup from'}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {needsAddress ? `${activeAddress!.house}, ${activeAddress!.address}` : `${restaurant?.name ?? ''}, ${restaurant?.address ?? ''}`}
          </p>
        </div>

        <div className="card mt-4 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Payment method</p>
          <div className="space-y-2">
            {paymentOptions.map(({ mode, label, icon: Icon, description }) => (
              <button
                key={mode}
                onClick={() => selectPaymentMode(mode)}
                className={classNames(
                  'flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors',
                  paymentMode === mode ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 dark:border-slate-700',
                )}
              >
                <Icon size={20} className="shrink-0 text-slate-500 dark:text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {mode === 'WALLET' ? `Balance: ${formatCurrency(walletBalance ?? 0)}` : description}
                  </p>
                </div>
              </button>
            ))}
          </div>
          {walletInsufficient && <p className="mt-2 text-xs text-rose-500">Insufficient wallet balance for this order.</p>}
          {paymentMode === 'UPI' && !isMobileDevice() && (
            <p className="mt-2 text-xs text-slate-400">Open checkout on your phone to pay directly from a UPI app — on desktop, order confirmation still goes through.</p>
          )}
        </div>

        {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>}

        {upiAwaitingConfirmation ? (
          <div className="card mt-4 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15">
                <Smartphone size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Complete the payment in your UPI app</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  We opened your UPI app for {formatCurrency(pricing.payable)}. Come back here once you've paid.
                </p>
              </div>
            </div>
            {upiLaunchFailed && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                Didn't open a UPI app? Make sure GPay, PhonePe or another UPI app is installed, then try again.
              </p>
            )}
            <button className="btn-secondary mt-3 flex w-full items-center justify-center gap-2" disabled={placing} onClick={handleOpenUpiApp}>
              <Smartphone size={16} /> Open UPI app again
            </button>
            <button className="btn-primary mt-1.5 flex w-full items-center justify-center gap-2" disabled={placing} onClick={handlePlaceOrder}>
              <CheckCircle2 size={16} /> {placing ? 'Placing order…' : "I've completed the payment"}
            </button>
            <button className="btn-ghost mt-1.5 w-full text-sm" disabled={placing} onClick={() => { setUpiAwaitingConfirmation(false); setUpiLaunchFailed(false) }}>
              I didn't pay — choose another payment method
            </button>
          </div>
        ) : (
          <button
            className="btn-primary mt-4 w-full"
            disabled={placing || walletInsufficient}
            onClick={upiOnMobile ? handleOpenUpiApp : handlePlaceOrder}
          >
            {placing ? 'Placing order…' : upiOnMobile ? `Pay ${formatCurrency(pricing.payable)} via UPI` : `Place order · ${formatCurrency(pricing.payable)}`}
          </button>
        )}
      </div>
    </div>
  )
}
