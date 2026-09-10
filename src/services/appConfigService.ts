import { apiClient } from '@/lib/apiClient'
import { APP_VERSION, IS_MOCK } from '@/config/env'
import { defaultLocationResolutionConfig } from '@/config/locationResolution'
import type { AppConfig, DeliveryInstructionOption } from '@/types/entities'

/** Mirrors AppConfigService.defaultDeliveryInstructionOptions() on the backend — keep the two in sync. */
export const DEFAULT_DELIVERY_INSTRUCTION_OPTIONS: DeliveryInstructionOption[] = [
  { key: 'LEAVE_AT_DOOR', label: 'Leave at the door', icon: 'DoorOpen' },
  { key: 'AVOID_CALLING', label: 'Avoid calling', icon: 'PhoneOff' },
  { key: 'AVOID_RINGING_BELL', label: 'Avoid ringing bell', icon: 'BellOff' },
  { key: 'LEAVE_WITH_SECURITY', label: 'Leave with security', icon: 'UserCheck' },
]

/** Mirrors AppConfigService.defaults() on the backend so mock mode (`npm run dev`) looks identical to a fully-configured backend. */
const NO_UPDATE: AppConfig = {
  severity: 'NONE',
  message: null,
  latestVersion: APP_VERSION,
  googleMapsApiKey: null,
  enabledPaymentMethods: [],
  forceLogoutOnHardUpdate: false,
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

export const appConfigService = {
  async fetch(): Promise<AppConfig> {
    if (IS_MOCK) {
      return NO_UPDATE
    }
    const { data } = await apiClient.get<{ data: Partial<AppConfig> }>('/app-config', { params: { clientVersion: APP_VERSION } })
    // Merge onto the same defaults used in mock mode — a backend that hasn't been redeployed with
    // the newer feature-flag fields yet (or omits any of them) still gets safe client-side fallbacks.
    return { ...NO_UPDATE, ...data.data }
  },
}
