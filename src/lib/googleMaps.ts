import { useAppConfig } from '@/context/AppConfigContext'
import { useGoogleMapsState } from '@/context/GoogleMapsContext'

// The loader (useJsApiLoader) is mounted exactly once, in GoogleMapsLoaderGate (rendered from
// AppConfigProvider once AppConfig has actually resolved) — every map on the page
// (AddressMapPicker, OrderTrackingMap, ...) reads that single shared result via this hook instead
// of each calling useJsApiLoader itself. See GoogleMapsContext.tsx for why that centralization
// matters: calling useJsApiLoader with a key that changes between renders (the env-var fallback,
// then the real admin-configured one once AppConfig loads) is exactly what trips the library's own
// "Loader must not be called again with different options" crash.
export function useGoogleMaps() {
  const { hasGoogleMapsApiKey } = useAppConfig()
  const { isLoaded, loadError } = useGoogleMapsState()
  return {
    isLoaded: isLoaded && hasGoogleMapsApiKey,
    loadError,
    hasApiKey: hasGoogleMapsApiKey,
    // Every map in the app follows this same rule: use Google whenever a key is actually
    // configured and it loads successfully, otherwise fall back to the free OSM/Leaflet map - no
    // separate admin "provider" toggle to keep in sync with whether a working key exists.
    wantsGoogle: hasGoogleMapsApiKey && !loadError,
  }
}

export const DEFAULT_MAP_CENTER = { lat: 12.9716, lng: 77.5946 }
