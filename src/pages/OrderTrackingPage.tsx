import { useNavigate, useParams } from 'react-router-dom'
import { Bike, KeyRound, MapPin, Phone, Star } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingBlock, EmptyState } from '@/components/ui/Feedback'
import { OrderStatusTimeline } from '@/components/orders/OrderStatusTimeline'
import { OrderTrackingMap } from '@/components/maps/OrderTrackingMap'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { useActiveLocation } from '@/hooks/useLocation'
import { orderService } from '@/services/orderService'
import { restaurantService } from '@/services/restaurantService'
import { formatCurrency } from '@/lib/format'
import { useState } from 'react'

const TRACKABLE_STATUSES = ['PLACED', 'RESTAURANT_ACCEPTED', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP']

export default function OrderTrackingPage() {
  const { id } = useParams()
  const orderId = Number(id)
  const { user } = useAuth()
  const { activeAddress } = useActiveLocation()
  const navigate = useNavigate()
  const { data: order, isLoading, reload } = useAsync(() => (user ? orderService.get(user.id, orderId) : Promise.resolve(undefined)), [user?.id, orderId])
  const { data: timeline } = useAsync(() => (user ? orderService.timeline(user.id, orderId) : Promise.resolve(undefined)), [user?.id, orderId])
  const { data: restaurant } = useAsync(() => (order ? restaurantService.get(order.restaurantId) : Promise.resolve(undefined)), [order?.restaurantId])
  const [cancelling, setCancelling] = useState(false)

  if (isLoading) return <LoadingBlock />
  if (!order) return <EmptyState title="Order not found" />

  const canCancel = order.legalNextStatuses.includes('CANCELLED')
  const canRate = order.status === 'DELIVERED' && !order.isRated

  async function handleCancel() {
    if (!user || !window.confirm('Cancel this order?')) return
    setCancelling(true)
    try {
      await orderService.cancel(user.id, orderId)
      reload()
    } catch {
      // ignore — order stays as-is on failure
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div>
      <PageHeader title={order.uniqueOrderId} />
      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
              <img src={order.restaurantImage} alt={order.restaurantName} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{order.restaurantName}</p>
              <p className="text-xs text-slate-400">{order.items.reduce((n, i) => n + i.quantity, 0)} items · {formatCurrency(order.payable)}</p>
            </div>
          </div>
        </div>

        {TRACKABLE_STATUSES.includes(order.status) && restaurant && activeAddress && (
          <div className="card mt-4 overflow-hidden p-2">
            <OrderTrackingMap
              restaurant={{ lat: restaurant.latitude, lng: restaurant.longitude }}
              destination={{ lat: activeAddress.latitude, lng: activeAddress.longitude }}
              status={order.status}
            />
          </div>
        )}

        {timeline && (
          <div className="card mt-4 p-4">
            <OrderStatusTimeline timeline={timeline} currentStatus={order.status} />
          </div>
        )}

        {order.deliveryGuyName && (
          <div className="card mt-4 flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15">
              <Bike size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{order.deliveryGuyName}</p>
              <p className="text-xs text-slate-400">Your delivery partner</p>
            </div>
            <a href="tel:" className="rounded-full bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300" aria-label="Call rider">
              <Phone size={16} />
            </a>
          </div>
        )}

        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && order.status !== 'SELF_PICKUP_COMPLETED' && (
          <div className="card mt-4 flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
              <KeyRound size={18} />
            </span>
            <div>
              <p className="text-xs text-slate-400">Share this PIN with your delivery partner</p>
              <p className="text-lg font-bold tracking-widest text-slate-800 dark:text-slate-100">{order.deliveryPin}</p>
            </div>
          </div>
        )}

        <div className="card mt-4 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <MapPin size={15} className="text-brand-600" /> Delivery address
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{order.address}</p>
        </div>

        <div className="card mt-4 divide-y divide-slate-100 p-4 dark:divide-slate-800">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between py-2 text-sm first:pt-0 last:pb-0">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  {item.quantity} × {item.name}
                </p>
                {item.addons.length > 0 && <p className="text-xs text-slate-400">{item.addons.map((a) => a.addonName).join(', ')}</p>}
              </div>
              <p className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(item.price * item.quantity)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 text-base font-bold text-slate-800 dark:text-slate-100">
            <span>Total</span>
            <span>{formatCurrency(order.payable)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {canRate && (
            <button className="btn-primary flex w-full items-center justify-center gap-2" onClick={() => navigate(`/orders/${order.id}/rate`)}>
              <Star size={16} /> Rate your order
            </button>
          )}
          {canCancel && (
            <button className="btn-secondary w-full text-rose-600" disabled={cancelling} onClick={handleCancel}>
              {cancelling ? 'Cancelling…' : 'Cancel order'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
