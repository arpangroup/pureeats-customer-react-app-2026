import { useCallback, useRef, useState } from 'react'
import { Autocomplete, GoogleMap, Marker } from '@react-google-maps/api'
import { Search } from 'lucide-react'
import { useGoogleMaps } from '@/lib/googleMaps'
import { OsmMapPicker } from './OsmMapPicker'

const MAP_CONTAINER_STYLE = { width: '100%', height: '220px', borderRadius: '12px' }

interface AddressMapPickerProps {
  latitude: number
  longitude: number
  onChange: (coords: { latitude: number; longitude: number }, formattedAddress?: string) => void
}

/** A draggable-pin map with a place search box — used by the address form. Dragging the pin (or picking a search result) reverse-geocodes to a formatted address via the callback. */
export function AddressMapPicker({ latitude, longitude, onChange }: AddressMapPickerProps) {
  const { isLoaded, loadError, hasApiKey } = useGoogleMaps()
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

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
    map?.panTo({ lat, lng })
    map?.setZoom(16)
    onChange({ latitude: lat, longitude: lng }, place?.formatted_address)
  }

  // No Google Maps API key configured, or the Google script failed to load — fall back to the
  // free OpenStreetMap + Nominatim picker instead of leaving the form without a working map.
  if (!hasApiKey || loadError) return <OsmMapPicker latitude={latitude} longitude={longitude} onChange={onChange} />
  if (!isLoaded) return <div className="flex h-[220px] items-center justify-center text-xs text-slate-400">Loading map…</div>

  return (
    <div className="space-y-2">
      <Autocomplete onLoad={(a) => (autocompleteRef.current = a)} onPlaceChanged={handlePlaceChanged}>
        <div className="input flex items-center gap-2">
          <Search size={15} className="shrink-0 text-slate-400" />
          <input placeholder="Search a place to center the map" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
        </div>
      </Autocomplete>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={{ lat: latitude, lng: longitude }}
        zoom={16}
        onLoad={setMap}
        onClick={handleLatLngChange}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
      >
        <Marker position={{ lat: latitude, lng: longitude }} draggable onDragEnd={handleLatLngChange} />
      </GoogleMap>
      <p className="text-xs text-slate-400">Drag the pin, or tap anywhere on the map, to fine-tune your exact delivery location.</p>
    </div>
  )
}
