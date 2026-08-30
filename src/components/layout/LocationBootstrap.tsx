import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useActiveLocation } from '@/hooks/useLocation'
import { addressService } from '@/services/addressService'

/** On login, if no delivery address is active yet, auto-select the user's default saved address (falls back to the first one) — mounted once above the router so it runs regardless of which page the user lands on. */
export function LocationBootstrap() {
  const { user, isAuthenticated } = useAuth()
  const { activeAddress, setActiveAddress } = useActiveLocation()

  useEffect(() => {
    if (!isAuthenticated || !user || activeAddress) return
    addressService.list(user.id).then((addresses) => {
      const preferred = addresses.find((a) => a.isDefault) ?? addresses[0]
      if (preferred) setActiveAddress(preferred)
    })
  }, [isAuthenticated, user, activeAddress, setActiveAddress])

  return null
}
