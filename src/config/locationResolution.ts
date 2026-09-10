/**
 * Single place controlling how PureEats decides what to show as the customer's "active address"
 * on the home page, and which automatic sources it's allowed to try. Nothing outside this file
 * (and the label-resolution logic in src/lib/locationResolution.ts, which just walks this config)
 * needs to change to retune the behavior — reorder or trim `sourcePriority` and every consumer
 * (HomePage, TopNavBar) picks it up automatically.
 */

/**
 * 'saved'  — the customer's saved default delivery address, fetched from the backend once logged
 *            in (see LocationBootstrap). The only source an order can actually be routed to.
 * 'gps'    — the browser's real Geolocation API, reverse-geocoded to a readable address. Requires
 *            the customer to grant permission — see useLocationAutoDetect for the "ask nicely
 *            first" dialog flow that requests it.
 * 'ip'     — a coarse, city-level guess resolved server-side from the caller's IP
 *            (GET /geo/ip-location) — no permission needed, works for guests, much less precise.
 */
export type LocationSource = 'saved' | 'gps' | 'ip'

export interface LocationResolutionConfig {
  /**
   * Priority order for the *displayed* label — the first source in this list with a resolved
   * value wins, independent of which order they actually finished resolving in. Reorder this to
   * change priority (e.g. put 'ip' ahead of 'gps' to prefer the instant-but-coarse guess over a
   * slower precise one). Remove an entry to disable that source outright:
   *   - drop 'gps' to stop ever requesting browser location permission (no more dialog either)
   *   - drop 'ip' to stop calling the backend IP-geolocation fallback
   *   - 'saved' should normally stay first — it's the only source real deliveries route to.
   */
  sourcePriority: LocationSource[]
  /** Shown once every source enabled above has been tried and none resolved a value. */
  fallbackLabel: {
    authenticated: string
    guest: string
  }
}

export const locationResolutionConfig: LocationResolutionConfig = {
  sourcePriority: ['saved', 'gps', 'ip'],
  fallbackLabel: {
    authenticated: 'Set your location',
    guest: 'Other',
  },
}
