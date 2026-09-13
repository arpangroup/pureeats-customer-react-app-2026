import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Home, LocateFixed, MapPin, Star } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingBlock } from '@/components/ui/Feedback'
import { AddressMapPicker } from '@/components/maps/AddressMapPicker'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { useActiveLocation } from '@/hooks/useLocation'
import { addressService } from '@/services/addressService'
import { geoService } from '@/services/geoService'
import { getCurrentPosition } from '@/lib/geolocation'
import { getRecentLocations, addRecentLocation, type RecentLocation } from '@/lib/recentLocations'
import { extractPrimaryLocality } from '@/lib/locationResolution'
import { DEFAULT_MAP_CENTER } from '@/lib/googleMaps'
import type { Address } from '@/types/entities'

interface PendingPoint {
  latitude: number
  longitude: number
  label: string
  /** Searched place's name, when this point came from a named-place search result — shown as the
   * headline instead of a locality guessed from `label` (e.g. "Ambika men's hostel & pg" rather
   * than the first comma-segment of its address, which may just be an internal building code). */
  title?: string
}

/**
 * Location picker reachable by anyone — signed in or not. Browsing (and picking which address
 * "nearby" restaurants are computed from) never requires an account; only checking out does, and
 * that flow already asks for sign-in and a real saved address separately.
 *
 * The map (AddressMapPicker — same component AddressFormPage uses, so it gets Google/OSM
 * auto-selection for free) is the source of truth for "where am I about to set my location to":
 * dragging the pin, using its built-in search box, or tapping "use current location" just move the
 * pin and fill in `pending` — nothing is committed as the active location until "Confirm location"
 * is tapped. A recent search or a saved address is already a complete, confirmed choice, so picking
 * either one activates it and navigates back immediately, same as a checkout-flow address picker.
 */
export default function LocationPickerPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { activeAddress, detectedLocations, pickedLocation, setActiveAddress, setPickedLocation } = useActiveLocation()

  // Opens already centered on wherever the app currently considers "here", instead of a hardcoded
  // default — same priority resolveActiveLocationLines uses (an explicit pick first, then saved
  // address, then GPS, then IP), computed once from whatever's already in context at mount time.
  const initialPoint = useMemo<PendingPoint | null>(() => {
    if (pickedLocation) return { latitude: pickedLocation.latitude, longitude: pickedLocation.longitude, label: pickedLocation.label, title: pickedLocation.title }
    if (activeAddress) {
      return {
        latitude: activeAddress.latitude,
        longitude: activeAddress.longitude,
        label: [activeAddress.house, activeAddress.address].filter(Boolean).join(', ') || activeAddress.tag || 'Selected location',
      }
    }
    const detected = detectedLocations.gps ?? detectedLocations.ip
    if (detected) return { latitude: detected.latitude, longitude: detected.longitude, label: detected.label }
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [pending, setPending] = useState<PendingPoint | null>(initialPoint)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)
  const [recents, setRecents] = useState<RecentLocation[]>(() => getRecentLocations())

  const { data: savedAddresses, isLoading: loadingSaved } = useAsync(
    () => (user ? addressService.list(user.id) : Promise.resolve([])),
    [user?.id],
  )

  function handleMapChange(coords: { latitude: number; longitude: number }, formattedAddress?: string, title?: string) {
    setPending((prev) => ({ latitude: coords.latitude, longitude: coords.longitude, label: formattedAddress ?? prev?.label ?? 'Selected location', title }))
  }

  async function handleUseCurrentLocation() {
    setLocating(true)
    setLocateError(null)
    try {
      const { latitude, longitude } = await getCurrentPosition()
      const reverse = await geoService.reverseGeocode(latitude, longitude)
      setPending({ latitude, longitude, label: reverse.displayName ?? 'Current location' })
    } catch (err) {
      setLocateError((err as Error).message)
    } finally {
      setLocating(false)
    }
  }

  // Picking a recent search is already a complete, confirmed choice (same reasoning as
  // chooseSavedAddress below) - no need to make the user land back on the map and tap "Confirm
  // location" again for somewhere they'd already picked once.
  function pickRecent(recent: RecentLocation) {
    const point: PendingPoint = { latitude: recent.latitude, longitude: recent.longitude, label: recent.label, title: recent.title }
    setPickedLocation(point)
    addRecentLocation(point)
    navigate(-1)
  }

  // Choosing a saved address supersedes any earlier manual pick - otherwise pickedLocation (which
  // outranks activeAddress in resolveActiveLocationLines) would keep shadowing it.
  function chooseSavedAddress(address: Address) {
    setPickedLocation(null)
    setActiveAddress(address)
    navigate(-1)
  }

  function handleConfirm() {
    if (!pending) return
    setPickedLocation(pending)
    addRecentLocation(pending)
    setRecents(getRecentLocations())
    navigate(-1)
  }

  // Recent-search picks come from localStorage, which another tab/session could have changed —
  // re-read whenever the list becomes visible again rather than only once at mount.
  useEffect(() => {
    setRecents(getRecentLocations())
  }, [pending])

  return (
    <div>
      <PageHeader title="Select location" />

      <div className="overflow-hidden sm:mt-4 sm:rounded-2xl">
        <AddressMapPicker
          latitude={pending?.latitude ?? DEFAULT_MAP_CENTER.lat}
          longitude={pending?.longitude ?? DEFAULT_MAP_CENTER.lng}
          onChange={handleMapChange}
          tall
          overlay={
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-600 shadow-lg disabled:opacity-60 dark:bg-slate-900"
              aria-label="Use my current location"
            >
              <LocateFixed size={18} className={locating ? 'animate-pulse' : undefined} />
            </button>
          }
        />
      </div>
      {locateError && <p className="px-4 pt-2 text-xs text-rose-500">{locateError}</p>}

      {pending && (
        <div className="flex items-start gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <MapPin size={16} className="mt-0.5 shrink-0 text-brand-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Selected location</p>
            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{pending.title ?? pending.label}</p>
            {pending.title && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{pending.label}</p>}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-lg px-4 py-4">
        <button onClick={handleConfirm} disabled={!pending} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50">
          Confirm location
        </button>

        {recents.length > 0 && (
          <div className="mt-5">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent searches</p>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recents.map((r, i) => {
                const primary = r.title ?? extractPrimaryLocality(r.label) ?? r.label
                return (
                  <li key={i}>
                    <button onClick={() => pickRecent(r)} className="flex w-full items-start gap-3 py-3 text-left">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{primary}</span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{r.label}</span>
                      </span>
                      <Clock size={13} className="mt-1 shrink-0 text-slate-300 dark:text-slate-600" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {isAuthenticated && (
          <div className="mt-5">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Saved addresses</p>
            {loadingSaved ? (
              <LoadingBlock />
            ) : !savedAddresses || savedAddresses.length === 0 ? (
              <p className="px-1 py-2 text-sm text-slate-400">No saved addresses yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {savedAddresses.map((address) => (
                  <li key={address.id}>
                    <button onClick={() => chooseSavedAddress(address)} className="flex w-full items-start gap-3 py-3 text-left">
                      <Home size={16} className="mt-0.5 shrink-0 text-slate-400" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-800 dark:text-slate-100">{address.tag ?? 'Address'}</span>
                          {address.isDefault && <Star size={11} className="fill-amber-400 text-amber-400" />}
                        </span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                          {address.house}, {address.address}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => navigate('/profile/addresses/new', { state: { from: '/location' } })} className="mt-1 text-sm font-semibold text-brand-600">
              + Add a new address
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
