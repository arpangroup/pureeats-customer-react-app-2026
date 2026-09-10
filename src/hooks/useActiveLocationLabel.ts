import { useActiveLocation } from '@/hooks/useLocation'
import { useAuth } from '@/hooks/useAuth'
import { useAppConfig } from '@/context/AppConfigContext'
import { resolveActiveLocationLabel } from '@/lib/locationResolution'

/** What HomePage and TopNavBar both show in the "active address" pill — resolved centrally so the priority between a saved address, GPS, and IP location (backend-configurable via AppConfig.locationResolution*, see src/config/locationResolution.ts for the client-side fallback) is defined once instead of duplicated per component. */
export function useActiveLocationLabel(): string {
  const { activeAddress, detectedLocations } = useActiveLocation()
  const { isAuthenticated } = useAuth()
  const appConfig = useAppConfig()
  const sourcePriority = isAuthenticated ? appConfig.locationResolutionAuthenticatedPriority : appConfig.locationResolutionGuestPriority
  const fallbackLabel = isAuthenticated ? appConfig.locationResolutionAuthenticatedFallbackLabel : appConfig.locationResolutionGuestFallbackLabel
  return resolveActiveLocationLabel({ activeAddress, detectedLocations, sourcePriority, fallbackLabel })
}
