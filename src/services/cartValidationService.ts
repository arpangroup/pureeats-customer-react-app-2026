import { apiClient } from '@/lib/apiClient'
import type { OrderDeliveryType } from '@/types/entities'

export interface CartItemValidation {
  itemId: number
  available: boolean
  reason: string | null
}

export interface CartValidationResult {
  restaurant: { available: boolean; reason: string | null }
  items: CartItemValidation[]
  coupon: { valid: boolean; reason: string | null; discountAmount: number; waivesDelivery: boolean } | null
  pricing: {
    itemTotal: number
    discountAmount: number
    tax: number
    restaurantCharge: number
    deliveryCharge: number
    deliveryChargeBasis: string
    distanceKm: number
    payable: number
  }
  anyUnavailable: boolean
}

export interface DeliveryQuote {
  deliveryCharge: number
  distanceKm: number
  basis: string
}

export interface IpLocation {
  latitude: number | null
  longitude: number | null
  city: string | null
  country: string | null
}

export interface ValidateCartParams {
  restaurantId: number
  items: { itemId: number; quantity: number; selectedAddonIds: number[] | null }[]
  addressId: number | null
  couponCode: string | null
  deliveryType: OrderDeliveryType
}

/**
 * Live pre-checkout checks against the real backend — only meaningful in live mode (see
 * useCartValidation, which never calls this in mock mode, since there's no server-side rule
 * pipeline to ask). Authenticated users get the full validate() call; guests only ever use
 * ipLocation()/guestDeliveryQuote() since they have no address/order history to validate against.
 */
export const cartValidationService = {
  async validate(params: ValidateCartParams): Promise<CartValidationResult> {
    const { data } = await apiClient.post<{ data: CartValidationResult }>('/cart/validate', params)
    return data.data
  },

  async guestDeliveryQuote(restaurantId: number, lat: number, lng: number): Promise<DeliveryQuote> {
    const { data } = await apiClient.get<{ data: DeliveryQuote }>('/pricing/delivery-quote', { params: { restaurantId, lat, lng } })
    return data.data
  },

  async ipLocation(): Promise<IpLocation> {
    const { data } = await apiClient.get<{ data: IpLocation }>('/geo/ip-location')
    return data.data
  },
}
