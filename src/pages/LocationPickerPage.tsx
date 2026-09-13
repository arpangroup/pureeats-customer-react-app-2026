import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Home, LocateFixed, MapPin, Search, Star } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingBlock } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { useActiveLocation } from '@/hooks/useLocation'
import { addressService } from '@/services/addressService'
import { getCurrentPosition } from '@/lib/geolocation'
import { osmReverseGeocode, osmSearchPlaces, type OsmPlaceResult } from '@/lib/osmGeocoding'
import { getRecentLocations, addRecentLocation, type RecentLocation } from '@/lib/recentLocations'
import type { Address } from '@/types/entities'

/**
 * Location picker reachable by anyone — signed in or not. Browsing (and picking which address
 * "nearby" restaurants are computed from) never requires an account; only checking out does, and
 * that flow already asks for sign-in and a real saved address separately. A guest's pick here is a
 * one-off point (search result, current location, or a recent pick) rather than a saved Address
 * row, represented as a synthetic Address so it can flow through the same activeAddress context
 * every other screen already reads.
 */
export default function LocationPickerPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { setActiveAddress, setDetectedLocation } = useActiveLocation()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<OsmPlaceResult[]>([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)
  const [recents, setRecents] = useState<RecentLocation[]>(() => getRecentLocations())

  const { data: savedAddresses, isLoading: loadingSaved } = useAsync(
    () => (user ? addressService.list(user.id) : Promise.resolve([])),
    [user?.id],
  )

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = query.trim()
    if (!q) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const found = await osmSearchPlaces(q)
      setResults(found)
      setSearching(false)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // A quick pick here (search result, current GPS, or a recent one) is a browsing-only location
  // override, not a saved address — it goes into the same detected-location slot the automatic
  // GPS/IP resolution already uses (see LocationContext/locationResolution.ts), which every auth
  // state's priority list already reads. Persisting it as a real saved Address would be wrong for
  // both a guest (nothing to persist it to) and a signed-in user (this isn't the "add address" flow
  // — that's still available below via "+ Add a new address").
  function choosePoint(label: string, latitude: number, longitude: number) {
    setDetectedLocation('gps', { label, latitude, longitude })
    addRecentLocation({ label, latitude, longitude })
    navigate(-1)
  }

  function chooseSavedAddress(address: Address) {
    setActiveAddress(address)
    navigate(-1)
  }

  async function handleUseCurrentLocation() {
    setLocating(true)
    setLocateError(null)
    try {
      const { latitude, longitude } = await getCurrentPosition()
      const label = (await osmReverseGeocode(latitude, longitude)) ?? 'Current location'
      choosePoint(label, latitude, longitude)
    } catch (err) {
      setLocateError((err as Error).message)
    } finally {
      setLocating(false)
    }
  }

  const showRecents = !query.trim() && recents.length > 0

  return (
    <div>
      <PageHeader title="Select location" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="input flex items-center gap-2">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for an area, street name…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        <button
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="mt-3 flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 text-left disabled:opacity-60 dark:border-slate-700"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15">
            <LocateFixed size={16} className={locating ? 'animate-pulse' : undefined} />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-brand-600">{locating ? 'Locating…' : 'Use current location'}</span>
            <span className="block text-xs text-slate-400">Uses your device's GPS</span>
          </span>
        </button>
        {locateError && <p className="mt-1.5 text-xs text-rose-500">{locateError}</p>}

        {query.trim() && (
          <div className="mt-4">
            {searching ? (
              <LoadingBlock />
            ) : results.length === 0 ? (
              <p className="px-1 py-3 text-sm text-slate-400">No matches found — try a different search.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.map((r, i) => (
                  <li key={i}>
                    <button onClick={() => choosePoint(r.label, r.latitude, r.longitude)} className="flex w-full items-start gap-3 py-3 text-left">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{r.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {showRecents && (
          <div className="mt-5">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent searches</p>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recents.map((r, i) => (
                <li key={i}>
                  <button onClick={() => choosePoint(r.label, r.latitude, r.longitude)} className="flex w-full items-start gap-3 py-3 text-left">
                    <Clock size={16} className="mt-0.5 shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{r.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isAuthenticated && !query.trim() && (
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
