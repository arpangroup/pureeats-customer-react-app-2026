import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bike, ChevronRight, Clock,Download, KeyRound, LifeBuoy, MapPin, Phone, RotateCcw, Star } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingBlock, EmptyState } from '@/components/ui/Feedback'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { OrderStatusTimeline } from '@/components/orders/OrderStatusTimeline'
import { OrderTrackingMap } from '@/components/maps/OrderTrackingMap'
import { DeliveryPartnerSheet } from '@/components/orders/DeliveryPartnerSheet'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { useAsync } from '@/hooks/useAsync'
import { useOrderStatusUpdates } from '@/hooks/useOrderStatusUpdates'
import { useLiveOrderTracking } from '@/hooks/useLiveOrderTracking'
import { useAuth } from '@/hooks/useAuth'
import { useActiveLocation } from '@/hooks/useLocation'
import { useCart } from '@/hooks/useCart'
import { orderService } from '@/services/orderService'
import { restaurantService } from '@/services/restaurantService'
import { orderStatusLabel, orderStatusTone, ACTIVE_STATUSES, RIDER_ON_THE_WAY_STATUSES } from '@/lib/orderStatus'
import { ARRIVING_SOON_SECONDS, formatEtaClock, useBufferedEta } from '@/lib/eta'
import { formatCurrency, classNames } from '@/lib/format'
import { IS_MOCK } from '@/config/env'
import { useState } from 'react'
import type { Order } from '@/types/entities'


function timeSince(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 90) return `${seconds}s`
  const minutes = Math.round(seconds / 60)
  return minutes < 90 ? `${minutes} min` : `${Math.round(minutes / 60)} h`
}

export default function OrderTrackingPage() {
  const { id } = useParams()
  const orderId = Number(id)
  const { user, isAuthenticated } = useAuth()
  const { activeAddress } = useActiveLocation()
  const navigate = useNavigate()
  const { data: order, isLoading, reload } = useOrderStatusUpdates(
    () => (user ? orderService.get(user.id, orderId) : Promise.resolve(undefined)),
    () => (user ? orderService.getStatus(user.id, orderId) : Promise.resolve(undefined)),
    [user?.id, orderId],
  )
  const { data: timeline } = useAsync(() => (user ? orderService.timeline(user.id, orderId) : Promise.resolve(undefined)), [user?.id, orderId, order?.status])
  const { data: restaurant } = useAsync(() => (order ? restaurantService.get(order.restaurantId) : Promise.resolve(undefined)), [order?.restaurantId])
  const tracking = useLiveOrderTracking(user?.id, orderId, order?.status)
  const cart = useCart()
  const [cancelling, setCancelling] = useState(false)
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)
  const [partnerSheetOpen, setPartnerSheetOpen] = useState(false)
  const [confirmReorderOpen, setConfirmReorderOpen] = useState(false)
  const [downloadingInvoice, setDownloadingInvoice] = useState(false)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)

  async function handleCancel() {
    if (!user) return
    setConfirmCancelOpen(false)
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

  /** Re-adds every line from this order at its *current* price — addon selections aren't replayed
   * (OrderItemAddon only snapshots a name/price, not the addonId a fresh cart line needs), so a
   * reordered item with addons comes back as the base item only. Always starts a fresh cart for
   * this restaurant (confirming first if it would clear a different restaurant's in-progress cart),
   * matching "Reorder" reading as "start over with what I got last time", not "merge into whatever's
   * already in my cart". */
  function performReorder(target: Order) {
    const items = target.items.map((item) => ({ itemId: item.itemId, name: item.name, price: item.price, image: target.restaurantImage, isVeg: false, addons: [], quantity: item.quantity }))
    cart.replaceCartWithItems(target.restaurantId, target.restaurantName, items)
    navigate('/cart')
  }

  function handleReorder() {
    if (!order) return
    if (cart.wouldReplaceRestaurant(order.restaurantId)) {
      setConfirmReorderOpen(true)
      return
    }
    performReorder(order)
  }

  async function handleDownloadInvoice() {
    if (!order) return
    setDownloadingInvoice(true)
    setInvoiceError(null)
    try {
      await orderService.downloadInvoice(order.id, order.uniqueOrderId)
    } catch (err) {
      setInvoiceError((err as { message?: string })?.message ?? 'Could not download the invoice.')
    } finally {
      setDownloadingInvoice(false)
    }
  }

  // Buffered (slowed-down) ETA while the order is on its way - see lib/eta.
  const etaSeconds = useBufferedEta(order?.etaMinutes, order?.createdAt, order?.etaSlowdownFactor, !!order && ACTIVE_STATUSES.includes(order.status))

  if (!isAuthenticated) {
    return (
      <div>
        <PageHeader title="Order" />
        <div className="mx-auto max-w-lg px-4 py-4">
          <RequireAuth title="Sign in to track this order" description="Order tracking lives with your account." />
        </div>
      </div>
    )
  }

  if (isLoading) return <LoadingBlock />
  if (!order) return <EmptyState title="Order not found" />

  const canCancel = order.legalNextStatuses.includes('CANCELLED')
  const canRate = order.status === 'DELIVERED' && !order.isRated
  const restaurantAccepted = order.status !== 'PLACED' && order.status !== 'CANCELLED'

  // Prefer the order's own coordinates from the tracking feed - the address currently selected in
  // the app may be a different one (or none, on a fresh device).
  const mapRestaurant = tracking?.restaurant ?? (restaurant && (restaurant.latitude || restaurant.longitude) ? { lat: restaurant.latitude, lng: restaurant.longitude } : null)
  const mapDestination = tracking?.destination ?? (activeAddress && (activeAddress.latitude || activeAddress.longitude) ? { lat: activeAddress.latitude, lng: activeAddress.longitude } : null)
  const showMap = ACTIVE_STATUSES.includes(order.status) && !!mapRestaurant && !!mapDestination
  const liveRider = RIDER_ON_THE_WAY_STATUSES.includes(order.status) ? tracking?.rider ?? null : null
  const statusToneClass = { brand: 'bg-brand-600', green: 'bg-emerald-600', red: 'bg-rose-600', slate: 'bg-slate-600' }[orderStatusTone(order.status)]

  return (
    <div>
      <PageHeader
        title={order.uniqueOrderId}
        actions={
          <button
            onClick={() => navigate('/support')}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            <LifeBuoy size={14} /> Support
          </button>
        }
      />

      <div className={classNames('px-4 py-4 text-center text-white', statusToneClass)}>
        <p className="text-lg font-bold">{orderStatusLabel(order.status, order.deliveryPartner?.name)}</p>
        {etaSeconds !== null && (
          <p className="mt-1 text-sm font-semibold text-white/95">
            {etaSeconds <= ARRIVING_SOON_SECONDS
              ? order.deliveryType === 'SELF_PICKUP'
                ? 'Ready any moment'
                : 'Arriving soon'
              : `${order.deliveryType === 'SELF_PICKUP' ? 'Ready in' : 'Arriving in'} ${formatEtaClock(etaSeconds)}`}
          </p>
        )}
        <p className="mt-0.5 text-xs text-white/80">Order {order.uniqueOrderId}</p>
      </div>

      {showMap && (
        // `isolate` keeps Leaflet's own high z-index panes (400+) inside the map, so sheets/dialogs
        // opened on this page (z-50) aren't drawn underneath it.
        <div className="relative isolate">
          <OrderTrackingMap
            restaurant={mapRestaurant!}
            destination={mapDestination!}
            status={order.status}
            rider={liveRider}
            path={liveRider ? tracking?.path : []}
            tall
          />
          {RIDER_ON_THE_WAY_STATUSES.includes(order.status) && (
            <span className="absolute left-3 top-3 z-[400] rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow dark:bg-slate-900/95 dark:text-slate-200">
              {liveRider
                ? liveRider.stale
                  ? `Last seen ${liveRider.updatedAt ? timeSince(liveRider.updatedAt) : 'a while'} ago`
                  : '● Live location'
                : 'Waiting for rider location…'}
            </span>
          )}
          {etaSeconds !== null && (
            // bottom-10 clears the details sheet, which overlaps the map's bottom edge (-mt-6).
            <div className="absolute bottom-10 right-3 z-[400] flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-lg dark:bg-slate-900/95">
              <Clock size={16} className="shrink-0 text-brand-600" />
              <div className="text-right leading-tight">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {order.deliveryType === 'SELF_PICKUP' ? 'Ready in' : 'ETA'}
                </p>
                <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {etaSeconds <= ARRIVING_SOON_SECONDS ? (order.deliveryType === 'SELF_PICKUP' ? 'Any moment' : 'Arriving soon') : formatEtaClock(etaSeconds)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        className={classNames(
          'mx-auto max-w-lg px-4 pb-4',
          showMap ? '-mt-6 rounded-t-3xl bg-white pt-4 shadow-[0_-8px_20px_-6px_rgba(15,23,42,0.15)] dark:bg-slate-950' : 'py-4',
        )}
      >
        {showMap && <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" aria-hidden="true" />}

        <div className="card p-4">
          <div className="flex items-center gap-3">
            {/* Store image + name open the store's page; the call button stays its own action. */}
            <Link to={`/restaurants/${order.restaurantId}`} className="flex min-w-0 flex-1 items-center gap-3" aria-label={`Open ${order.restaurantName}`}>
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                <img src={order.restaurantImage || restaurant?.image} alt="" className="h-full w-full object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-0.5 font-semibold text-slate-800 dark:text-slate-100">
                  <span className="truncate">{order.restaurantName}</span>
                  <ChevronRight size={16} className="shrink-0 text-slate-400" />
                </span>
                <span className="block text-xs text-slate-400">{order.items.reduce((n, i) => n + i.quantity, 0)} items · {formatCurrency(order.payable)}</span>
              </span>
            </Link>
            {restaurantAccepted && order.restaurantContactNumber && (
              <a
                href={`tel:${order.restaurantContactNumber}`}
                className="shrink-0 rounded-full bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                aria-label="Call restaurant"
              >
                <Phone size={16} />
              </a>
            )}
          </div>
        </div>

        {timeline && (
          <div className="card mt-4 p-4">
            <OrderStatusTimeline timeline={timeline} currentStatus={order.status} deliveryType={order.deliveryType} />
          </div>
        )}

        {order.deliveryPartner && (
          <div className="card mt-4 flex items-center gap-3 p-4">
            {/* Photo + name open the partner's profile sheet; the call button stays a direct action. */}
            <button
              type="button"
              onClick={() => setPartnerSheetOpen(true)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
              aria-label={`View ${order.deliveryPartner.name}'s profile`}
            >
              {order.deliveryPartner.photo ? (
                <img src={order.deliveryPartner.photo} alt={order.deliveryPartner.name} className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-brand-100 dark:ring-brand-500/30" />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15">
                  <Bike size={20} />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">{order.deliveryPartner.name}</span>
                <span className="block text-xs text-slate-400">
                  Your delivery partner{order.deliveryPartner.vehicleNumber ? ` · ${order.deliveryPartner.vehicleNumber}` : ''}
                </span>
                <span className="mt-0.5 block text-[11px] font-semibold text-brand-600 dark:text-brand-400">View profile ›</span>
              </span>
            </button>
            {order.deliveryPartner.phone && (
              <a href={`tel:${order.deliveryPartner.phone}`} className="rounded-full bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300" aria-label="Call rider">
                <Phone size={16} />
              </a>
            )}
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
        </div>

        <div className="card mt-4 p-4">
          <p className="mb-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200">Bill summary</p>
          <div className="space-y-1.5 text-sm">
            <BillRow label="Item total" value={formatCurrency(order.total)} />
            {order.coupon && order.discountAmount > 0 && (
              <BillRow label={`Coupon (${order.coupon.code})`} value={`-${formatCurrency(order.discountAmount)}`} tone="text-emerald-600" />
            )}
            <BillRow label="Taxes" value={formatCurrency(order.tax)} />
            <BillRow label="Restaurant charges" value={formatCurrency(order.restaurantCharge)} />
            <BillRow label="Delivery charge" value={order.deliveryCharge === 0 ? 'FREE' : formatCurrency(order.deliveryCharge)} tone={order.deliveryCharge === 0 ? 'text-emerald-600' : undefined} />
            {order.platformFee > 0 && <BillRow label="Platform fee" value={formatCurrency(order.platformFee)} />}
            {order.driverTipAmount > 0 && <BillRow label="Delivery tip" value={formatCurrency(order.driverTipAmount)} />}
            <div className="mt-1.5 flex items-center justify-between border-t border-slate-100 pt-1.5 text-base font-bold text-slate-800 dark:border-slate-800 dark:text-slate-100">
              <span>Grand total</span>
              <span>{formatCurrency(order.payable)}</span>
            </div>
          </div>

          <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <p>Paid via {order.paymentMode} on {new Date(order.createdAt).toLocaleString()}</p>
            <p className="truncate">{order.deliveryType === 'SELF_PICKUP' ? 'Picked up from' : 'Delivered to'}: {order.address}</p>
          </div>
        </div>

        {invoiceError && <p className="mt-3 text-xs text-rose-500">{invoiceError}</p>}

        <div className="mt-4 space-y-2.5">
          {canRate && (
            <button className="btn-primary flex w-full items-center justify-center gap-2" onClick={() => navigate(`/orders/${order.id}/rate`)}>
              <Star size={16} /> Rate your order
            </button>
          )}
          <div className="flex gap-2.5">
            <button className="btn-secondary flex flex-1 items-center justify-center gap-2" onClick={handleReorder}>
              <RotateCcw size={16} /> Reorder
            </button>
            {!IS_MOCK && (
              <button className="btn-secondary flex flex-1 items-center justify-center gap-2" disabled={downloadingInvoice} onClick={handleDownloadInvoice}>
                <Download size={16} /> {downloadingInvoice ? 'Preparing…' : 'Invoice'}
              </button>
            )}
          </div>
          {canCancel && (
            <button className="btn-secondary w-full text-rose-600" disabled={cancelling} onClick={() => setConfirmCancelOpen(true)}>
              {cancelling ? 'Cancelling…' : 'Cancel order'}
            </button>
          )}
        </div>

        {/* CartFloatingBar is `fixed` and floats over content rather than pushing it up — without
            this, the last card (items/total, or the rate/cancel buttons) renders underneath it. */}
        <div className="h-24 md:hidden" aria-hidden="true" />
      </div>

      {order.deliveryPartner && user && (
        <DeliveryPartnerSheet
          open={partnerSheetOpen}
          onClose={() => setPartnerSheetOpen(false)}
          userId={user.id}
          orderId={order.id}
          partner={order.deliveryPartner}
        />
      )}
      <ConfirmDialog
        open={confirmCancelOpen}
        title="Cancel this order?"
        description="This can't be undone. Any amount already paid will be refunded to your wallet."
        confirmLabel="Cancel order"
        onCancel={() => setConfirmCancelOpen(false)}
        onConfirm={handleCancel}
      />

      <ConfirmDialog
        open={confirmReorderOpen}
        title="Start a new cart?"
        description={`Your cart has items from ${cart.restaurantName}. Reordering from ${order.restaurantName} will clear it.`}
        confirmLabel="Clear cart & reorder"
        onCancel={() => setConfirmReorderOpen(false)}
        onConfirm={() => {
          setConfirmReorderOpen(false)
          performReorder(order)
        }}
      />
    </div>
  )
}

function BillRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={classNames('font-medium text-slate-700 dark:text-slate-200', tone)}>{value}</span>
    </div>
  )
}
