import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, MapPin, Search, ShoppingCart, UtensilsCrossed } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { useActiveLocation } from '@/hooks/useLocation'
import { initials } from '@/lib/format'

export function TopNavBar() {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()
  const { activeAddress } = useActiveLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 hidden border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 md:block">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-brand-600">
          <UtensilsCrossed size={22} />
          <span className="text-lg font-bold text-slate-800 dark:text-slate-100">PureEats</span>
        </Link>

        <button
          onClick={() => navigate('/profile/addresses')}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <MapPin size={16} className="text-brand-600" />
          <span className="max-w-[160px] truncate font-medium">{activeAddress ? activeAddress.tag ?? activeAddress.address : 'Set location'}</span>
          <ChevronDown size={14} />
        </button>

        <button
          onClick={() => navigate('/search')}
          className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-left text-sm text-slate-400 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
        >
          <Search size={16} />
          Search for restaurants and dishes
        </button>

        <button onClick={() => navigate('/cart')} className="relative shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          <ShoppingCart size={20} />
          {itemCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </button>

        <div className="relative shrink-0">
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
              {user ? initials(user.name) : '?'}
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.name}</p>
                  <p className="truncate text-xs text-slate-400">{user?.email}</p>
                </div>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                  My profile
                </Link>
                <Link to="/orders" onClick={() => setMenuOpen(false)} className="block px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                  My orders
                </Link>
                <button onClick={handleLogout} className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
