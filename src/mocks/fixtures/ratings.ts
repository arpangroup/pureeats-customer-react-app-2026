import type { Rating } from '@/types/entities'

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
}

export const ratings: Rating[] = [
  { id: 1, orderId: 506, rateableType: 'RESTAURANT', rateableId: 1, rating: 5, comment: 'Amazing butter chicken, super fresh!', tags: ['Tasty', 'On time'], raterName: 'Demo Customer One', createdAt: hoursAgo(70) },
  { id: 2, orderId: 506, rateableType: 'DRIVER', rateableId: 11, rating: 5, comment: 'Very polite and quick.', tags: ['Friendly', 'Fast'], raterName: 'Demo Customer One', createdAt: hoursAgo(70) },
]
