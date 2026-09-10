import { apiClient } from '@/lib/apiClient'
import { IS_MOCK } from '@/config/env'

export interface IpLocation {
  latitude: number | null
  longitude: number | null
  city: string | null
  country: string | null
}

export interface ReverseGeocodeResult {
  displayName: string | null
  city: string | null
  state: string | null
  country: string | null
  postcode: string | null
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

  /**
   * Turns real GPS coordinates into a readable address via the backend's GET /geo/reverse-geocode
   * — proxied server-side (Nominatim underneath, cached) rather than called directly from the
   * browser. See docs/location-resolution/README.md for why: the browser can't set the User-Agent
   * header Nominatim's usage policy requires, ad blockers intermittently break a direct client
   * call, and per-client requests can't share a cache the way one backend-side cache can.
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult> {
    if (IS_MOCK) {
      return { displayName: null, city: null, state: null, country: null, postcode: null }
    }
    try {
      const { data } = await apiClient.get<{ data: ReverseGeocodeResult }>('/geo/reverse-geocode', { params: { lat: latitude, lon: longitude } })
      return data.data
    } catch {
      return { displayName: null, city: null, state: null, country: null, postcode: null }
    }
  },
}
