import type { Restaurant, OrderDeliveryType } from '@/types/entities'

export interface AppliedCoupon {
  code: string
  discountAmount: number
  waivesDelivery: boolean
}

export interface OrderPricing {
  itemTotal: number
  tax: number
  restaurantCharge: number
  deliveryCharge: number
  discountAmount: number
  total: number
  payable: number
}

/** Single source of truth for order math — used by both the Cart page's live estimate and orderService.placeOrder's mock branch, so what the customer sees before checkout is exactly what they're charged. */
export function estimateOrderPricing(itemTotal: number, restaurant: Restaurant | null | undefined, deliveryType: OrderDeliveryType, coupon: AppliedCoupon | null, driverTipAmount = 0): OrderPricing {
  const tax = Math.round(itemTotal * 0.05)
  const restaurantCharge = Math.round(itemTotal * 0.05)
  const rawDeliveryCharge = deliveryType === 'SELF_PICKUP' ? 0 : restaurant?.deliveryCharge ?? 25
  const deliveryCharge = coupon?.waivesDelivery ? 0 : rawDeliveryCharge
  const discountAmount = coupon?.waivesDelivery ? rawDeliveryCharge : coupon?.discountAmount ?? 0
  const total = itemTotal + tax + restaurantCharge - (coupon?.waivesDelivery ? 0 : coupon?.discountAmount ?? 0)
  const payable = total + deliveryCharge + driverTipAmount
  return { itemTotal, tax, restaurantCharge, deliveryCharge, discountAmount, total, payable }
}
