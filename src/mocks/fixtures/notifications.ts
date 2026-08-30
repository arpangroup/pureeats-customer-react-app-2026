import type { AppNotification } from '@/types/entities'

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
}

export const notificationsByUser: Record<number, AppNotification[]> = {
  12: [
    { id: 1, title: 'Order placed!', body: 'Your order PE-2026-000501 has been placed and sent to the restaurant.', type: 'ORDER', isRead: false, createdAt: hoursAgo(0.2) },
    { id: 2, title: 'Order out for delivery', body: 'Your order PE-2026-000504 has been picked up and is on its way.', type: 'ORDER', isRead: false, createdAt: hoursAgo(1) },
    { id: 3, title: '50% OFF your first order!', body: 'Use WELCOME50 at checkout to save up to ₹100.', type: 'PROMO', isRead: true, createdAt: hoursAgo(48) },
    { id: 4, title: 'Order delivered', body: 'Your order PE-2026-000506 was delivered. Rate your experience!', type: 'ORDER', isRead: true, createdAt: hoursAgo(72) },
    { id: 5, title: 'Weekend special', body: 'Free delivery on orders above ₹149 with FREESHIP.', type: 'PROMO', isRead: true, createdAt: hoursAgo(96) },
  ],
  13: [
    { id: 6, title: 'Order delivered', body: 'Your order PE-2026-000510 was delivered.', type: 'ORDER', isRead: false, createdAt: hoursAgo(30) },
  ],
}
