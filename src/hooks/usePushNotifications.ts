import { useEffect, useState } from 'react'
import { useAppConfig } from '@/context/AppConfigContext'
import { useAuth } from '@/hooks/useAuth'
import { onForegroundMessage, requestPushToken } from '@/lib/firebaseMessaging'
import { notificationService } from '@/services/notificationService'

export interface PushToastState {
  title: string
  body: string
  image?: string
  clickAction?: string
}

/**
 * App-wide push notification registration + foreground display — mounted once via
 * PushNotificationBootstrap (see components/layout), independent of any one page. Registers this
 * device's FCM token whenever a customer is signed in and Firebase is configured (admin-set or env
 * fallback, see AppConfigContext), regardless of whether they're on an order-tracking page.
 *
 * useOrderStatusUpdates also requests a token and subscribes to foreground messages, scoped to
 * triggering an order-tracking reload — that's a narrower, additional subscription for one page's
 * own data refresh, not a replacement for this one. Multiple onMessage subscribers are fine;
 * Firebase fans the same message out to each independently, and re-registering the same token is a
 * harmless no-op server-side.
 */
export function usePushNotifications() {
  const { user } = useAuth()
  const { firebaseConfig, hasFirebaseConfig } = useAppConfig()
  const [toast, setToast] = useState<PushToastState | null>(null)

  useEffect(() => {
    if (!user || !hasFirebaseConfig) return
    let cancelled = false

    requestPushToken(firebaseConfig).then((token) => {
      if (cancelled || !token) return
      notificationService
        .registerPushToken(token)
        .then(() => console.info('[push] token registered with backend'))
        .catch((err) => console.error('[push] POST /notifications/push-token failed', err))
    })

    const unsubscribe = onForegroundMessage(firebaseConfig, (payload) => {
      // A SILENT push (see PushDisplayMode on the backend — order-status ticks, etc.) never has a
      // `notification` block, on purpose — that's the whole signal that nothing should pop up here.
      // Other listeners (useOrderStatusUpdates, OngoingOrderBar) have their own onMessage
      // subscriptions and still get every message regardless of what this one does with it.
      if (!payload.notification) return
      const title = payload.notification.title || 'PureEats'
      const body = payload.notification.body || ''
      const image = payload.notification.image
      const clickAction = payload.fcmOptions?.link || payload.data?.click_action
      setToast({ title, body, image, clickAction })
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, hasFirebaseConfig])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(timer)
  }, [toast])

  return { toast, dismiss: () => setToast(null) }
}
