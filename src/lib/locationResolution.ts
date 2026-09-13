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
export function resolveActiveLocationLabel(args: ResolveActiveLocationLabelArgs): string {
  return resolveActiveLocationLines(args).primary
}

/** Same priority walk as {@link resolveActiveLocationLabel}, but split into a short primary line (a tag like "Home", or "Current location") and a fuller secondary line (the actual address/place text) — for UI that shows the active location across two lines instead of one truncated string. `secondary` is null when there's nothing more specific than the primary line to show (e.g. the plain fallback). */
export function resolveActiveLocationLines({ activeAddress, detectedLocations, sourcePriority, fallbackLabel }: ResolveActiveLocationLabelArgs): { primary: string; secondary: string | null } {
  for (const source of sourcePriority) {
    if (source === 'saved' && activeAddress) {
      return {
        primary: activeAddress.tag ?? 'Delivering to',
        secondary: [activeAddress.house, activeAddress.address].filter(Boolean).join(', ') || null,
      }
    }
    if (source === 'gps' || source === 'ip') {
      const detected = detectedLocations[source]
      if (detected) return { primary: source === 'gps' ? 'Current location' : 'Near you', secondary: detected.label }
    }
  }
  return { primary: fallbackLabel, secondary: null }
}
