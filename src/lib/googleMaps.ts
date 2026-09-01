import { useJsApiLoader } from '@react-google-maps/api'
import { useAppConfig } from '@/context/AppConfigContext'

// Referenced by identity from useJsApiLoader's internal cache — must stay a
// stable module-level constant, not recreated per render/component, or the
// loader thinks its config changed and reloads the script.
const LIBRARIES: 'places'[] = ['places']

export function useGoogleMaps() {
  // Prefers the admin-configured key (AppConfigContext, falls back to the build-time env var
  // itself while that fetch is in flight) so an admin can rotate the key without a redeploy.
  const { googleMapsApiKey } = useAppConfig()
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'pureeats-google-maps',
    googleMapsApiKey,
    libraries: LIBRARIES,
  })
  return { isLoaded: isLoaded && !!googleMapsApiKey, loadError, hasApiKey: !!googleMapsApiKey }
}

export const DEFAULT_MAP_CENTER = { lat: 12.9716, lng: 77.5946 }
