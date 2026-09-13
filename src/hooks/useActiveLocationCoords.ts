import { useMemo } from 'react'
import { useActiveLocation } from '@/hooks/useLocation'
import { useAuth } from '@/hooks/useAuth'
import { useAppConfig } from '@/context/AppConfigContext'
import { resolveActiveLocation } from '@/lib/locationResolution'

/** Same source-priority resolution as useActiveLocationLines/useActiveLocationLabel, but returning
 * coordinates instead of a label — for anything that needs "where is the customer right now" as a
 * lat/lng, e.g. restaurantService.list()'s optional distance-based ETA. Null whenever nothing in
 * the priority list has resolved yet (matches the pill showing its plain fallback label in that
 * same case). Memoized on the resolved values themselves, not a new object identity every render,
 * so callers can safely drop this straight into a useAsync/useEffect dependency array. */
export function useActiveLocationCoords(): { latitude: number; longitude: number } | null {
  const { activeAddress, detectedLocations, pickedLocation } = useActiveLocation()
  const { isAuthenticated } = useAuth()
  const appConfig = useAppConfig()
  const sourcePriority = isAuthenticated ? appConfig.locationResolutionAuthenticatedPriority : appConfig.locationResolutionGuestPriority
  const resolved = resolveActiveLocation({ activeAddress, detectedLocations, pickedLocation, sourcePriority })
  const latitude = resolved?.latitude
  const longitude = resolved?.longitude
  return useMemo(() => (latitude !== undefined && longitude !== undefined ? { latitude, longitude } : null), [latitude, longitude])
}
