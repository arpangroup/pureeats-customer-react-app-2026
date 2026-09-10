export type MediaPermissionKind = 'microphone' | 'camera'
export type MediaPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported'

/**
 * Reads the current mic/camera permission without opening a stream — mirrors
 * queryGeolocationPermission/queryNotificationPermission's shape. Safari doesn't implement
 * `navigator.permissions.query` for these names either, so it falls back to 'prompt' there too.
 */
export async function queryMediaPermission(kind: MediaPermissionKind): Promise<MediaPermissionState> {
  if (!navigator.mediaDevices?.getUserMedia) return 'unsupported'
  if (!navigator.permissions?.query) return 'prompt'
  try {
    const status = await navigator.permissions.query({ name: kind as any })
    return status.state as MediaPermissionState
  } catch {
    return 'prompt'
  }
}

/** Calls `onChange` whenever the permission state flips. No-op unsubscribe where the Permissions API isn't available. */
export function watchMediaPermission(kind: MediaPermissionKind, onChange: (state: MediaPermissionState) => void): () => void {
  if (!navigator.permissions?.query) return () => {}
  let status: any
  navigator.permissions
    .query({ name: kind as any })
    .then((s) => {
      status = s
      status.addEventListener('change', handleChange)
    })
    .catch(() => {})
  function handleChange() {
    if (status) onChange(status.state as MediaPermissionState)
  }
  return () => status?.removeEventListener('change', handleChange)
}

/**
 * Triggers the native mic/camera prompt — there's no "just ask" API separate from actually opening
 * a stream, so this opens one and immediately stops every track, since all we want here is the
 * permission grant, not a live recording.
 */
export async function requestMediaPermission(kind: MediaPermissionKind): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) return false
  try {
    const stream = await navigator.mediaDevices.getUserMedia(kind === 'camera' ? { video: true } : { audio: true })
    stream.getTracks().forEach((track) => track.stop())
    return true
  } catch {
    return false
  }
}
