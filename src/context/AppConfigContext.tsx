import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { appConfigService, DEFAULT_DELIVERY_INSTRUCTION_OPTIONS } from '@/services/appConfigService'
import { GOOGLE_MAPS_API_KEY } from '@/config/env'
import { defaultLocationResolutionConfig } from '@/config/locationResolution'
import { useAuth } from '@/hooks/useAuth'
import type { AppConfig, ColumnLayout, DeliveryInstructionOption, LocationSource } from '@/types/entities'

interface AppConfigContextValue {
  config: AppConfig | null
  /** Falls back to the build-time env var until the fetch resolves, or if the admin hasn't set one. */
  googleMapsApiKey: string
  /** Empty array (not yet loaded / admin hasn't restricted anything) means "don't filter — show every payment method". */
  enabledPaymentMethods: string[]
  /** True before the very first fetch resolves — every flag below already carries a safe default, so this is only useful to suppress a layout flash, never required for correctness. */
  isLoaded: boolean
  audioSearchEnabled: boolean
  promoSliderEnabled: boolean
  topPicksEnabled: boolean
  recommendedItemsEnabled: boolean
  restaurantListLayout: ColumnLayout
  recommendedItemsLayout: ColumnLayout
  restaurantItemsLayout: ColumnLayout
  deliveryInstructionMode: 'TEXT' | 'QUICK_OPTIONS'
  deliveryInstructionOptions: DeliveryInstructionOption[]
  mapProvider: 'OSM' | 'GOOGLE'
  orderStatusUpdateMode: 'POLL' | 'PUSH' | 'BOTH'
  orderStatusPollIntervalMs: number
  locationResolutionAuthenticatedPriority: LocationSource[]
  locationResolutionGuestPriority: LocationSource[]
  locationResolutionAuthenticatedFallbackLabel: string
  locationResolutionGuestFallbackLabel: string
}

const DEFAULTS: Omit<AppConfigContextValue, 'config' | 'googleMapsApiKey' | 'enabledPaymentMethods' | 'isLoaded'> = {
  audioSearchEnabled: false,
  promoSliderEnabled: true,
  topPicksEnabled: true,
  recommendedItemsEnabled: true,
  restaurantListLayout: 'TWO_COLUMN',
  recommendedItemsLayout: 'TWO_COLUMN',
  restaurantItemsLayout: 'TWO_COLUMN',
  deliveryInstructionMode: 'QUICK_OPTIONS',
  deliveryInstructionOptions: DEFAULT_DELIVERY_INSTRUCTION_OPTIONS,
  mapProvider: 'OSM',
  orderStatusUpdateMode: 'POLL',
  orderStatusPollIntervalMs: 8000,
  locationResolutionAuthenticatedPriority: defaultLocationResolutionConfig.authenticatedPriority,
  locationResolutionGuestPriority: defaultLocationResolutionConfig.guestPriority,
  locationResolutionAuthenticatedFallbackLabel: defaultLocationResolutionConfig.authenticatedFallbackLabel,
  locationResolutionGuestFallbackLabel: defaultLocationResolutionConfig.guestFallbackLabel,
}

const AppConfigContext = createContext<AppConfigContextValue>({
  config: null,
  googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  enabledPaymentMethods: [],
  isLoaded: false,
  ...DEFAULTS,
})

async function clearCachesAndServiceWorker(): Promise<void> {
  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  }
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((r) => r.unregister()))
  }
}

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const { logout } = useAuth()
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [dismissedSoft, setDismissedSoft] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    appConfigService.fetch().then(setConfig).catch(() => undefined)
  }, [])

  async function handleSoftRefresh() {
    setRefreshing(true)
    await clearCachesAndServiceWorker()
    window.location.reload()
  }

  async function handleHardUpdate() {
    setRefreshing(true)
    await clearCachesAndServiceWorker()
    if (config?.forceLogoutOnHardUpdate) {
      await logout().catch(() => undefined)
    }
    window.location.reload()
  }

  const value: AppConfigContextValue = {
    config,
    googleMapsApiKey: config?.googleMapsApiKey || GOOGLE_MAPS_API_KEY,
    enabledPaymentMethods: config?.enabledPaymentMethods ?? [],
    isLoaded: config !== null,
    audioSearchEnabled: config?.audioSearchEnabled ?? DEFAULTS.audioSearchEnabled,
    promoSliderEnabled: config?.promoSliderEnabled ?? DEFAULTS.promoSliderEnabled,
    topPicksEnabled: config?.topPicksEnabled ?? DEFAULTS.topPicksEnabled,
    recommendedItemsEnabled: config?.recommendedItemsEnabled ?? DEFAULTS.recommendedItemsEnabled,
    restaurantListLayout: config?.restaurantListLayout ?? DEFAULTS.restaurantListLayout,
    recommendedItemsLayout: config?.recommendedItemsLayout ?? DEFAULTS.recommendedItemsLayout,
    restaurantItemsLayout: config?.restaurantItemsLayout ?? DEFAULTS.restaurantItemsLayout,
    deliveryInstructionMode: config?.deliveryInstructionMode ?? DEFAULTS.deliveryInstructionMode,
    deliveryInstructionOptions: config?.deliveryInstructionOptions?.length ? config.deliveryInstructionOptions : DEFAULTS.deliveryInstructionOptions,
    mapProvider: config?.mapProvider ?? DEFAULTS.mapProvider,
    orderStatusUpdateMode: config?.orderStatusUpdateMode ?? DEFAULTS.orderStatusUpdateMode,
    orderStatusPollIntervalMs: config?.orderStatusPollIntervalMs || DEFAULTS.orderStatusPollIntervalMs,
    locationResolutionAuthenticatedPriority: config?.locationResolutionAuthenticatedPriority?.length
      ? config.locationResolutionAuthenticatedPriority
      : DEFAULTS.locationResolutionAuthenticatedPriority,
    locationResolutionGuestPriority: config?.locationResolutionGuestPriority?.length ? config.locationResolutionGuestPriority : DEFAULTS.locationResolutionGuestPriority,
    locationResolutionAuthenticatedFallbackLabel: config?.locationResolutionAuthenticatedFallbackLabel || DEFAULTS.locationResolutionAuthenticatedFallbackLabel,
    locationResolutionGuestFallbackLabel: config?.locationResolutionGuestFallbackLabel || DEFAULTS.locationResolutionGuestFallbackLabel,
  }

  return (
    <AppConfigContext.Provider value={value}>
      {children}

      {config?.severity === 'SOFT' && !dismissedSoft && (
        <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-slate-800 px-4 py-3 text-white shadow-lg animate-fade-in md:bottom-6 md:right-6 md:left-auto md:mx-0 dark:bg-slate-700">
          <RefreshCw size={16} className="shrink-0" />
          <p className="min-w-0 flex-1 text-xs font-medium">{config.message || 'A new version of PureEats is available.'}</p>
          <button className="shrink-0 text-xs font-bold text-amber-300" disabled={refreshing} onClick={handleSoftRefresh}>
            {refreshing ? 'Updating…' : 'Update'}
          </button>
          <button className="shrink-0 text-xs text-white/60" onClick={() => setDismissedSoft(true)}>
            Later
          </button>
        </div>
      )}

      {config?.severity === 'HARD' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-center shadow-xl dark:bg-slate-900">
            <RefreshCw size={28} className="mx-auto text-brand-600" />
            <p className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-100">Update required</p>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {config.message || "This version of PureEats is no longer supported. Please update to continue."}
            </p>
            <button className="btn-primary mt-4 w-full" disabled={refreshing} onClick={handleHardUpdate}>
              {refreshing ? 'Updating…' : 'Update now'}
            </button>
          </div>
        </div>
      )}
    </AppConfigContext.Provider>
  )
}

export function useAppConfig(): AppConfigContextValue {
  return useContext(AppConfigContext)
}
