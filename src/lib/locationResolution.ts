import { locationResolutionConfig } from '@/config/locationResolution'
import type { DetectedLocation, DetectedLocationSource } from '@/context/LocationContext'
import type { Address } from '@/types/entities'

interface ResolveActiveLocationLabelArgs {
  activeAddress: Address | null
  detectedLocations: Partial<Record<DetectedLocationSource, DetectedLocation>>
  isAuthenticated: boolean
}

/** Walks `locationResolutionConfig.sourcePriority` and returns the label for the first source that has a resolved value — the one place that actually interprets the config, so HomePage and TopNavBar never duplicate this priority logic themselves. */
export function resolveActiveLocationLabel({ activeAddress, detectedLocations, isAuthenticated }: ResolveActiveLocationLabelArgs): string {
  for (const source of locationResolutionConfig.sourcePriority) {
    if (source === 'saved' && activeAddress) return activeAddress.tag ?? 'Delivering to'
    if (source === 'gps' || source === 'ip') {
      const detected = detectedLocations[source]
      if (detected) return detected.label
    }
  }
  return isAuthenticated ? locationResolutionConfig.fallbackLabel.authenticated : locationResolutionConfig.fallbackLabel.guest
}
