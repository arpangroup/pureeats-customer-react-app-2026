import { apiClient } from '@/lib/apiClient'
import { mockDelay, nextMockId } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { ratings } from '@/mocks/fixtures/ratings'
import { ordersByUser } from '@/mocks/fixtures/orders'
import type { Rating, RateableType } from '@/types/entities'

export interface RatableOrder {
  orderId: number
  uniqueOrderId: string
  restaurantId: number
  restaurantName: string
  deliveryGuyId: number | null
}

export interface SubmitRatingInput {
  orderId: number
  rateableType: RateableType
  rateableId: number
  rating: number
  comment: string | null
  tags: string[]
}

export const ratingService = {
  /** Delivered orders the user hasn't rated yet — mirrors GET /ratings/ratable-orders. */
  async ratableOrders(userId: number): Promise<RatableOrder[]> {
    if (IS_MOCK) {
      await mockDelay()
      return (ordersByUser[userId] ?? [])
        .filter((o) => o.status === 'DELIVERED' && !o.isRated)
        .map((o) => ({ orderId: o.id, uniqueOrderId: o.uniqueOrderId, restaurantId: o.restaurantId, restaurantName: o.restaurantName, deliveryGuyId: o.deliveryGuyId }))
    }
    const { data } = await apiClient.get<{ data: RatableOrder[] }>('/ratings/ratable-orders')
    return data.data
  },

  async submit(userId: number, userName: string, payload: SubmitRatingInput): Promise<Rating> {
    if (IS_MOCK) {
      await mockDelay()
      const created: Rating = {
        id: nextMockId(),
        orderId: payload.orderId,
        rateableType: payload.rateableType,
        rateableId: payload.rateableId,
        rating: payload.rating,
        comment: payload.comment,
        tags: payload.tags,
        raterName: userName,
        createdAt: new Date().toISOString(),
      }
      ratings.push(created)
      if (payload.rateableType === 'RESTAURANT') {
        const order = ordersByUser[userId]?.find((o) => o.id === payload.orderId)
        if (order) order.isRated = true
      }
      return created
    }
    const { data } = await apiClient.post<{ data: Rating }>('/ratings', payload)
    return data.data
  },

  async forRestaurant(restaurantId: number): Promise<Rating[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      return ratings.filter((r) => r.rateableType === 'RESTAURANT' && r.rateableId === restaurantId)
    }
    const { data } = await apiClient.get<{ data: Rating[] }>(`/ratings/restaurants/${restaurantId}`)
    return data.data
  },
}
