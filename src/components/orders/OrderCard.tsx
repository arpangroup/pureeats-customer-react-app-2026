import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/Feedback'
import { formatCurrency, formatDate } from '@/lib/format'
import { orderStatusLabel, orderStatusTone } from '@/lib/orderStatus'
import type { OrderSummary } from '@/types/entities'

export function OrderCard({ order }: { order: OrderSummary }) {
  return (
    <Link to={`/orders/${order.id}`} className="card flex items-center gap-3 p-3.5">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
        <img src={order.restaurantImage} alt={order.restaurantName} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{order.restaurantName}</p>
        <p className="mt-0.5 text-xs text-slate-400">{formatDate(order.createdAt)}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <Badge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{formatCurrency(order.payable)}</span>
        </div>
      </div>
      <ChevronRight size={16} className="shrink-0 text-slate-300" />
    </Link>
  )
}
