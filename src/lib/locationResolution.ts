import type { DetectedLocation, DetectedLocationSource } from '@/context/LocationContext'
import type { Address, LocationSource } from '@/types/entities'

/** Google's plus-code format for a precise point with no street address nearby — e.g. "GC2G+W46"
 * or "XHCW+72P" — meaningless as a headline, so extractPrimaryLocality skips over one if it leads
 * the address. */
const PLUS_CODE_PATTERN = /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,4}$/i

/** The first meaningful comma-separated segment of a geocoded display name (Nominatim/Google both
 * format this "most specific place, then broader areas") — e.g. "Anjaiah Nagar" out of "GC2G+W46,
 * Maisamma Nagar, Anjaiah Nagar, Kukatpally, Hyderabad, Telangana, India" (skipping the leading
 * plus-code, which isn't a place name). Used as the short headline for a full address, the same
 * way Swiggy/Zomato-style apps show a locality name rather than a generic "Current location"
 * placeholder. */
export function extractPrimaryLocality(fullAddress: string): string | null {
  const segments = fullAddress.split(',').map((s) => s.trim()).filter(Boolean)
  const first = segments.find((s) => !PLUS_CODE_PATTERN.test(s))
  return first ?? segments[0] ?? null
}

interface ResolveActiveLocationArgs {
  activeAddress: Address | null
  detectedLocations: Partial<Record<DetectedLocationSource, DetectedLocation>>
  /** A location explicitly confirmed on the location picker (map pin, search result, or recent
   * search) — only wins where 'picked' actually appears in sourcePriority, same as every other
   * source, so an admin can freely choose "live location always wins" vs. "an explicit pick sticks"
   * by reordering AppConfig's priority list instead of this function hardcoding one or the other. */
  pickedLocation: DetectedLocation | null
  /** Which sources to try, in order — the caller passes AppConfig's authenticated/guest priority list (already resolved to a default if the backend config hasn't loaded), so this function stays a pure, backend-agnostic reducer. */
  sourcePriority: LocationSource[]
}

export interface ResolvedActiveLocation {
  source: LocationSource
  primary: string
  secondary: string | null
  latitude: number
  longitude: number
}

/** Walks `sourcePriority` and returns the first source that has a resolved value — coordinates included, so this doubles as "where should the location picker's map open" (see LocationPickerPage) as well as feeding the label-only helpers below. Returns null only when nothing in sourcePriority has resolved yet (caller falls back to a plain label / a hardcoded default center). */
export function resolveActiveLocation({ activeAddress, detectedLocations, pickedLocation, sourcePriority }: ResolveActiveLocationArgs): ResolvedActiveLocation | null {
  for (const source of sourcePriority) {
    if (source === 'saved' && activeAddress) {
      return {
        source,
        primary: activeAddress.tag ?? 'Delivering to',
        secondary: [activeAddress.house, activeAddress.address].filter(Boolean).join(', ') || null,
        latitude: activeAddress.latitude,
        longitude: activeAddress.longitude,
      }
    }
    if (source === 'picked' && pickedLocation) {
      return {
        source,
        primary: pickedLocation.title ?? extractPrimaryLocality(pickedLocation.label) ?? 'Selected location',
        secondary: pickedLocation.label,
        latitude: pickedLocation.latitude,
        longitude: pickedLocation.longitude,
      }
    }
    if (source === 'gps' || source === 'ip') {
      const detected = detectedLocations[source]
      if (detected) {
        return {
          source,
          primary: detected.title ?? extractPrimaryLocality(detected.label) ?? (source === 'gps' ? 'Current location' : 'Near you'),
          secondary: detected.label,
          latitude: detected.latitude,
          longitude: detected.longitude,
        }
      }
    }
  }
  return null
}

interface ResolveActiveLocationLabelArgs extends ResolveActiveLocationArgs {
  fallbackLabel: string
}

/** Walks `sourcePriority` and returns the label for the first source that has a resolved value — the one place that actually interprets the priority order, so HomePage and TopNavBar never duplicate this logic themselves. */
export function resolveActiveLocationLabel(args: ResolveActiveLocationLabelArgs): string {
  return resolveActiveLocationLines(args).primary
}

/** Same priority walk as {@link resolveActiveLocationLabel}, but split into a short primary line (a tag like "Home", or "Current location") and a fuller secondary line (the actual address/place text) — for UI that shows the active location across two lines instead of one truncated string. `secondary` is null when there's nothing more specific than the primary line to show (e.g. the plain fallback). */
export function resolveActiveLocationLines({ fallbackLabel, ...args }: ResolveActiveLocationLabelArgs): { primary: string; secondary: string | null } {
  const resolved = resolveActiveLocation(args)
  return resolved ? { primary: resolved.primary, secondary: resolved.secondary } : { primary: fallbackLabel, secondary: null }
}
