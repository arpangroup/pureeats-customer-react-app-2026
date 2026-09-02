import { useEffect, useRef, useState, type ReactNode } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search } from 'lucide-react'
import { osmReverseGeocode, osmSearchPlaces, type OsmPlaceResult } from '@/lib/osmGeocoding'

interface OsmMapPickerProps {
  latitude: number
  longitude: number
  onChange: (coords: { latitude: number; longitude: number }, formattedAddress?: string) => void
  /** Rendered absolutely-positioned over the map itself (e.g. a floating "use my location" button, bottom-right) — see AddressFormPage. */
  overlay?: ReactNode
  /** Full-bleed, taller map for the address form's redesigned top-of-page layout; the compact 220px default is used elsewhere (e.g. inline pickers). */
  tall?: boolean
}

// Leaflet's default marker PNGs resolve to broken relative paths once bundled — an inline SVG
// pin sidesteps that entirely and lets the marker match the app's brand color.
const PIN_ICON = L.divIcon({
  className: '',
  html: `<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27c0-8.3-6.7-15-15-15z" fill="#e0491a"/>
    <circle cx="15" cy="15" r="6" fill="#fff"/>
  </svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
})

/**
 * Free OpenStreetMap + Nominatim stand-in for AddressMapPicker's Google-powered map — used when
 * no VITE_GOOGLE_MAPS_API_KEY is configured (or the Google script fails to load), so the address
 * form always has a working map. Same contract: dragging or clicking places the pin and reverse-
 * geocodes it back through onChange, and the search box re-centers the map on a picked result.
 */
export function OsmMapPicker({ latitude, longitude, onChange, overlay, tall }: OsmMapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<OsmPlaceResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  async function movePin(lat: number, lng: number, pan: boolean) {
    markerRef.current?.setLatLng([lat, lng])
    if (pan) mapRef.current?.panTo([lat, lng])
    const address = await osmReverseGeocode(lat, lng)
    onChangeRef.current({ latitude: lat, longitude: lng }, address)
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true }).setView([latitude, longitude], 16)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    const marker = L.marker([latitude, longitude], { icon: PIN_ICON, draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      movePin(pos.lat, pos.lng, false)
    })
    map.on('click', (e: L.LeafletMouseEvent) => movePin(e.latlng.lat, e.latlng.lng, false))

    mapRef.current = map
    markerRef.current = marker

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the pin in sync when coordinates change from outside this component (e.g. "Use my
  // current location", or switching to editing a different address) — guarded so it doesn't
  // fight the map while the user is actively dragging the marker themselves.
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    const current = markerRef.current.getLatLng()
    if (Math.abs(current.lat - latitude) < 1e-9 && Math.abs(current.lng - longitude) < 1e-9) return
    markerRef.current.setLatLng([latitude, longitude])
    mapRef.current.panTo([latitude, longitude])
  }, [latitude, longitude])

  // Set by pickResult right before it fills the box with the picked result's full label — without
  // it, that setQuery would itself be treated as a new search and reopen the dropdown ~400ms later.
  const suppressNextSearchRef = useRef(false)

  useEffect(() => {
    if (suppressNextSearchRef.current) {
      suppressNextSearchRef.current = false
      return
    }
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    setSearching(true)
    const timer = setTimeout(async () => {
      const found = await osmSearchPlaces(q)
      setResults(found)
      setSearching(false)
      setShowResults(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  function pickResult(result: OsmPlaceResult) {
    suppressNextSearchRef.current = true
    setQuery(result.label)
    setShowResults(false)
    mapRef.current?.setZoom(16)
    movePin(result.latitude, result.longitude, true)
  }

  const searchBox = (
    <div className={tall ? 'relative z-[1100] p-3' : 'relative z-[1100]'}>
      <div className="input flex items-center gap-2 bg-white shadow-md dark:bg-slate-900">
        <Search size={15} className="shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
          placeholder="Search a place to center the map"
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>
      {showResults && query.trim() && (
        <div className="absolute inset-x-0 top-full z-[1100] mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {searching ? (
            <p className="px-3 py-2 text-xs text-slate-400">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">No matches found</p>
          ) : (
            results.map((r, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickResult(r)}
                className="block w-full truncate px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {r.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )

  if (tall) {
    return (
      <div className="relative">
        <div ref={containerRef} className="h-[320px] w-full sm:h-[380px]" />
        {/* Leaflet's own panes carry z-index up to 1000 and escape a plain wrapper's stacking
            context, so both the search box and the locate-me overlay need z-[1100]+ to sit above them. */}
        <div className="pointer-events-none absolute inset-0 z-[1100]">
          <div className="pointer-events-auto">{searchBox}</div>
          {overlay && <div className="pointer-events-auto absolute bottom-4 right-4">{overlay}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {searchBox}
      <div ref={containerRef} className="h-[220px] w-full overflow-hidden rounded-xl" />
      <p className="text-xs text-slate-400">Drag the pin, or tap anywhere on the map, to fine-tune your exact delivery location.</p>
    </div>
  )
}
