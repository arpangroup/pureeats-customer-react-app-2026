import type { OrderStatus } from '@/types/entities'

export const ACTIVE_STATUSES: OrderStatus[] = ['PLACED', 'RESTAURANT_ACCEPTED', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP']

export function orderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    PLACED: 'Order placed',
    RESTAURANT_ACCEPTED: 'Preparing your order',
    READY_FOR_PICKUP: 'Ready for pickup',
    RIDER_ASSIGNED: 'Rider on the way to restaurant',
    PICKED_UP: 'Out for delivery',
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
