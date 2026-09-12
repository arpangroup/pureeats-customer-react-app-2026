import { apiClient } from '@/lib/apiClient'
import { mockDelay, nextMockId } from '@/lib/mockUtils'
import { toNumber } from '@/lib/format'
import { estimateOrderPricing } from '@/lib/pricing'
import { IS_MOCK } from '@/config/env'
import { ordersByUser } from '@/mocks/fixtures/orders'
import { restaurants } from '@/mocks/fixtures/restaurants'
import type { Order, OrderDeliveryPartner, OrderItem, OrderItemAddon, OrderStatus, OrderSummary, OrderTimeline, PaymentMode, OrderDeliveryType } from '@/types/entities'

export interface PlaceOrderInput {
  restaurantId: number
  addressId: number
  address: string
  items: { itemId: number; name: string; price: number; quantity: number; addons: OrderItemAddon[] }[]
  paymentMode: PaymentMode
  deliveryType: OrderDeliveryType
  coupon: { code: string; discountAmount: number; waivesDelivery: boolean } | null
  orderComment: string | null
  driverTipAmount: number
  /** Only set (and only checked server-side) when paymentMode maps to RAZORPAY — the three values Razorpay Checkout's success handler returns. See paymentService.ts and CheckoutPage's Razorpay flow. */
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpaySignature?: string
}

/** Every status a legal next transition can lead to — mirrors the backend's OrderTransitionService state machine. */
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ['RESTAURANT_ACCEPTED', 'CANCELLED'],
  RESTAURANT_ACCEPTED: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['RIDER_ASSIGNED', 'SELF_PICKUP_COMPLETED'],
  RIDER_ASSIGNED: ['PICKED_UP'],
  PICKED_UP: ['DELIVERED'],
  DELIVERED: [],
  SELF_PICKUP_COMPLETED: [],
  CANCELLED: [],
}

function randomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

function toSummary(order: Order): OrderSummary {
  return {
    id: order.id,
    uniqueOrderId: order.uniqueOrderId,
    status: order.status,
    restaurantId: order.restaurantId,
    restaurantName: order.restaurantName,
    restaurantImage: order.restaurantImage,
    total: order.total,
    payable: order.payable,
    createdAt: order.createdAt,
    isRated: order.isRated,
    deliveryGuyName: order.deliveryPartner?.name ?? null,
  }
}

interface LiveOrderDetail {
  id: number
  uniqueOrderId: string
  status: string
  customer: { name: string }
  restaurant: { id: number; name: string; contactNumber: string; image: string | null }
  coupon: { couponId: number | null; code: string; name: string; discountType: string; discountAmount: string } | null
  items: { id: number; itemId: number; name: string; quantity: number; price: string; addons: { addonCategoryName: string; addonName: string; addonPrice: string }[] }[]
  address: string
  tax: string
  restaurantCharge: string
  deliveryCharge: string
  platformFee: string
  driverTipAmount: string
  discountAmount: string
  total: string
  payable: string
  paymentMode: string
  deliveryPin: string
  orderComment: string | null
  deliveryType: number
  createdAt: string
  legalNextStatuses: string[]
  deliveryGuyId: number | null
  deliveryGuyName: string | null
  deliveryPartner: { id: number; name: string; phone: string | null; photo: string | null; vehicleNumber: string | null } | null
}

function mapLiveItem(i: LiveOrderDetail['items'][number]): OrderItem {
  return { id: i.id, itemId: i.itemId, name: i.name, quantity: i.quantity, price: toNumber(i.price), addons: i.addons.map((a) => ({ addonCategoryName: a.addonCategoryName, addonName: a.addonName, addonPrice: toNumber(a.addonPrice) })) }
}

function mapLiveDeliveryPartner(d: LiveOrderDetail['deliveryPartner']): OrderDeliveryPartner | null {
  if (!d) return null
  return { id: d.id, name: d.name, phone: d.phone, photo: d.photo, vehicleNumber: d.vehicleNumber }
}

function mapLiveOrder(d: LiveOrderDetail): Order {
  return {
    id: d.id,
    uniqueOrderId: d.uniqueOrderId,
    status: d.status as OrderStatus,
    restaurantId: d.restaurant.id,
    restaurantName: d.restaurant.name,
    restaurantImage: d.restaurant.image ?? '',
    restaurantContactNumber: d.restaurant.contactNumber,
    address: d.address,
    items: d.items.map(mapLiveItem),
    coupon: d.coupon ? { couponId: d.coupon.couponId, code: d.coupon.code, name: d.coupon.name, discountType: d.coupon.discountType, discountAmount: toNumber(d.coupon.discountAmount) } : null,
    tax: toNumber(d.tax),
    restaurantCharge: toNumber(d.restaurantCharge),
    deliveryCharge: toNumber(d.deliveryCharge),
    platformFee: toNumber(d.platformFee),
    driverTipAmount: toNumber(d.driverTipAmount),
    discountAmount: toNumber(d.discountAmount),
    total: toNumber(d.total),
    payable: toNumber(d.payable),
    paymentMode: d.paymentMode,
    deliveryPin: d.deliveryPin,
    orderComment: d.orderComment,
    deliveryType: d.deliveryType === 1 ? 'SELF_PICKUP' : 'DELIVERY',
    createdAt: d.createdAt,
    legalNextStatuses: d.legalNextStatuses as OrderStatus[],
    pricingBreakdown: null,
    deliveryGuyId: d.deliveryGuyId,
    deliveryGuyName: d.deliveryGuyName,
    deliveryPartner: mapLiveDeliveryPartner(d.deliveryPartner),
    isRated: false,
  }
}

export const orderService = {
  async placeOrder(userId: number, input: PlaceOrderInput): Promise<Order> {
    if (IS_MOCK) {
      await mockDelay(500)
      const restaurant = restaurants.find((r) => r.id === input.restaurantId)
      const itemTotal = input.items.reduce((sum, i) => sum + (i.price + i.addons.reduce((a, ad) => a + ad.addonPrice, 0)) * i.quantity, 0)
      const { tax, restaurantCharge, deliveryCharge, discountAmount, total, payable } = estimateOrderPricing(itemTotal, restaurant, input.deliveryType, input.coupon, input.driverTipAmount)

      const order: Order = {
        id: nextMockId(),
        uniqueOrderId: `PE-${new Date().getFullYear()}-${String(nextMockId()).slice(-6)}`,
        status: 'PLACED',
        restaurantId: input.restaurantId,
        restaurantName: restaurant?.name ?? 'Restaurant',
        restaurantImage: restaurant?.image ?? '',
        restaurantContactNumber: restaurant?.contactNumber ?? '',
        address: input.address,
        items: input.items.map((i, index) => ({ id: index + 1, itemId: i.itemId, name: i.name, quantity: i.quantity, price: i.price, addons: i.addons })),
        coupon: input.coupon ? { couponId: null, code: input.coupon.code, name: input.coupon.code, discountType: input.coupon.waivesDelivery ? 'free_delivery' : 'flat', discountAmount } : null,
        tax,
        restaurantCharge,
        deliveryCharge,
        platformFee: 0,
        driverTipAmount: input.driverTipAmount,
        discountAmount,
        total,
        payable,
        paymentMode: input.paymentMode,
        deliveryPin: randomPin(),
        orderComment: input.orderComment,
        deliveryType: input.deliveryType,
        createdAt: new Date().toISOString(),
        legalNextStatuses: NEXT_STATUSES.PLACED,
        pricingBreakdown: null,
        deliveryGuyId: null,
        deliveryGuyName: null,
        deliveryPartner: null,
        isRated: false,
      }
      ordersByUser[userId] = [order, ...(ordersByUser[userId] ?? [])]
      return order
    }
    const { data } = await apiClient.post<{ data: LiveOrderDetail }>('/orders', {
      restaurantId: input.restaurantId,
      addressId: input.addressId,
      items: input.items.map((i) => ({ itemId: i.itemId, quantity: i.quantity, selectedAddonIds: null })),
      // The backend's PaymentMode enum has no bare UPI value — it names payment by gateway
      // (COD, WALLET, RAZORPAY, PAYTM, ...) since only COD/WALLET are actually processed server-side;
      // everything else is just recorded. RAZORPAY is the closest real value for "paid via UPI".
      paymentMode: input.paymentMode === 'UPI' ? 'RAZORPAY' : input.paymentMode,
      deliveryType: input.deliveryType,
      couponCode: input.coupon?.code ?? null,
      orderComment: input.orderComment,
      driverTipAmount: input.driverTipAmount,
      razorpayOrderId: input.razorpayOrderId ?? null,
      razorpayPaymentId: input.razorpayPaymentId ?? null,
      razorpaySignature: input.razorpaySignature ?? null,
    })
    return mapLiveOrder(data.data)
  },

  async listMine(userId: number): Promise<OrderSummary[]> {
    if (IS_MOCK) {
      await mockDelay()
      return (ordersByUser[userId] ?? []).map(toSummary).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    }
    const { data } = await apiClient.get<{ data: { id: number; uniqueOrderId: string; status: string; restaurantId: number; restaurantName?: string; restaurantImage?: string | null; total: string; createdAt: string; deliveryGuyName?: string | null }[] }>('/orders')
    return data.data.map((o) => ({ id: o.id, uniqueOrderId: o.uniqueOrderId, status: o.status as OrderStatus, restaurantId: o.restaurantId, restaurantName: o.restaurantName ?? 'Restaurant', restaurantImage: o.restaurantImage ?? '', total: toNumber(o.total), payable: toNumber(o.total), createdAt: o.createdAt, isRated: false, deliveryGuyName: o.deliveryGuyName ?? null }))
  },

  async get(userId: number, id: number): Promise<Order | undefined> {
    if (IS_MOCK) {
      await mockDelay()
      return Object.values(ordersByUser).flat().find((o) => o.id === id)
    }
    const { data } = await apiClient.get<{ data: LiveOrderDetail }>(`/orders/${id}`)
    return mapLiveOrder(data.data)
  },

  /**
   * The cheap poll target for order tracking — status + last-updated only, none of the
   * customer/restaurant/coupon/items/rider joins `get()` costs on the backend. A polling client
   * should call this on every tick and only fall back to `get()` when the snapshot actually changed.
   */
  async getStatus(userId: number, id: number): Promise<{ status: OrderStatus; updatedAt: string } | undefined> {
    if (IS_MOCK) {
      await mockDelay(80)
      const order = Object.values(ordersByUser).flat().find((o) => o.id === id)
      return order ? { status: order.status, updatedAt: order.createdAt } : undefined
    }
    const { data } = await apiClient.get<{ data: { status: string; updatedAt: string } }>(`/orders/${id}/status`)
    return { status: data.data.status as OrderStatus, updatedAt: data.data.updatedAt }
  },

  async cancel(userId: number, id: number): Promise<void> {
    if (IS_MOCK) {
      await mockDelay()
      const order = ordersByUser[userId]?.find((o) => o.id === id)
      if (!order) throw { message: 'Order not found' }
      if (!order.legalNextStatuses.includes('CANCELLED')) throw { message: 'This order can no longer be cancelled.' }
      order.status = 'CANCELLED'
      order.legalNextStatuses = []
      return
    }
    await apiClient.patch(`/orders/${id}/cancel`)
  },

  async confirmDelivery(userId: number, id: number, deliveryPin: string): Promise<Order> {
    if (IS_MOCK) {
      await mockDelay()
      const order = ordersByUser[userId]?.find((o) => o.id === id)
      if (!order) throw { message: 'Order not found' }
      if (order.deliveryPin !== deliveryPin) throw { message: 'Incorrect delivery PIN.' }
      order.status = 'DELIVERED'
      order.legalNextStatuses = []
      return order
    }
    const { data } = await apiClient.patch<{ data: LiveOrderDetail }>(`/orders/${id}/confirm-delivery`, { deliveryPin })
    return mapLiveOrder(data.data)
  },

  /** Downloads the PDF invoice and triggers a browser save — no mock-mode equivalent (there's no PDF to generate client-side), so this simply isn't offered when IS_MOCK. */
  async downloadInvoice(id: number, uniqueOrderId: string): Promise<void> {
    const { data } = await apiClient.get<Blob>(`/orders/${id}/invoice`, { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${uniqueOrderId}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },

  async timeline(userId: number, id: number): Promise<OrderTimeline> {
    if (IS_MOCK) {
      await mockDelay(150)
      const order = Object.values(ordersByUser).flat().find((o) => o.id === id)
      const empty: OrderTimeline = { placedAt: null, restaurantAcceptedAt: null, restaurantReadyAt: null, riderAssignedAt: null, pickedUpAt: null, deliveredAt: null, selfPickupCompletedAt: null, cancelledAt: null }
      if (!order) return empty
      const order_: Record<OrderStatus, keyof OrderTimeline> = {
        PLACED: 'placedAt', RESTAURANT_ACCEPTED: 'restaurantAcceptedAt', READY_FOR_PICKUP: 'restaurantReadyAt',
        RIDER_ASSIGNED: 'riderAssignedAt', PICKED_UP: 'pickedUpAt', DELIVERED: 'deliveredAt',
        SELF_PICKUP_COMPLETED: 'selfPickupCompletedAt', CANCELLED: 'cancelledAt',
      }
      const progression: OrderStatus[] = ['PLACED', 'RESTAURANT_ACCEPTED', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP', 'DELIVERED']
      const currentIndex = progression.indexOf(order.status)
      const timeline = { ...empty }
      timeline.placedAt = order.createdAt
      if (order.status === 'CANCELLED') {
        timeline.cancelledAt = order.createdAt
      } else if (order.status === 'SELF_PICKUP_COMPLETED') {
        timeline.restaurantAcceptedAt = order.createdAt
        timeline.restaurantReadyAt = order.createdAt
        timeline.selfPickupCompletedAt = order.createdAt
      } else {
        progression.slice(1, currentIndex + 1).forEach((status) => {
          timeline[order_[status]] = order.createdAt
        })
      }
      return timeline
    }
    const { data } = await apiClient.get<{ data: OrderTimeline }>(`/orders/${id}/timeline`)
    return data.data
  },
}
