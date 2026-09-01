import { useLocation, useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
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
      className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md items-center justify-between rounded-2xl bg-brand-600 px-4 py-3 text-white shadow-lg animate-fade-in md:bottom-6 md:right-6 md:left-auto md:mx-0"
    >
      <span className="flex items-center gap-2.5 text-sm font-semibold">
        <ShoppingBag size={18} />
        {itemCount} item{itemCount > 1 ? 's' : ''} · {formatCurrency(subtotal)}
        {restaurantName && <span className="hidden text-white/80 sm:inline">· {restaurantName}</span>}
      </span>
      <span className="text-sm font-bold">View Cart →</span>
    </button>
  )
}
