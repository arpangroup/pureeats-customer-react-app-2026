import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { notificationsByUser } from '@/mocks/fixtures/notifications'
import type { AppNotification } from '@/types/entities'

interface LiveAlert {
  id: number
  data: { title?: string; body?: string; type?: string }
  isRead: boolean
  createdAt: string
}

function mapLive(a: LiveAlert): AppNotification {
  return { id: a.id, title: a.data?.title ?? 'Notification', body: a.data?.body ?? '', type: a.data?.type ?? null, isRead: a.isRead, createdAt: a.createdAt }
}

export const notificationService = {
  async list(userId: number): Promise<AppNotification[]> {
    if (IS_MOCK) {
      await mockDelay()
      return [...(notificationsByUser[userId] ?? [])].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    }
    const { data } = await apiClient.get<{ data: LiveAlert[] }>('/notifications')
    return data.data.map(mapLive)
  },

  async markRead(userId: number, id: number): Promise<void> {
    if (IS_MOCK) {
      await mockDelay(100)
      const n = notificationsByUser[userId]?.find((x) => x.id === id)
      if (n) n.isRead = true
      return
    }
    await apiClient.patch(`/notifications/${id}/read`)
  },

  async markAllRead(userId: number): Promise<void> {
    if (IS_MOCK) {
      await mockDelay(150)
      notificationsByUser[userId]?.forEach((n) => (n.isRead = true))
      return
    }
    await apiClient.patch('/notifications/read-all')
  },

  /** Registers/refreshes this device's FCM token — no-op in mock mode (there's no server to notify). */
  async registerPushToken(token: string): Promise<void> {
    if (IS_MOCK) return
    await apiClient.post('/notifications/push-token', { token })
  },

  async remove(userId: number, id: number): Promise<void> {
    if (IS_MOCK) {
      await mockDelay(100)
      const list = notificationsByUser[userId]
      if (list) {
        const index = list.findIndex((x) => x.id === id)
        if (index !== -1) list.splice(index, 1)
      }
      return
    }
    await apiClient.delete(`/notifications/${id}`)
  },
}
