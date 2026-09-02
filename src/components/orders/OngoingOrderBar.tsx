import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike, ChevronRight } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { orderService } from '@/services/orderService'
import { orderStatusLabel, ACTIVE_STATUSES } from '@/lib/orderStatus'
import { classNames } from '@/lib/format'

const POLL_INTERVAL_MS = 15000

/** Sticky bottom banner on the Home page when the user has an order in flight — offsets above the cart bar/tab bar so both can be visible at once without overlapping. Polls so the status label ("Driver assigned", "John picked up your order"…) reflects the backend without a manual refresh. */
export function OngoingOrderBar() {
  const { user } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const { data: orders, reload } = useAsync(() => (user ? orderService.listMine(user.id) : Promise.resolve([])), [user?.id])

  useEffect(() => {
    if (!user) return
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') reload()
    }, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [user, reload])

  const activeOrder = orders?.find((o) => ACTIVE_STATUSES.includes(o.status))
  if (!activeOrder) return null

  return (
    <button
      onClick={() => navigate(`/orders/${activeOrder.id}`)}
      className={classNames(
        'fixed inset-x-3 z-30 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-slate-100 bg-white py-2 pl-2 pr-2.5 text-left shadow-xl shadow-slate-900/10 animate-fade-in dark:border-slate-800 dark:bg-slate-900 md:right-6 md:left-auto md:mx-0',
        itemCount > 0 ? 'bottom-[calc(9.5rem+env(safe-area-inset-bottom))] md:bottom-24' : 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6',
      )}
    >
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">
        <Bike size={19} />
        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white dark:bg-slate-900">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">{activeOrder.restaurantName}</p>
        <p className="truncate text-[11px] font-medium leading-tight text-brand-600 dark:text-brand-400">
          {orderStatusLabel(activeOrder.status, activeOrder.deliveryGuyName)}
        </p>
      </span>
      <span className="flex shrink-0 items-center gap-0.5 rounded-xl bg-brand-600 px-3 py-2.5 text-xs font-bold text-white">
        Track <ChevronRight size={14} />
      </span>
    </button>
  )
}
