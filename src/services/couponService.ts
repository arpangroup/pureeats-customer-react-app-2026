import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { toNumber } from '@/lib/format'
import { IS_MOCK } from '@/config/env'
import { coupons } from '@/mocks/fixtures/coupons'
import { ordersByUser } from '@/mocks/fixtures/orders'
import type { Coupon } from '@/types/entities'

export interface CouponApplyResult {
  couponId: number
  code: string
  discountAmount: number
  payableAmount: number
  waivesDelivery: boolean
}

function computeDiscount(coupon: Coupon, orderAmount: number): number {
  if (coupon.discountType === 'free_delivery') return 0
  if (coupon.discountType === 'percentage') {
    const raw = (orderAmount * coupon.discount) / 100
    return coupon.uptoAmount ? Math.min(raw, coupon.uptoAmount) : raw
  }
  return coupon.discount
}

export const couponService = {
  async listForRestaurant(restaurantId: number): Promise<Coupon[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      return coupons.filter((c) => c.isActive && (c.restaurantId === null || c.restaurantId === restaurantId))
    }
    const { data } = await apiClient.get<{ data: Coupon[] }>('/coupons', { params: { restaurantId } })
    return data.data
  },

  /** Coupons usable at any restaurant — powers the Home page offers strip. */
  async listGlobal(): Promise<Coupon[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      return coupons.filter((c) => c.isActive && c.restaurantId === null)
    }
    // TODO(backend): GET /coupons requires a restaurantId — no restaurant-agnostic
    // listing endpoint exists yet, so the Home page offers strip degrades gracefully.
    return []
  },

  /**
   * `userId` is nullable so a guest browsing pre-login can still preview a
   * coupon on the Cart page (only placing the order requires an account) —
   * a guest has no order history, so they're treated as first-order-eligible.
   * Live mode's `/coupons/preview` endpoint requires a bearer token though,
   * so a guest calling this against a real backend will still 401 there —
   * that's an existing backend constraint, not something the frontend can
   * route around.
   */
  async apply(userId: number | null, code: string, restaurantId: number, orderAmount: number): Promise<CouponApplyResult> {
    if (IS_MOCK) {
      await mockDelay(200)
      const coupon = coupons.find((c) => c.code.toUpperCase() === code.toUpperCase() && c.isActive)
      if (!coupon) throw { message: 'Invalid or expired coupon code.' }
      if (coupon.restaurantId !== null && coupon.restaurantId !== restaurantId) {
        throw { message: 'This coupon is not valid for this restaurant.' }
      }
      if (orderAmount < coupon.minOrderAmount) {
        throw { message: `Add items worth ₹${coupon.minOrderAmount - orderAmount} more to use this coupon.` }
      }
      if (coupon.firstOrderOnly && userId !== null && (ordersByUser[userId]?.length ?? 0) > 0) {
        throw { message: 'This coupon is valid only on your first order.' }
      }
      const discountAmount = computeDiscount(coupon, orderAmount)
      return { couponId: coupon.id, code: coupon.code, discountAmount, payableAmount: Math.max(0, orderAmount - discountAmount), waivesDelivery: coupon.discountType === 'free_delivery' }
    }
    const { data } = await apiClient.post<{ data: { couponId: number; code: string; discountAmount: string; payableAmount: string } }>('/coupons/preview', {
      code,
      restaurantId,
      orderAmount,
    })
    // The live preview response doesn't flag free-delivery coupons explicitly — a zero discount
    // on an otherwise-valid coupon apply is the closest available signal until the backend adds one.
    return {
      couponId: data.data.couponId,
      code: data.data.code,
      discountAmount: toNumber(data.data.discountAmount),
      payableAmount: toNumber(data.data.payableAmount),
      waivesDelivery: toNumber(data.data.discountAmount) === 0,
    }
  },
}
