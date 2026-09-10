import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { readStorage, writeStorage } from '@/lib/storage'
import type { Address } from '@/types/entities'

const ACTIVE_ADDRESS_STORAGE_KEY = 'pureeats.activeAddress'

/** Which automatic source a resolved location came from — kept separate per source (rather than one "last resolved" slot) so src/lib/locationResolution.ts can apply an arbitrary priority between them, including preferring one that resolved earlier over one that resolved later. */
export type DetectedLocationSource = 'gps' | 'ip'

/** A location resolved automatically (GPS or IP) rather than picked from the customer's saved addresses — shown as a stand-in for activeAddress until they sign in / save a real address. Session-only, not persisted, since it's just a best-effort hint. */
export interface DetectedLocation {
  label: string
  latitude: number
  longitude: number
}

interface LocationContextValue {
  activeAddress: Address | null
  setActiveAddress: (address: Address) => void
  detectedLocations: Partial<Record<DetectedLocationSource, DetectedLocation>>
  setDetectedLocation: (source: DetectedLocationSource, location: DetectedLocation | null) => void
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined)

/** The delivery address currently selected for browsing/ordering — separate from the full saved-addresses list (see addressService), which lives server/mock-side. */
export function LocationProvider({ children }: { children: ReactNode }) {
  const [activeAddress, setActiveAddressState] = useState<Address | null>(() => readStorage<Address | null>(ACTIVE_ADDRESS_STORAGE_KEY, null))
  const [detectedLocations, setDetectedLocations] = useState<Partial<Record<DetectedLocationSource, DetectedLocation>>>({})

  const setActiveAddress = useCallback((address: Address) => {
    writeStorage(ACTIVE_ADDRESS_STORAGE_KEY, address)
    setActiveAddressState(address)
  }, [])

  const setDetectedLocation = useCallback((source: DetectedLocationSource, location: DetectedLocation | null) => {
    setDetectedLocations((prev) => ({ ...prev, [source]: location ?? undefined }))
  }, [])

  const value = useMemo<LocationContextValue>(
    () => ({ activeAddress, setActiveAddress, detectedLocations, setDetectedLocation }),
    [activeAddress, setActiveAddress, detectedLocations, setDetectedLocation],
  )

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocationContext(): LocationContextValue {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocationContext must be used within LocationProvider')
  return ctx
}
