import { createContext, useContext, type ReactNode } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'

// Referenced by identity from useJsApiLoader's internal cache — must stay a stable module-level
// constant, not recreated per render, or the loader thinks its config changed and reloads the
// script.
const GOOGLE_MAPS_LIBRARIES: 'places'[] = ['places']

interface GoogleMapsState {
  isLoaded: boolean
  loadError: Error | undefined
}

const GoogleMapsStateContext = createContext<GoogleMapsState>({ isLoaded: false, loadError: undefined })

export function useGoogleMapsState(): GoogleMapsState {
  return useContext(GoogleMapsStateContext)
}

/**
 * Mounts useJsApiLoader exactly once, for the app's whole lifetime, with a key that's already
 * final by the time this component first renders — see AppConfigProvider, which only renders this
 * (instead of a plain passthrough with isLoaded: false) once AppConfig has actually resolved.
 *
 * This is deliberately a *separate* component from AppConfigProvider, gated by AppConfig having
 * loaded, rather than AppConfigProvider calling useJsApiLoader itself with whatever key is on hand
 * that render: googleMapsApiKey starts out as '' or the build-time env var before the backend
 * config fetch resolves, then flips to the real admin-configured key once it does. Calling
 * useJsApiLoader with a key that changes between renders is exactly what trips the library's own
 * "Loader must not be called again with different options" crash - mounting this component fresh
 * only once the key is already settled means useJsApiLoader is called exactly once, ever, with one
 * value that never changes again.
 */
function GoogleMapsLoader({ googleMapsApiKey, children }: { googleMapsApiKey: string; children: ReactNode }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'pureeats-google-maps',
    googleMapsApiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  })
  return <GoogleMapsStateContext.Provider value={{ isLoaded, loadError }}>{children}</GoogleMapsStateContext.Provider>
}

/** `googleMapsApiKey` is null until AppConfig has resolved (see AppConfigProvider) - renders children as-is (Maps state stays "not loaded") until then, so GoogleMapsLoader only ever mounts with its final key. */
export function GoogleMapsLoaderGate({ googleMapsApiKey, children }: { googleMapsApiKey: string | null; children: ReactNode }) {
  if (googleMapsApiKey === null) return <>{children}</>
  return <GoogleMapsLoader googleMapsApiKey={googleMapsApiKey}>{children}</GoogleMapsLoader>
}
