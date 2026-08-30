import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { readStorage, writeStorage } from '@/lib/storage'
import type { Address } from '@/types/entities'

const ACTIVE_ADDRESS_STORAGE_KEY = 'pureeats.activeAddress'

interface LocationContextValue {
  activeAddress: Address | null
  setActiveAddress: (address: Address) => void
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined)

/** The delivery address currently selected for browsing/ordering — separate from the full saved-addresses list (see addressService), which lives server/mock-side. */
export function LocationProvider({ children }: { children: ReactNode }) {
  const [activeAddress, setActiveAddressState] = useState<Address | null>(() => readStorage<Address | null>(ACTIVE_ADDRESS_STORAGE_KEY, null))

  const setActiveAddress = useCallback((address: Address) => {
    writeStorage(ACTIVE_ADDRESS_STORAGE_KEY, address)
    setActiveAddressState(address)
  }, [])

  const value = useMemo<LocationContextValue>(() => ({ activeAddress, setActiveAddress }), [activeAddress, setActiveAddress])

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocationContext(): LocationContextValue {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocationContext must be used within LocationProvider')
  return ctx
}
