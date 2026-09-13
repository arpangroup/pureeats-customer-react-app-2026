import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { readStorage, removeStorage, writeStorage } from '@/lib/storage'
import type { Address } from '@/types/entities'

const ACTIVE_ADDRESS_STORAGE_KEY = 'pureeats.activeAddress'
const DETECTED_LOCATIONS_STORAGE_KEY = 'pureeats.lastDetectedLocations'
const PICKED_LOCATION_STORAGE_KEY = 'pureeats.pickedLocation'

/** Which automatic source a resolved location came from — kept separate per source (rather than one "last resolved" slot) so src/lib/locationResolution.ts can apply an arbitrary priority between them, including preferring one that resolved earlier over one that resolved later. */
export type DetectedLocationSource = 'gps' | 'ip'

/** A location resolved automatically (GPS or IP) rather than picked from the customer's saved addresses — shown as a stand-in for activeAddress until they sign in / save a real address. The last resolved value per source is cached to localStorage (see LocationProvider) purely so a fresh page load has something real to show immediately instead of the fallback label — it's still just a best-effort hint, and useLocationAutoDetect always re-resolves a fresh one in the background regardless of what's cached. */
export interface DetectedLocation {
  label: string
  /** Searched place's name, when this location came from a named-place search result rather than
   * a plain map click/drag/GPS fix — preferred over a locality guessed from `label` for display. */
  title?: string
  latitude: number
  longitude: number
}

interface LocationContextValue {
  activeAddress: Address | null
  setActiveAddress: (address: Address) => void
  detectedLocations: Partial<Record<DetectedLocationSource, DetectedLocation>>
  setDetectedLocation: (source: DetectedLocationSource, location: DetectedLocation | null) => void
  /** A location explicitly confirmed on the location picker (map pin, search result, or recent
   * search) — distinct from detectedLocations' 'gps'/'ip' slots, which useLocationAutoDetect
   * silently overwrites with a fresh device fix on every page load. Without this separate, its-own-
   * persisted slot, a customer's manual pick would get clobbered by the next automatic GPS/IP
   * resolution the moment they refreshed. Outranks both activeAddress and detectedLocations in
   * resolveActiveLocationLines - see LocationPickerPage, the only place that sets it. */
  pickedLocation: DetectedLocation | null
  setPickedLocation: (location: DetectedLocation | null) => void
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined)

/** The delivery address currently selected for browsing/ordering — separate from the full saved-addresses list (see addressService), which lives server/mock-side. */
export function LocationProvider({ children }: { children: ReactNode }) {
  const [activeAddress, setActiveAddressState] = useState<Address | null>(() => readStorage<Address | null>(ACTIVE_ADDRESS_STORAGE_KEY, null))
  // Hydrated from the last successful GPS/IP resolution (written back by setDetectedLocation below)
  // so the active-location pill shows a real value on first paint of a fresh page load instead of
  // sitting on the fallback label until a brand new reverse-geocode round-trip finishes — it's
  // superseded by that fresh result moments later, in the same source slot, once it resolves.
  const [detectedLocations, setDetectedLocations] = useState<Partial<Record<DetectedLocationSource, DetectedLocation>>>(() =>
    readStorage<Partial<Record<DetectedLocationSource, DetectedLocation>>>(DETECTED_LOCATIONS_STORAGE_KEY, {}),
  )
  const [pickedLocation, setPickedLocationState] = useState<DetectedLocation | null>(() => readStorage<DetectedLocation | null>(PICKED_LOCATION_STORAGE_KEY, null))

  const setActiveAddress = useCallback((address: Address) => {
    writeStorage(ACTIVE_ADDRESS_STORAGE_KEY, address)
    setActiveAddressState(address)
  }, [])

  const setDetectedLocation = useCallback((source: DetectedLocationSource, location: DetectedLocation | null) => {
    setDetectedLocations((prev) => {
      const next = { ...prev, [source]: location ?? undefined }
      writeStorage(DETECTED_LOCATIONS_STORAGE_KEY, next)
      return next
    })
  }, [])

  const setPickedLocation = useCallback((location: DetectedLocation | null) => {
    if (location) writeStorage(PICKED_LOCATION_STORAGE_KEY, location)
    else removeStorage(PICKED_LOCATION_STORAGE_KEY)
    setPickedLocationState(location)
  }, [])

  const value = useMemo<LocationContextValue>(
    () => ({ activeAddress, setActiveAddress, detectedLocations, setDetectedLocation, pickedLocation, setPickedLocation }),
    [activeAddress, setActiveAddress, detectedLocations, setDetectedLocation, pickedLocation, setPickedLocation],
  )

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocationContext(): LocationContextValue {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocationContext must be used within LocationProvider')
  return ctx
}
