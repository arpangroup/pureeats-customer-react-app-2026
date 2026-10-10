import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useActiveLocation } from '@/hooks/useLocation'
import { addressService } from '@/services/addressService'

/**
 * Keeps the active delivery address in step with the customer's saved addresses - mounted once above the router so
 * it runs whichever page the user lands on. Once per sign-in / app load:
 * - nothing active yet -> the default saved address (falls back to the first one);
 * - the active one is a saved address that was edited or deleted since (e.g. on another device) -> refreshed, or
 *   replaced by the default;
 * - the default changed and the customer hasn't picked an address by hand in this session -> the new default.
 *   (The active address is persisted, so without this the home page kept showing the old default after a change.)
 */
export function LocationBootstrap() {
  const { user, isAuthenticated } = useAuth()
  const { activeAddress, setActiveAddress, explicitSource } = useActiveLocation()
  const syncedFor = useRef<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      syncedFor.current = null
      return
    }
    if (syncedFor.current === user.id) return
    syncedFor.current = user.id
    addressService.list(user.id).then((addresses) => {
      const preferred = addresses.find((a) => a.isDefault) ?? addresses[0]
      if (!preferred) return
      const current = activeAddress ? addresses.find((a) => a.id === activeAddress.id) : undefined
      const pickedByHand = explicitSource === 'saved' && !!current
      const next = pickedByHand ? current : preferred
      const changed = !activeAddress || next.id !== activeAddress.id || JSON.stringify(next) !== JSON.stringify(activeAddress)
      // Automatic pick - not an explicit choice, so it doesn't override a live GPS/IP location.
      if (changed) setActiveAddress(next, { explicit: pickedByHand })
    })
    // Runs once per signed-in user; activeAddress/explicitSource are read at that moment on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id])

  return null
}
