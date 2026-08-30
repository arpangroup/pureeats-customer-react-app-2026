import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Banknote, CreditCard, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Textarea } from '@/components/ui/FormControls'
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
import type { PaymentMode } from '@/types/entities'

const PAYMENT_OPTIONS: { mode: PaymentMode; label: string; icon: typeof Banknote; description: string }[] = [
  { mode: 'COD', label: 'Cash on Delivery', icon: Banknote, description: 'Pay when your order arrives' },
  { mode: 'WALLET', label: 'PureEats Wallet', icon: Wallet, description: 'Pay using your wallet balance' },
  { mode: 'ONLINE', label: 'UPI / Card', icon: CreditCard, description: 'Pay securely online' },
]

export default function CheckoutPage() {
  const cart = useCart()
  const { user } = useAuth()
  const { activeAddress } = useActiveLocation()
  const navigate = useNavigate()
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('COD')
  const [comment, setComment] = useState('')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: restaurant } = useAsync(() => (cart.restaurantId ? restaurantService.get(cart.restaurantId) : Promise.resolve(undefined)), [cart.restaurantId])
  const { data: walletBalance } = useAsync(() => (user ? walletService.balance(user.id) : Promise.resolve(0)), [user?.id])

  if (cart.lines.length === 0 || !activeAddress) {
    return (
      <div>
        <PageHeader title="Checkout" />
        <EmptyState title="Nothing to check out" description="Add items to your cart and pick an address first." />
      </div>
    )
  }

  const pricing = estimateOrderPricing(cart.subtotal, restaurant, 'DELIVERY', cart.coupon, cart.tipAmount)
  const walletInsufficient = paymentMode === 'WALLET' && (walletBalance ?? 0) < pricing.payable

  async function handlePlaceOrder() {
    if (!user || !cart.restaurantId) return
    setPlacing(true)
    setError(null)
    try {
      const order = await orderService.placeOrder(user.id, {
        restaurantId: cart.restaurantId,
        addressId: activeAddress!.id,
        address: `${activeAddress!.house}, ${activeAddress!.address}`,
        items: cart.lines.map((l) => ({ itemId: l.itemId, name: l.name, price: l.price, quantity: l.quantity, addons: l.addons.map((a) => ({ addonCategoryName: a.addonCategoryName, addonName: a.addonName, addonPrice: a.addonPrice })) })),
        paymentMode,
        deliveryType: 'DELIVERY',
        coupon: cart.coupon,
        orderComment: comment.trim() || null,
        driverTipAmount: cart.tipAmount,
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
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Delivering to</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {activeAddress.house}, {activeAddress.address}
          </p>
        </div>

        <div className="card mt-4 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Payment method</p>
          <div className="space-y-2">
            {PAYMENT_OPTIONS.map(({ mode, label, icon: Icon, description }) => (
              <button
                key={mode}
                onClick={() => setPaymentMode(mode)}
                className={classNames(
                  'flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors',
                  paymentMode === mode ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 dark:border-slate-700',
                )}
              >
                <Icon size={20} className="shrink-0 text-slate-500 dark:text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{mode === 'WALLET' ? `Balance: ${formatCurrency(walletBalance ?? 0)}` : description}</p>
                </div>
              </button>
            ))}
          </div>
          {walletInsufficient && <p className="mt-2 text-xs text-rose-500">Insufficient wallet balance for this order.</p>}
        </div>

        <div className="card mt-4 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Delivery instructions (optional)</p>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="E.g. Ring the bell, leave at the door…" />
        </div>

        {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>}

        <button className="btn-primary mt-4 w-full" disabled={placing || walletInsufficient} onClick={handlePlaceOrder}>
          {placing ? 'Placing order…' : `Place order · ${formatCurrency(pricing.payable)}`}
        </button>
      </div>
    </div>
  )
}
