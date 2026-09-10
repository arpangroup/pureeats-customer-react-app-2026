import type { DetectedLocation, DetectedLocationSource } from '@/context/LocationContext'
import type { Address, LocationSource } from '@/types/entities'

interface ResolveActiveLocationLabelArgs {
  activeAddress: Address | null
  detectedLocations: Partial<Record<DetectedLocationSource, DetectedLocation>>
  /** Which sources to try, in order — the caller passes AppConfig's authenticated/guest priority list (already resolved to a default if the backend config hasn't loaded), so this function stays a pure, backend-agnostic reducer. */
  sourcePriority: LocationSource[]
  fallbackLabel: string
}

/** Walks `sourcePriority` and returns the label for the first source that has a resolved value — the one place that actually interprets the priority order, so HomePage and TopNavBar never duplicate this logic themselves. */
export function resolveActiveLocationLabel({ activeAddress, detectedLocations, sourcePriority, fallbackLabel }: ResolveActiveLocationLabelArgs): string {
  for (const source of sourcePriority) {
    if (source === 'saved' && activeAddress) return activeAddress.tag ?? 'Delivering to'
    if (source === 'gps' || source === 'ip') {
      const detected = detectedLocations[source]
      if (detected) return detected.label
    }
  }
  return fallbackLabel
}
