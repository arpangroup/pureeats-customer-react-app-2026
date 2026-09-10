import type { FirebaseApp } from 'firebase/app'
import type { Messaging, MessagePayload } from 'firebase/messaging'
import type { FirebaseWebConfig } from '@/context/AppConfigContext'

/**
 * Firebase Cloud Messaging wiring for push notifications (order status updates, promotions/offers)
 * — entirely inert until real Firebase project config exists, from either source AppConfigContext
 * merges (an admin-set value in Settings → Customer App, or a VITE_FIREBASE_* build-time env var as
 * the pre-launch/local-dev fallback — see AppConfigContext.tsx's `firebaseConfig`). Every export
 * here is a safe no-op without that config, so `config.orderStatusUpdateMode` can request PUSH/BOTH
 * from the backend at any time without this module ever throwing — the caller
 * (useOrderStatusUpdates) always has polling as a fallback.
 *
 * Note: this only covers *foreground* messaging (the tab is open). The background handler
 * (public/firebase-messaging-sw.js) is a plain static file outside Vite's build, so it can't read
 * either the env var or the backend config at runtime the way this module does — it still needs its
 * own values filled in by hand. See that file's own comment.
 *
 * The `firebase` package itself is dynamically imported (only reached past the config-completeness
 * check) so it never lands in the main bundle for the default polling-only case.
 */

let app: FirebaseApp | null = null
let messaging: Messaging | null = null
let initializedSignature: string | null = null

function isComplete(config: FirebaseWebConfig): boolean {
  return !!(config.apiKey && config.projectId && config.appId && config.vapidKey)
}

async function getMessagingInstance(config: FirebaseWebConfig): Promise<Messaging | null> {
  if (!isComplete(config)) {
    console.warn('[push] Firebase config incomplete — apiKey/projectId/appId/vapidKey must all be set', config)
    return null
  }
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('[push] service workers unsupported in this browser/context')
    return null
  }
  // Keyed by the config itself, not just "has it run once" — if the backend config resolves after
  // an initial env-fallback init (or an admin rotates it), this re-initializes against the new
  // values instead of sticking with whatever was live at first call.
  const signature = `${config.apiKey}|${config.projectId}|${config.appId}`
  if (!messaging || signature !== initializedSignature) {
    const [{ initializeApp }, { getMessaging }] = await Promise.all([import('firebase/app'), import('firebase/messaging')])
    app = initializeApp(
      {
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      },
      signature,
    )
    messaging = getMessaging(app)
    initializedSignature = signature
  }
  return messaging
}

/**
 * Registers the messaging service worker, asks for notification permission, and returns this
 * device's FCM registration token (or null if unsupported, unconfigured, or denied) — the caller is
 * responsible for sending it to `POST /api/v1/notifications/push-token` (see notificationService).
 */
export async function requestPushToken(config: FirebaseWebConfig): Promise<string | null> {
  const instance = await getMessagingInstance(config)
  if (!instance) return null
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn(`[push] notification permission not granted (browser returned "${permission}") — reset it in the site's permission settings to be asked again`)
      return null
    }
    const { getToken } = await import('firebase/messaging')
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const token = await getToken(instance, { vapidKey: config.vapidKey, serviceWorkerRegistration: registration })
    console.info('[push] got FCM token', token)
    return token
  } catch (err) {
    // Any failure (blocked permission, no service worker support, network error registering with
    // FCM, ...) just means push isn't available on this device right now — polling still works.
    console.error('[push] requestPushToken failed', err)
    return null
  }
}

/**
 * Subscribes to messages that arrive while the app is in the foreground. Returns an unsubscribe
 * function synchronously (a no-op one until the async subscribe resolves, and permanently a no-op
 * without Firebase configured) so callers can treat it uniformly regardless of config state.
 */
export function onForegroundMessage(config: FirebaseWebConfig, callback: (payload: MessagePayload) => void): () => void {
  let unsubscribe: (() => void) | null = null
  let cancelled = false

  getMessagingInstance(config).then(async (instance) => {
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
