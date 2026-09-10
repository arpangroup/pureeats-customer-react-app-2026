import { useActiveLocation } from '@/hooks/useLocation'
import { useAuth } from '@/hooks/useAuth'
import { resolveActiveLocationLabel } from '@/lib/locationResolution'

/** What HomePage and TopNavBar both show in the "active address" pill — resolved centrally so the priority between a saved address, GPS, and IP location (see src/config/locationResolution.ts) is defined once instead of duplicated per component. */
export function useActiveLocationLabel(): string {
  const { activeAddress, detectedLocations } = useActiveLocation()
  const { isAuthenticated } = useAuth()
  return resolveActiveLocationLabel({ activeAddress, detectedLocations, isAuthenticated })
}
