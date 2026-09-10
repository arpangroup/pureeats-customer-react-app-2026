export type NotificationPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported'

/**
 * Reads the current notification permission without triggering the native browser prompt.
 * `Notification.permission` (synchronous, 'granted' | 'denied' | 'default') is used directly
 * rather than `navigator.permissions.query({name: 'notifications'})` — Safari's support for that
 * query name is inconsistent across versions, while `Notification.permission` itself is available
 * everywhere the `Notification` constructor exists at all. 'default' (never asked) is normalized to
 * 'prompt' to match queryGeolocationPermission's vocabulary.
 */
export function queryNotificationPermission(): NotificationPermissionState {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission === 'default' ? 'prompt' : Notification.permission
}

/**
 * Calls `onChange` whenever the permission state flips (e.g. the customer updates it in browser
 * settings and comes back to this tab) — best-effort via the Permissions API's `change` event,
 * where supported; a no-op unsubscribe otherwise, same degrade-gracefully shape as
 * watchGeolocationPermission.
 */
export function watchNotificationPermission(onChange: (state: NotificationPermissionState) => void): () => void {
  if (typeof Notification === 'undefined' || !navigator.permissions?.query) return () => {}
  let status: any
  navigator.permissions
    .query({ name: 'notifications' as any })
    .then((s) => {
      status = s
      status.addEventListener('change', handleChange)
    })
    .catch(() => {})
  function handleChange() {
    onChange(queryNotificationPermission())
  }
  return () => status?.removeEventListener('change', handleChange)
}
