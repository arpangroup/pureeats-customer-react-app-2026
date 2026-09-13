import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { GoogleMap, MarkerF } from '@react-google-maps/api'
import { useGoogleMaps } from '@/lib/googleMaps'
import { IS_DEV } from '@/config/env'
import { OsmMapPicker } from './OsmMapPicker'

interface AddressMapPickerProps {
  latitude: number
  longitude: number
  onChange: (coords: { latitude: number; longitude: number }, formattedAddress?: string, title?: string) => void
  /** Rendered absolutely-positioned over the map itself (e.g. a floating "use my location" button, bottom-right) — see AddressFormPage. */
  overlay?: ReactNode
  /** Full-bleed, taller map for the address form's redesigned top-of-page layout. */
  tall?: boolean
}

/**
 * google.maps.places.Autocomplete (what this used to wrap) is deprecated for new customers as of
 * March 2025 in favor of google.maps.places.PlaceAutocompleteElement — a plain custom element with
 * no React binding yet in @react-google-maps/api v2.20, so it's created and attached imperatively
 * here, the same way OsmMapPicker manages its Leaflet map by ref. It renders its own search icon,
 * input and results dropdown (no `.input` wrapper/icon of our own needed), and fires `gmp-select`
 * with `event.placePrediction` — not `event.place`, despite what the installed @types/google.maps
 * (still describing an older beta shape) claims; verified against the actual loaded API.
 */
function PlaceSearchBox({ onPlaceSelected, tall }: { onPlaceSelected: (place: google.maps.places.Place) => void; tall?: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const onPlaceSelectedRef = useRef(onPlaceSelected)
  onPlaceSelectedRef.current = onPlaceSelected

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const element = new google.maps.places.PlaceAutocompleteElement({})
    element.style.width = '100%'
    container.appendChild(element)

    function handleSelect(event: Event) {
      const { placePrediction } = event as unknown as { placePrediction: google.maps.places.PlacePrediction | null }
      if (!placePrediction) return
      const place = placePrediction.toPlace()
      place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] }).then(() => onPlaceSelectedRef.current(place))
    }
    element.addEventListener('gmp-select', handleSelect)

    return () => {
      element.removeEventListener('gmp-select', handleSelect)
      container.removeChild(element)
    }
  }, [])

  return <div ref={containerRef} className={tall ? 'w-full rounded-xl bg-white shadow-md dark:bg-slate-900' : 'w-full'} />
}

/**
 * A draggable-pin map with a place search box — used by the address form. Dragging the pin (or
 * picking a search result) reverse-geocodes to a formatted address via the callback.
 *
 * Which provider renders is decided by useGoogleMaps: Google whenever a key is configured and
 * loads successfully, OSM (the free option that needs no key) otherwise — so the form never
 * renders without a working map.
 */
export function AddressMapPicker({ latitude, longitude, onChange, overlay, tall }: AddressMapPickerProps) {
  const { isLoaded, wantsGoogle } = useGoogleMaps()
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const mapContainerStyle = { width: '100%', height: tall ? '380px' : '220px', borderRadius: tall ? '0' : '12px' }

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!window.google) return
    new google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
      if (IS_DEV) console.log('[AddressMapPicker] Google reverse geocode', { lat, lng, status }, '→', results)
      onChange({ latitude: lat, longitude: lng }, status === 'OK' ? results?.[0]?.formatted_address : undefined)
    })
  }, [onChange])

  /** Shared handler for both dragging the pin and clicking anywhere on the map — same MapMouseEvent shape either way. */
  function handleLatLngChange(e: google.maps.MapMouseEvent) {
    const lat = e.latLng?.lat()
    const lng = e.latLng?.lng()
    if (lat !== undefined && lng !== undefined) reverseGeocode(lat, lng)
  }

  function handlePlaceSelected(place: google.maps.places.Place) {
    const location = place.location
    if (!location) return
    const lat = location.lat()
    const lng = location.lng()
    if (IS_DEV) console.log('[AddressMapPicker] Google place picked', { lat, lng }, '→', place.formattedAddress, place)
    mapInstance?.panTo({ lat, lng })
    mapInstance?.setZoom(16)
    onChange({ latitude: lat, longitude: lng }, place.formattedAddress ?? undefined, place.displayName ?? undefined)
  }

  // Google renders whenever a key is actually configured and loads successfully - OSM is the
  // fallback for a missing or invalid key (see useGoogleMaps).
  if (!wantsGoogle) return <OsmMapPicker latitude={latitude} longitude={longitude} onChange={onChange} overlay={overlay} tall={tall} />
  if (!isLoaded) return <div className="flex h-[220px] items-center justify-center text-xs text-slate-400">Loading map…</div>

  const searchBox = <PlaceSearchBox onPlaceSelected={handlePlaceSelected} tall={tall} />

  const map = (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={{ lat: latitude, lng: longitude }}
      zoom={16}
      onLoad={setMapInstance}
      onClick={handleLatLngChange}
      // 'greedy' — plain one-finger drag to pan and a bare scroll-wheel to zoom, no Ctrl/two-finger
      // gesture required. Google's own default ('cooperative') exists to stop a map from trapping
      // page-scroll when it's embedded low in a long scrolling page, but this map is the whole
      // point of the screen it's on, so that trade-off doesn't apply here.
      options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, zoomControl: false, gestureHandling: 'greedy' }}
    >
      {/* MarkerF, not the class-based Marker - the latter silently never attached a visible pin
          to the map (constructed without throwing, per its own deprecation warning, but no
          gstatic marker-icon request ever fired and nothing appeared) on every map mounted via
          client-side navigation rather than a full page load; MarkerF doesn't have that problem. */}
      <MarkerF position={{ lat: latitude, lng: longitude }} draggable onDragEnd={handleLatLngChange} />
    </GoogleMap>
  )

  if (tall) {
    return (
      <div className="relative">
        {map}
        <div className="pointer-events-none absolute inset-0">
          <div className="pointer-events-auto p-3">{searchBox}</div>
          {overlay && <div className="pointer-events-auto absolute bottom-4 right-4">{overlay}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {searchBox}
      {map}
      <p className="text-xs text-slate-400">Drag the pin, or tap anywhere on the map, to fine-tune your exact delivery location.</p>
    </div>
  )
}
