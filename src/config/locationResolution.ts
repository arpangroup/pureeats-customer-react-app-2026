/**
 * Hardcoded fallback for how PureEats decides the customer's "active address" — used until the
 * backend's /app-config response loads (or for any field an older/unconfigured backend omits). The
 * live, backend-editable version of this same shape is `AppConfig.locationResolution*` (see
 * src/context/AppConfigContext.tsx), which an admin can change without a frontend deploy; this file
 * is only the safety net under it, mirroring AppConfigService.defaults() on the backend the same
 * way src/services/appConfigService.ts's NO_UPDATE mirrors every other feature flag.
 */

import type { LocationSource } from '@/types/entities'

export type { LocationSource }

/**
 * 'saved'  — the customer's saved default delivery address, fetched from the backend once logged
 *            in (see LocationBootstrap). The only source an order can actually be routed to —
 *            doesn't apply to guests, who have nothing saved.
 * 'gps'    — the browser's real Geolocation API, reverse-geocoded to a readable address via the
 *            backend's GET /geo/reverse-geocode (see src/services/geoService.ts) rather than
 *            calling a geocoding provider directly from the browser — see the README in
 *            docs/location-resolution/ for why. Requires the customer to grant permission.
 * 'ip'     — a coarse, city-level guess resolved server-side from the caller's IP
 *            (GET /geo/ip-location) — no permission needed, works for guests, much less precise.
 */
export interface LocationResolutionConfig {
  /**
   * Priority order for the *displayed* label, evaluated separately per auth state since 'saved'
   * only ever applies to a logged-in customer. The first source in the list with a resolved value
   * wins, independent of which order they actually finished resolving in.
   */
  authenticatedPriority: LocationSource[]
  guestPriority: LocationSource[]
  /** Shown once every source enabled for that auth state has been tried and none resolved a value. */
  authenticatedFallbackLabel: string
  guestFallbackLabel: string
}

export const defaultLocationResolutionConfig: LocationResolutionConfig = {
  authenticatedPriority: ['saved', 'gps', 'ip'],
  guestPriority: ['gps', 'ip'],
  authenticatedFallbackLabel: 'Set your location',
  guestFallbackLabel: 'Other',
}
