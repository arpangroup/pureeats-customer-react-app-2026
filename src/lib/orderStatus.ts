import type { OrderStatus } from '@/types/entities'

export const ACTIVE_STATUSES: OrderStatus[] = ['PLACED', 'RESTAURANT_ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY']

/** A rider is physically on the order - the tracking map shows their live position. */
export const RIDER_ON_THE_WAY_STATUSES: OrderStatus[] = ['RIDER_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY']

/**
 * The backend's OrderStatusCode, keyed by both its constant name and its display label - order
 * detail and order list responses send the LABEL ("Rider Assigned", "Accepted"), while the status
 * poll and push payloads send the NAME ("RIDER_ASSIGNED"). Every status entering this app goes
 * through {@link normalizeOrderStatus}; comparing raw values is what kept the tracking map, the
 * home-page ongoing-order bar and the Cancel button from ever appearing.
 */
const BY_NAME_OR_LABEL: Record<string, OrderStatus> = {
  placed: 'PLACED',
  restaurant_accepted: 'RESTAURANT_ACCEPTED',
  accepted: 'RESTAURANT_ACCEPTED',
  preparing: 'PREPARING',
  ready_for_pickup: 'READY_FOR_PICKUP',
  'ready for pickup': 'READY_FOR_PICKUP',
  rider_assigned: 'RIDER_ASSIGNED',
  'rider assigned': 'RIDER_ASSIGNED',
  picked_up: 'PICKED_UP',
  'picked up': 'PICKED_UP',
  on_the_way: 'ON_THE_WAY',
  'on the way': 'ON_THE_WAY',
  delivered: 'DELIVERED',
  self_pickup_completed: 'SELF_PICKUP_COMPLETED',
  'delivered (self-pickup)': 'SELF_PICKUP_COMPLETED',
  cancelled: 'CANCELLED',
  rejected: 'REJECTED',
  returned: 'RETURNED',
  auto_cancelled: 'AUTO_CANCELLED',
  'auto-cancelled': 'AUTO_CANCELLED',
}

export function normalizeOrderStatus(raw: string | null | undefined): OrderStatus {
  const key = (raw ?? '').trim().toLowerCase()
  return BY_NAME_OR_LABEL[key] ?? BY_NAME_OR_LABEL[key.replace(/\s+/g, '_')] ?? 'PLACED'
}

/** `riderName`, once assigned, personalizes the rider-involved statuses ("John is on the way", "John picked up your order"). */
export function orderStatusLabel(status: OrderStatus, riderName?: string | null): string {
  const labels: Record<OrderStatus, string> = {
    PLACED: 'Order placed',
    RESTAURANT_ACCEPTED: 'Preparing your order',
    PREPARING: 'Preparing your order',
    READY_FOR_PICKUP: 'Ready for pickup',
    RIDER_ASSIGNED: riderName ? `${riderName} is heading to the restaurant` : 'Driver assigned',
    PICKED_UP: riderName ? `${riderName} picked up your order` : 'Out for delivery',
    ON_THE_WAY: riderName ? `${riderName} is on the way` : 'On the way',
    DELIVERED: 'Delivered',
    SELF_PICKUP_COMPLETED: 'Picked up',
    CANCELLED: 'Cancelled',
    REJECTED: 'Declined by the restaurant',
    RETURNED: 'Returned',
    AUTO_CANCELLED: 'Cancelled automatically',
  }
  return labels[status] ?? status
}

export function orderStatusTone(status: OrderStatus): 'brand' | 'green' | 'red' | 'slate' {
  if (status === 'DELIVERED' || status === 'SELF_PICKUP_COMPLETED') return 'green'
  if (status === 'CANCELLED' || status === 'REJECTED' || status === 'AUTO_CANCELLED' || status === 'RETURNED') return 'red'
  if (ACTIVE_STATUSES.includes(status)) return 'brand'
  return 'slate'
}
