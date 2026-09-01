import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike } from 'lucide-react'
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
        'fixed inset-x-3 z-30 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-brand-200 bg-white px-4 py-3 text-left shadow-lg animate-fade-in dark:border-brand-500/30 dark:bg-slate-900 md:right-6 md:left-auto md:mx-0',
        itemCount > 0 ? 'bottom-[calc(9.5rem+env(safe-area-inset-bottom))] md:bottom-24' : 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6',
      )}
    >
      <span className="flex h-10 w-10 shrink-0 animate-pulse items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15">
        <Bike size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{activeOrder.restaurantName}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{orderStatusLabel(activeOrder.status, activeOrder.deliveryGuyName)}</p>
      </div>
      <span className="shrink-0 text-sm font-bold text-brand-600">View →</span>
    </button>
  )
}
