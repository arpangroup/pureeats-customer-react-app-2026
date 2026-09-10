import { apiClient } from '@/lib/apiClient'
import { IS_MOCK } from '@/config/env'

export interface IpLocation {
  latitude: number | null
  longitude: number | null
  city: string | null
  country: string | null
}

export const geoService = {
  /** Coarse, city-level location resolved server-side from the caller's IP — the fallback when the browser has no (or a denied) geolocation permission. Backed by GET /geo/ip-location, which is unauthenticated so it works for guests too. */
  async byIp(): Promise<IpLocation> {
    if (IS_MOCK) {
      return { latitude: 12.9716, longitude: 77.5946, city: 'Bengaluru', country: 'India' }
    }
    try {
      const { data } = await apiClient.get<{ data: IpLocation }>('/geo/ip-location')
      return data.data
    } catch {
      return { latitude: null, longitude: null, city: null, country: null }
    }
  },
}
