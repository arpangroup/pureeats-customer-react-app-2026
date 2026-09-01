import { apiClient } from '@/lib/apiClient'
import { APP_VERSION, IS_MOCK } from '@/config/env'
import type { AppConfig } from '@/types/entities'

const NO_UPDATE: AppConfig = {
  severity: 'NONE',
  message: null,
  latestVersion: APP_VERSION,
  googleMapsApiKey: null,
  enabledPaymentMethods: [],
  forceLogoutOnHardUpdate: false,
}

export const appConfigService = {
  async fetch(): Promise<AppConfig> {
    if (IS_MOCK) {
      return NO_UPDATE
    }
    const { data } = await apiClient.get<{ data: AppConfig }>('/app-config', { params: { clientVersion: APP_VERSION } })
    return data.data
  },
}
