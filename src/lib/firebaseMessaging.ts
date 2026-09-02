import type { FirebaseApp } from 'firebase/app'
import type { Messaging, MessagePayload } from 'firebase/messaging'
import { FIREBASE_CONFIG, FIREBASE_VAPID_KEY, HAS_FIREBASE_CONFIG } from '@/config/env'

/**
 * Firebase Cloud Messaging wiring for push notifications (order status updates, promotions/offers)
 * — entirely inert until a real Firebase project's config is filled into .env.local
 * (VITE_FIREBASE_*, see .env.example). Every export here is a safe no-op without that config, so
 * `config.orderStatusUpdateMode` can request PUSH/BOTH from the backend at any time without this
 * module ever throwing — the caller (useOrderStatusUpdates) always has polling as a fallback.
 *
 * The `firebase` package itself is dynamically imported (only reached past the HAS_FIREBASE_CONFIG
 * check) so it never lands in the main bundle for the default polling-only case.
 */

let app: FirebaseApp | null = null
let messaging: Messaging | null = null

async function getMessagingInstance(): Promise<Messaging | null> {
  if (!HAS_FIREBASE_CONFIG || typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  if (!messaging) {
    const [{ initializeApp }, { getMessaging }] = await Promise.all([import('firebase/app'), import('firebase/messaging')])
    if (!app) app = initializeApp(FIREBASE_CONFIG)
    messaging = getMessaging(app)
  }
  return messaging
}

/**
 * Registers the messaging service worker, asks for notification permission, and returns this
 * device's FCM registration token (or null if unsupported, unconfigured, or denied) — the caller is
 * responsible for sending it to `POST /api/v1/notifications/push-token` (see notificationService).
 */
export async function requestPushToken(): Promise<string | null> {
  const instance = await getMessagingInstance()
  if (!instance) return null
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null
    const { getToken } = await import('firebase/messaging')
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    return await getToken(instance, { vapidKey: FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration })
  } catch {
    // Any failure (blocked permission, no service worker support, network error registering with
    // FCM, ...) just means push isn't available on this device right now — polling still works.
    return null
  }
}

/**
 * Subscribes to messages that arrive while the app is in the foreground. Returns an unsubscribe
 * function synchronously (a no-op one until the async subscribe resolves, and permanently a no-op
 * without Firebase configured) so callers can treat it uniformly regardless of config state.
 */
export function onForegroundMessage(callback: (payload: MessagePayload) => void): () => void {
  let unsubscribe: (() => void) | null = null
  let cancelled = false

  getMessagingInstance().then(async (instance) => {
    if (!instance || cancelled) return
    const { onMessage } = await import('firebase/messaging')
    if (cancelled) return
    unsubscribe = onMessage(instance, callback)
  })

  return () => {
    cancelled = true
    unsubscribe?.()
  }
}
