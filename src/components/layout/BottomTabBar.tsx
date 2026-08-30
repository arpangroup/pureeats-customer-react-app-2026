import { NavLink } from 'react-router-dom'
import { Home, Search, ShoppingBag, ShoppingCart, User } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { classNames } from '@/lib/format'

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/search', label: 'Search', icon: Search, end: false },
  { to: '/orders', label: 'Orders', icon: ShoppingBag, end: false },
  { to: '/cart', label: 'Cart', icon: ShoppingCart, end: false },
  { to: '/profile', label: 'Profile', icon: User, end: false },
] as const

export function BottomTabBar() {
  const { itemCount } = useCart()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white pb-safe pt-1.5 dark:border-slate-800 dark:bg-slate-900 md:hidden">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            classNames(
              'relative flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors',
              isActive ? 'text-brand-600' : 'text-slate-400 dark:text-slate-500',
            )
          }
        >
          <span className="relative">
            <Icon size={22} strokeWidth={2.25} />
            {to === '/cart' && itemCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </span>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
