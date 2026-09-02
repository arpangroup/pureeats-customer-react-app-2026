import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Autocomplete, GoogleMap, Marker } from '@react-google-maps/api'
import { Search } from 'lucide-react'
import { useGoogleMaps } from '@/lib/googleMaps'
import { useAppConfig } from '@/context/AppConfigContext'
import { OsmMapPicker } from './OsmMapPicker'

interface AddressMapPickerProps {
  latitude: number
  longitude: number
  onChange: (coords: { latitude: number; longitude: number }, formattedAddress?: string) => void
  /** Rendered absolutely-positioned over the map itself (e.g. a floating "use my location" button, bottom-right) — see AddressFormPage. */
  overlay?: ReactNode
  /** Full-bleed, taller map for the address form's redesigned top-of-page layout. */
  tall?: boolean
}

/**
 * A draggable-pin map with a place search box — used by the address form. Dragging the pin (or
 * picking a search result) reverse-geocodes to a formatted address via the callback.
 *
 * Which provider renders is `config.mapProvider` (defaults to OSM — the free option that needs no
 * API key) — Google is only attempted when the backend explicitly opts in AND a key is actually
 * configured; any failure to load it (missing key, script error) falls back to OSM either way, so
 * the form never renders without a working map.
 */
export function AddressMapPicker({ latitude, longitude, onChange, overlay, tall }: AddressMapPickerProps) {
  const { mapProvider } = useAppConfig()
  const { isLoaded, loadError, hasApiKey } = useGoogleMaps()
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const mapContainerStyle = { width: '100%', height: tall ? '380px' : '220px', borderRadius: tall ? '0' : '12px' }

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!window.google) return
    new google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
      onChange({ latitude: lat, longitude: lng }, status === 'OK' ? results?.[0]?.formatted_address : undefined)
    })
  }, [onChange])

  /** Shared handler for both dragging the pin and clicking anywhere on the map — same MapMouseEvent shape either way. */
  function handleLatLngChange(e: google.maps.MapMouseEvent) {
    const lat = e.latLng?.lat()
    const lng = e.latLng?.lng()
    if (lat !== undefined && lng !== undefined) reverseGeocode(lat, lng)
  }

  function handlePlaceChanged() {
    const place = autocompleteRef.current?.getPlace()
    const location = place?.geometry?.location
    if (!location) return
    const lat = location.lat()
    const lng = location.lng()
    mapInstance?.panTo({ lat, lng })
    mapInstance?.setZoom(16)
    onChange({ latitude: lat, longitude: lng }, place?.formatted_address)
  }

  // Google is only attempted when the backend explicitly configured it AND a key is actually
  // present — OSM is the default and the fallback for a missing key, a failed script load, or the
  // backend simply not opting in.
  const wantsGoogle = mapProvider === 'GOOGLE' && hasApiKey && !loadError
  if (!wantsGoogle) return <OsmMapPicker latitude={latitude} longitude={longitude} onChange={onChange} overlay={overlay} tall={tall} />
  if (!isLoaded) return <div className="flex h-[220px] items-center justify-center text-xs text-slate-400">Loading map…</div>

  const searchBox = (
    <Autocomplete onLoad={(a) => (autocompleteRef.current = a)} onPlaceChanged={handlePlaceChanged}>
      <div className={tall ? 'input flex items-center gap-2 bg-white shadow-md dark:bg-slate-900' : 'input flex items-center gap-2'}>
        <Search size={15} className="shrink-0 text-slate-400" />
        <input placeholder="Search a place to center the map" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
      </div>
    </Autocomplete>
  )

  const map = (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={{ lat: latitude, lng: longitude }}
      zoom={16}
      onLoad={setMapInstance}
      onClick={handleLatLngChange}
      options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, zoomControl: false }}
    >
      <Marker position={{ lat: latitude, lng: longitude }} draggable onDragEnd={handleLatLngChange} />
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
