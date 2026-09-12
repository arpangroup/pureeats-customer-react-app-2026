import { useEffect, useRef, useState } from 'react'
import { useOrderTracking } from './useOrderTracking'
import { useAppConfig } from '@/context/AppConfigContext'
import { onForegroundMessage, requestPushToken } from '@/lib/firebaseMessaging'
import { notificationService } from '@/services/notificationService'
import { queryNotificationPermission, watchNotificationPermission } from '@/lib/notificationPermission'

/**
 * Order-tracking data source, config-driven between polling and push (`config.orderStatusUpdateMode`
 * — POLL/PUSH/BOTH, defaults to POLL). Wraps the existing `useOrderTracking` poll loop rather than
 * replacing it:
 * - POLL: identical to before, on `config.orderStatusPollIntervalMs`.
 * - PUSH: polling backs off to a slow safety-net interval (6x) in case a push is ever missed —
 *   never disabled outright, since `firebaseMessaging.ts` is a no-op without real Firebase project
 *   credentials, and this mode must still work (as polling) until that project exists.
 * - BOTH: normal polling interval, plus a foreground-push listener that forces an immediate refresh.
 *
 * The admin-configured mode only ever backs polling off — it can't be trusted alone, since it says
 * nothing about whether *this particular browser* actually has notification permission granted.
 * Without that check, someone who denied (or never granted) notifications would silently get stuck
 * on the slow PUSH-mode safety-net interval with no push ever arriving to make up for it. So the
 * full-speed `orderStatusPollIntervalMs` is always used unless permission is actually 'granted' —
 * irrespective of `orderStatusUpdateMode` — mirroring the admin app's `pushAvailable` fallback in
 * NewOrderAlertContext.
 *
 * Registers this device's push token once per mount when push is requested; every step degrades to
 * "just keep polling" on any failure (no permission, no Firebase config, token registration error).
 */
export function useOrderStatusUpdates<T extends { status: string } | undefined>(
  fullLoader: () => Promise<T>,
  statusLoader: () => Promise<{ status: string; updatedAt: string } | undefined>,
  deps: unknown[],
) {
  const { orderStatusUpdateMode, orderStatusPollIntervalMs, firebaseConfig, hasFirebaseConfig } = useAppConfig()
  const [permission, setPermission] = useState(queryNotificationPermission)
  useEffect(() => watchNotificationPermission(setPermission), [])

  const pushGranted = hasFirebaseConfig && permission === 'granted'
  const wantsPush = pushGranted && (orderStatusUpdateMode === 'PUSH' || orderStatusUpdateMode === 'BOTH')
  const intervalMs = orderStatusUpdateMode === 'PUSH' && pushGranted ? orderStatusPollIntervalMs * 6 : orderStatusPollIntervalMs

  const tracking = useOrderTracking(fullLoader, statusLoader, deps, intervalMs)
  const reloadRef = useRef(tracking.reload)
  reloadRef.current = tracking.reload

  useEffect(() => {
    if (!wantsPush) return
    let cancelled = false
    requestPushToken(firebaseConfig).then((token) => {
      if (cancelled || !token) return
      notificationService.registerPushToken(token).catch(() => undefined)
    })
    const unsubscribe = onForegroundMessage(firebaseConfig, () => reloadRef.current())
    return () => {
      cancelled = true
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsPush])

  return tracking
}
