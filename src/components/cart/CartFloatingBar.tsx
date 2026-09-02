import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/lib/format'

const HIDDEN_ON = ['/cart', '/checkout', '/login', '/register', '/verify', '/profile/addresses']

/** Persistent "view cart" bar — visible from any browse page whenever the cart isn't empty, hidden on the cart/checkout screens themselves. */
export function CartFloatingBar() {
  const { itemCount, subtotal, restaurantName } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  if (itemCount === 0 || HIDDEN_ON.some((p) => location.pathname.startsWith(p))) return null

  return (
    <button
      onClick={() => navigate('/cart')}
      className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-gradient-to-r from-brand-600 to-orange-600 py-2 pl-2 pr-2.5 text-white shadow-xl shadow-brand-900/25 ring-1 ring-white/10 animate-fade-in md:bottom-6 md:right-6 md:left-auto md:mx-0"
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
        <ShoppingBag size={18} />
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1 text-[10px] font-extrabold text-brand-700">
          {itemCount}
        </span>
      </span>

      <span className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-bold leading-tight">{formatCurrency(subtotal)}</p>
        <p className="truncate text-[11px] leading-tight text-white/75">
          {restaurantName ?? `${itemCount} item${itemCount > 1 ? 's' : ''} in cart`}
        </p>
      </span>

      <span className="flex shrink-0 items-center gap-0.5 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-brand-700">
        View Cart <ChevronRight size={14} />
      </span>
    </button>
  )
}
