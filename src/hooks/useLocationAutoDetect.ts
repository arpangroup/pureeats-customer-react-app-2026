import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useActiveLocation } from '@/hooks/useLocation'
import { useAuth } from '@/hooks/useAuth'
import { useAppConfig } from '@/context/AppConfigContext'
import { getCurrentPosition, queryGeolocationPermission, watchGeolocationPermission, type GeolocationPermissionState } from '@/lib/geolocation'
import { geoService } from '@/services/geoService'

export type LocationDialogState = 'hidden' | 'prompt' | 'denied'

// Module-level (not state) so "Continue without location" sticks for the rest of the tab session
// without persisting anywhere — the dialog is a nudge, not something worth nagging about on every
// navigation back to Home, but it should ask again on a fresh visit/reload.
let dismissedThisSession = false

/**
 * Drives the app's device-location resolution — which automatic sources exist at all ('gps',
 * 'ip') and how they're prioritized for *display* is controlled entirely by AppConfig's
 * locationResolutionAuthenticatedPriority/locationResolutionGuestPriority (backend-editable, see
 * docs/location-resolution/README.md), falling back to defaultLocationResolutionConfig until that
 * loads; this hook just decides *when* to attempt each source that's enabled for the customer's
 * current auth state. Runs regardless of whether the customer already has a saved active address
 * (from LocationBootstrap, once logged in) — the saved address still wins for the displayed label
 * via that same priority config, but real GPS/IP coordinates are still captured for things like
 * distance-based restaurant sorting. It checks the browser's geolocation permission first —
 * silently detects via GPS if already granted, prompts with our own dialog if undecided (browsers
 * only allow ONE native permission prompt attempt without cooperation, so we want that attempt to
 * come from a deliberate tap, not an unexplained page-load popup), and falls back to coarse
 * IP-based location if denied, unsupported, or still undecided, so we always end up with *some*
 * coordinates when the browser and config allow it.
 */
export function useLocationAutoDetect() {
  const { setDetectedLocation } = useActiveLocation()
  const { isAuthenticated } = useAuth()
  const appConfig = useAppConfig()
  const [dialogState, setDialogState] = useState<LocationDialogState>('hidden')
  const [permissionState, setPermissionState] = useState<GeolocationPermissionState>('prompt')
  const [requesting, setRequesting] = useState(false)
  // Tracks which auth state we last ran detection for, rather than a plain boolean — so logging in
  // (a guest whose configured priority excludes 'gps' becoming an authenticated customer whose
  // priority includes it, or vice versa) gets one fresh attempt instead of being stuck with
  // whatever was decided before login.
  const resolvedForAuthState = useRef<boolean | null>(null)

  const sourcePriority = isAuthenticated ? appConfig.locationResolutionAuthenticatedPriority : appConfig.locationResolutionGuestPriority
  const gpsEnabled = useMemo(() => sourcePriority.includes('gps'), [sourcePriority])
  const ipEnabled = useMemo(() => sourcePriority.includes('ip'), [sourcePriority])

  const detectViaIp = useCallback(async () => {
    if (!ipEnabled) return false
    const loc = await geoService.byIp()
    if (loc.latitude == null || loc.longitude == null) return false
    const label = loc.city ? `Near ${loc.city}` : (await geoService.reverseGeocode(loc.latitude, loc.longitude)).displayName ?? 'Approximate location'
    setDetectedLocation('ip', { label, latitude: loc.latitude, longitude: loc.longitude })
    return true
  }, [ipEnabled, setDetectedLocation])

  const detectViaGps = useCallback(async () => {
    if (!gpsEnabled) return false
    try {
      const pos = await getCurrentPosition()
      const label = (await geoService.reverseGeocode(pos.latitude, pos.longitude)).displayName ?? 'Current location'
      setDetectedLocation('gps', { label, latitude: pos.latitude, longitude: pos.longitude })
      setDialogState('hidden')
      return true
    } catch {
      return false
    }
  }, [gpsEnabled, setDetectedLocation])

  useEffect(() => {
    if (resolvedForAuthState.current === isAuthenticated || dismissedThisSession || (!gpsEnabled && !ipEnabled)) return
    resolvedForAuthState.current = isAuthenticated
    ;(async () => {
      if (!gpsEnabled) {
        await detectViaIp()
        return
      }
      const state = await queryGeolocationPermission()
      setPermissionState(state)
      if (state === 'granted') {
        const ok = await detectViaGps()
        if (!ok) await detectViaIp()
      } else if (state === 'denied') {
        setDialogState('denied')
        await detectViaIp()
      } else if (state === 'prompt') {
        setDialogState('prompt')
        // Resolves a coarse fallback in the background while the dialog waits on the customer's
        // decision — so the address bar isn't stuck blank for however long that takes.
        await detectViaIp()
      } else {
        await detectViaIp()
      }
    })()
  }, [isAuthenticated, gpsEnabled, ipEnabled, detectViaGps, detectViaIp])

  // Picks up a permission change made outside our dialog (browser settings, OS settings) while the
  // tab stays open, so the dialog clears itself instead of asking the customer to click "retry".
  useEffect(() => {
    if (!gpsEnabled) return
    return watchGeolocationPermission((state) => {
      setPermissionState(state)
      if (state === 'granted') detectViaGps()
    })
  }, [gpsEnabled, detectViaGps])

  async function handleAllow() {
    setRequesting(true)
    const ok = await detectViaGps()
    if (!ok) {
      const state = await queryGeolocationPermission()
      setPermissionState(state)
      setDialogState('denied')
      await detectViaIp()
    }
    setRequesting(false)
  }

  function handleSkip() {
    dismissedThisSession = true
    setDialogState('hidden')
    detectViaIp()
  }

  async function handleRetryAfterSettingsChange() {
    setRequesting(true)
    const state = await queryGeolocationPermission()
    setPermissionState(state)
    if (state === 'granted') await detectViaGps()
    setRequesting(false)
  }

  return {
    dialogOpen: dialogState !== 'hidden',
    dialogState,
    permissionState,
    requesting,
    handleAllow,
    handleSkip,
    handleRetryAfterSettingsChange,
  }
}
