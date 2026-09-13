import { Check } from 'lucide-react'
import { classNames, formatDate } from '@/lib/format'
import type { OrderDeliveryType, OrderStatus, OrderTimeline } from '@/types/entities'

const DELIVERY_STEPS: { status: OrderStatus; label: string; field: keyof OrderTimeline }[] = [
  { status: 'PLACED', label: 'Order placed', field: 'placedAt' },
  { status: 'RESTAURANT_ACCEPTED', label: 'Restaurant accepted', field: 'restaurantAcceptedAt' },
  { status: 'READY_FOR_PICKUP', label: 'Ready for pickup', field: 'restaurantReadyAt' },
  { status: 'RIDER_ASSIGNED', label: 'Rider assigned', field: 'riderAssignedAt' },
  { status: 'PICKED_UP', label: 'Picked up', field: 'pickedUpAt' },
  { status: 'DELIVERED', label: 'Delivered', field: 'deliveredAt' },
]

// A self-pickup order never gets a rider - the backend's own status flow for one skips straight
// from READY_FOR_PICKUP to SELF_PICKUP_COMPLETED (see OrderStatusCode's javadoc), so the timeline
// must branch on the order's deliveryType, not on whichever status it happens to be at right now
// (RIDER_ASSIGNED/PICKED_UP/DELIVERED never fire for self-pickup at all).
const SELF_PICKUP_STEPS: { status: OrderStatus; label: string; field: keyof OrderTimeline }[] = [
  { status: 'PLACED', label: 'Order placed', field: 'placedAt' },
  { status: 'RESTAURANT_ACCEPTED', label: 'Restaurant accepted', field: 'restaurantAcceptedAt' },
  { status: 'READY_FOR_PICKUP', label: 'Ready for pickup', field: 'restaurantReadyAt' },
  { status: 'SELF_PICKUP_COMPLETED', label: 'Picked up', field: 'selfPickupCompletedAt' },
]

export function OrderStatusTimeline({
  timeline,
  currentStatus,
  deliveryType,
}: {
  timeline: OrderTimeline
  currentStatus: OrderStatus
  deliveryType: OrderDeliveryType
}) {
  if (currentStatus === 'CANCELLED') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 dark:bg-rose-500/10">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/20">✕</span>
        <div>
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">Order cancelled</p>
          {timeline.cancelledAt && <p className="text-xs text-rose-500">{formatDate(timeline.cancelledAt)}</p>}
        </div>
      </div>
    )
  }

  const steps = deliveryType === 'SELF_PICKUP' ? SELF_PICKUP_STEPS : DELIVERY_STEPS

  return (
    <ol>
      {steps.map((step, index) => {
        const timestamp = timeline[step.field]
        const done = !!timestamp
        const isLast = index === steps.length - 1
        return (
          <li key={step.status} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && <span className={classNames('absolute left-[13px] top-6 h-full w-0.5', done ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700')} />}
            <span
              className={classNames(
                'z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400 dark:bg-slate-700',
              )}
            >
              {done && <Check size={14} strokeWidth={3} />}
            </span>
            <div>
              <p className={classNames('text-sm font-semibold', done ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400')}>{step.label}</p>
              {timestamp && <p className="text-xs text-slate-400">{formatDate(timestamp)}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
