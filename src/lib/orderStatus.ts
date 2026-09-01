import type { OrderStatus } from '@/types/entities'

export const ACTIVE_STATUSES: OrderStatus[] = ['PLACED', 'RESTAURANT_ACCEPTED', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP']

/** `riderName`, once assigned, personalizes the two rider-involved statuses ("John is on the way", "John picked up your order"). */
export function orderStatusLabel(status: OrderStatus, riderName?: string | null): string {
  const labels: Record<OrderStatus, string> = {
    PLACED: 'Order placed',
    RESTAURANT_ACCEPTED: 'Preparing your order',
    READY_FOR_PICKUP: 'Ready for pickup',
    RIDER_ASSIGNED: riderName ? `${riderName} is heading to the restaurant` : 'Driver assigned',
    PICKED_UP: riderName ? `${riderName} picked up your order` : 'Out for delivery',
    DELIVERED: 'Delivered',
    SELF_PICKUP_COMPLETED: 'Picked up',
    CANCELLED: 'Cancelled',
  }
  return labels[status]
}

export function orderStatusTone(status: OrderStatus): 'brand' | 'green' | 'red' | 'slate' {
  if (status === 'DELIVERED' || status === 'SELF_PICKUP_COMPLETED') return 'green'
  if (status === 'CANCELLED') return 'red'
  if (ACTIVE_STATUSES.includes(status)) return 'brand'
  return 'slate'
}
