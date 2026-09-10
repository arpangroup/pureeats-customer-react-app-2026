import { useEffect, useMemo, useState } from 'react'
import { Check, LocateFixed, MapPinOff, Bell, BellOff, Mic, MicOff, Camera, CameraOff } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { PermissionSettingsGuideView } from '@/components/permissions/PermissionSettingsGuideView'
import { useAppConfig } from '@/context/AppConfigContext'
import { useActiveLocation } from '@/hooks/useLocation'
import { detectPlatform, getLocationSettingsGuide, getNotificationSettingsGuide, getPermissionSettingsGuide } from '@/lib/platform'
import { getCurrentPosition, queryGeolocationPermission, watchGeolocationPermission, type GeolocationPermissionState } from '@/lib/geolocation'
import { queryNotificationPermission, watchNotificationPermission, type NotificationPermissionState } from '@/lib/notificationPermission'
import { queryMediaPermission, watchMediaPermission, requestMediaPermission, type MediaPermissionKind, type MediaPermissionState } from '@/lib/mediaPermission'
import { requestPushToken } from '@/lib/firebaseMessaging'
import { notificationService } from '@/services/notificationService'
import { geoService } from '@/services/geoService'

type CardState = 'granted' | 'denied' | 'prompt' | 'unsupported'

/**
 * Central place to see and (re-)grant every browser permission PureEats uses — there's no
 * manifest-style pre-declaration for web apps the way there is for native ones, so this page is the
 * closest equivalent: each card reads the live browser state and, for a once-denied permission,
 * shows the same settings-navigation guide as the inline dialogs (LocationPermissionDialog) instead
 * of duplicating it. Microphone (voice search, spoken delivery instructions) and Camera (attaching a
 * photo to an order-issue/invoice-mismatch report) are tracked the same way even though the features
 * that use them aren't built yet — granting ahead of time means those features can ship without a
 * first-run permission prompt of their own.
 */
export default function PermissionsPage() {
  const platform = useMemo(() => detectPlatform(), [])
  const appConfig = useAppConfig()
  const { setDetectedLocation } = useActiveLocation()

  const [locationState, setLocationState] = useState<GeolocationPermissionState>('prompt')
  const [notificationState, setNotificationState] = useState<NotificationPermissionState>('prompt')
  const [requestingLocation, setRequestingLocation] = useState(false)
  const [requestingNotifications, setRequestingNotifications] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)

  const microphone = useMediaPermissionCard('microphone')
  const camera = useMediaPermissionCard('camera')

  useEffect(() => {
    queryGeolocationPermission().then(setLocationState)
    return watchGeolocationPermission(setLocationState)
  }, [])

  useEffect(() => {
    setNotificationState(queryNotificationPermission())
    return watchNotificationPermission(setNotificationState)
  }, [])

  async function handleEnableLocation() {
    setRequestingLocation(true)
    try {
      const pos = await getCurrentPosition()
      const reverse = await geoService.reverseGeocode(pos.latitude, pos.longitude)
      setDetectedLocation('gps', { label: reverse.displayName ?? 'Current location', latitude: pos.latitude, longitude: pos.longitude })
    } catch {
      // getCurrentPosition already surfaces a friendly message; the permission state below reflects
      // whatever the browser decided (denied vs. still prompt on transient failure).
    } finally {
      setLocationState(await queryGeolocationPermission())
      setRequestingLocation(false)
    }
  }

  async function handleEnableNotifications() {
    setRequestingNotifications(true)
    setNotificationError(null)
    try {
      const token = await requestPushToken(appConfig.firebaseConfig)
      if (token) await notificationService.registerPushToken(token)
      else setNotificationError('Could not enable notifications on this device.')
    } catch {
      setNotificationError('Could not enable notifications on this device.')
    } finally {
      setNotificationState(queryNotificationPermission())
      setRequestingNotifications(false)
    }
  }

  return (
    <div>
      <PageHeader title="App Permissions" />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-4 md:py-8">
        <PermissionCard
          icon={locationState === 'denied' ? MapPinOff : LocateFixed}
          title="Location"
          description="Lets us show nearby restaurants and estimate delivery time automatically."
          state={locationState}
          requesting={requestingLocation}
          onEnable={handleEnableLocation}
          guide={getLocationSettingsGuide(platform)}
        />

        <PermissionCard
          icon={notificationState === 'denied' ? BellOff : Bell}
          title="Notifications"
          description="Order status updates, delivery alerts, and offers — sent straight to your device."
          state={notificationState}
          requesting={requestingNotifications}
          onEnable={handleEnableNotifications}
          error={notificationError}
          guide={getNotificationSettingsGuide(platform)}
        />

        <PermissionCard
          icon={microphone.state === 'denied' ? MicOff : Mic}
          title="Microphone"
          description="Lets you speak delivery instructions or search for food by voice."
          state={microphone.state}
          requesting={microphone.requesting}
          onEnable={microphone.onEnable}
          guide={getPermissionSettingsGuide(platform, 'microphone')}
        />

        <PermissionCard
          icon={camera.state === 'denied' ? CameraOff : Camera}
          title="Camera"
          description="Lets you attach a photo when reporting an order issue, invoice mismatch, or delivery problem."
          state={camera.state}
          requesting={camera.requesting}
          onEnable={camera.onEnable}
          guide={getPermissionSettingsGuide(platform, 'camera')}
        />
      </div>
    </div>
  )
}

/** Shared state/handler shape for the two media permissions — identical query/watch/request flow, differing only in `kind`. */
function useMediaPermissionCard(kind: MediaPermissionKind) {
  const [state, setState] = useState<MediaPermissionState>('prompt')
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    queryMediaPermission(kind).then(setState)
    return watchMediaPermission(kind, setState)
  }, [kind])

  async function onEnable() {
    setRequesting(true)
    try {
      await requestMediaPermission(kind)
    } finally {
      setState(await queryMediaPermission(kind))
      setRequesting(false)
    }
  }

  return { state, requesting, onEnable }
}

function PermissionCard({
  icon: Icon,
  title,
  description,
  state,
  requesting,
  onEnable,
  error,
  guide,
}: {
  icon: typeof LocateFixed
  title: string
  description: string
  state: CardState
  requesting: boolean
  onEnable: () => void
  error?: string | null
  guide: ReturnType<typeof getLocationSettingsGuide>
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10">
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
            <StatusBadge state={state} />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-rose-600 dark:text-rose-400">{error}</p>}

      {state === 'prompt' && (
        <button className="btn-primary mt-3 w-full" onClick={onEnable} disabled={requesting}>
          {requesting ? 'Requesting…' : `Enable ${title.toLowerCase()}`}
        </button>
      )}

      {state === 'denied' && (
        <div className="mt-3 space-y-2">
          <PermissionSettingsGuideView guide={guide} />
        </div>
      )}

      {state === 'unsupported' && <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">Not supported on this device or browser.</p>}
    </div>
  )
}

function StatusBadge({ state }: { state: CardState }) {
  if (state === 'granted') {
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
        <Check size={12} /> Allowed
      </span>
    )
  }
  if (state === 'denied') {
    return <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">Blocked</span>
  }
  if (state === 'unsupported') {
    return <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">Unsupported</span>
  }
  return <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">Not set</span>
}
