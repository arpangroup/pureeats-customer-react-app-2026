/**
 * Single source of truth for "where does data come from".
 *
 * Everything in src/services/* reads DATA_SOURCE and either returns the
 * organized mock fixtures (src/mocks) or calls the real API through
 * src/lib/apiClient.ts. No component ever branches on this itself — the
 * branch lives once, here, and in each service file's `if` at the top of
 * each function. Flipping VITE_DATA_SOURCE=live in .env (or `npm run
 * dev:uat`) is the only change needed to point the whole app at the same
 * Spring Boot backend the admin panel (pureeats-react-ui) talks to.
 */

export type DataSource = 'mock' | 'live'

export const DATA_SOURCE: DataSource = (import.meta.env.VITE_DATA_SOURCE as DataSource) || 'mock'

export const IS_MOCK = DATA_SOURCE === 'mock'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

export const MOCK_DELAY_MS = Number(import.meta.env.VITE_MOCK_DELAY_MS ?? 350)

/** Google Maps JavaScript API key (Maps JavaScript API + Places API + Geocoding API enabled, billing on). Add it to a gitignored .env.local — never commit a real key. When empty, the address picker and order-tracking map fall back to a free OpenStreetMap view instead. */
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

/** Payee VPA the UPI checkout intent pays into — set this to your own UPI ID to actually receive test payments. Defaults to a placeholder so the "open my UPI app" flow still works for local dev. */
export const UPI_PAYEE_VPA = import.meta.env.VITE_UPI_PAYEE_VPA || 'pureeats@upi'
export const UPI_PAYEE_NAME = import.meta.env.VITE_UPI_PAYEE_NAME || 'PureEats'

/** This build's own version (from package.json, injected by vite.config.ts) — sent to /app-config so the backend can decide whether it's current. */
export const APP_VERSION = __APP_VERSION__

export const AUTH_TOKEN_STORAGE_KEY = 'pureeats.auth.token'
export const AUTH_USER_STORAGE_KEY = 'pureeats.auth.user'
export const AUTH_REFRESH_TOKEN_STORAGE_KEY = 'pureeats.auth.refreshToken'
