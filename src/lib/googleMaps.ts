import { useJsApiLoader } from '@react-google-maps/api'
import { GOOGLE_MAPS_API_KEY } from '@/config/env'

// Referenced by identity from useJsApiLoader's internal cache — must stay a
// stable module-level constant, not recreated per render/component, or the
// loader thinks its config changed and reloads the script.
const LIBRARIES: 'places'[] = ['places']

export function useGoogleMaps() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'pureeats-google-maps',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })
  return { isLoaded: isLoaded && !!GOOGLE_MAPS_API_KEY, loadError, hasApiKey: !!GOOGLE_MAPS_API_KEY }
}

export const DEFAULT_MAP_CENTER = { lat: 12.9716, lng: 77.5946 }
