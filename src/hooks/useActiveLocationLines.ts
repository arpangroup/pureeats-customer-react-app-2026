import { useActiveLocation } from '@/hooks/useLocation'
import { useAuth } from '@/hooks/useAuth'
import { useAppConfig } from '@/context/AppConfigContext'
import { resolveActiveLocationLines } from '@/lib/locationResolution'

/** Same source-priority resolution as useActiveLocationLabel, but split across a short primary line and a fuller secondary line — for UI (HomePage's location pill) that shows the active location across two lines instead of one truncated string. */
export function useActiveLocationLines(): { primary: string; secondary: string | null } {
  const { activeAddress, detectedLocations } = useActiveLocation()
  const { isAuthenticated } = useAuth()
  const appConfig = useAppConfig()
  const sourcePriority = isAuthenticated ? appConfig.locationResolutionAuthenticatedPriority : appConfig.locationResolutionGuestPriority
  const fallbackLabel = isAuthenticated ? appConfig.locationResolutionAuthenticatedFallbackLabel : appConfig.locationResolutionGuestFallbackLabel
  return resolveActiveLocationLines({ activeAddress, detectedLocations, sourcePriority, fallbackLabel })
}
