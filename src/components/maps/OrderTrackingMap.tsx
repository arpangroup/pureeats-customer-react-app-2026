import { useEffect, useRef } from 'react'
import { GoogleMap, MarkerF, PolylineF } from '@react-google-maps/api'
import { useGoogleMaps } from '@/lib/googleMaps'
import { OsmOrderTrackingMap } from './OsmOrderTrackingMap'
import { lerp, useRiderProgress, type LatLng } from '@/lib/orderTrackingProgress'
import type { OrderStatus } from '@/types/entities'

export interface LiveRider extends LatLng {
  stale: boolean
}

export interface OrderTrackingMapProps {
  restaurant: LatLng
  destination: LatLng
  status: OrderStatus
  /** The rider's real GPS position (GET /orders/{id}/tracking). When absent the map falls back to a simulated marker. */
  rider?: LiveRider | null
  /** Where the rider has been on this order, oldest first - drawn as a solid trail. */
  path?: LatLng[]
  tall?: boolean
}

const BRAND = '#f2612c'

/** Where the rider is heading next: the restaurant until pickup, then the customer. */
function nextStop(status: OrderStatus, restaurant: LatLng, destination: LatLng): LatLng {
  return status === 'RIDER_ASSIGNED' ? restaurant : destination
}

/**
 * Restaurant + delivery-point markers and, once a rider is on the order, their LIVE position with
 * the path they've driven and a highlighted solid line to where they're heading next. Before the rider
 * app has reported any fix it falls back to the old simulated marker easing along the route, so the
 * page still feels alive. Full-bleed/taller (`tall`) for the tracking page's top-of-page layout.
 */
export function OrderTrackingMap(props: OrderTrackingMapProps) {
  const { restaurant, destination, status, rider, path = [], tall } = props
  const { isLoaded, wantsGoogle } = useGoogleMaps()
  const progress = useRiderProgress(status)
  const mapRef = useRef<google.maps.Map | null>(null)
  const fittedForRider = useRef(false)
  const mapContainerStyle = { width: '100%', height: tall ? '340px' : '200px', borderRadius: tall ? '0' : '12px' }

  const live = !!rider
  const riderPosition: LatLng | null = live
    ? { lat: rider!.lat, lng: rider!.lng }
    : status === 'RIDER_ASSIGNED' || status === 'PICKED_UP' || status === 'ON_THE_WAY' || status === 'ARRIVED'
      ? lerp(restaurant, destination, status === 'RIDER_ASSIGNED' ? 0 : status === 'ARRIVED' ? 1 : progress)
      : null

  // Frame everything once the first live fix arrives (and on first load) - later fixes just move the
  // marker so the map doesn't jump while the customer is looking at it.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return
    if (live && fittedForRider.current) return
    const bounds = new google.maps.LatLngBounds()
    bounds.extend(restaurant)
    bounds.extend(destination)
    if (riderPosition && live) bounds.extend(riderPosition)
    map.fitBounds(bounds, 48)
    if (live) fittedForRider.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, live])

  if (!wantsGoogle) return <OsmOrderTrackingMap {...props} />
  if (!isLoaded) return <div className="flex h-[200px] items-center justify-center text-xs text-slate-400">Loading map…</div>

  const center = { lat: (restaurant.lat + destination.lat) / 2, lng: (restaurant.lng + destination.lng) / 2 }
  const target = nextStop(status, restaurant, destination)
  // Solid route, highlighted: a wider white casing under the brand-coloured line so it stands out on any map tile.
  const casing = { strokeColor: '#ffffff', strokeOpacity: 0.95, strokeWeight: 8, zIndex: 1 }
  const route = { strokeColor: BRAND, strokeOpacity: 1, strokeWeight: 5, zIndex: 2 }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={13}
      onLoad={(map) => {
        mapRef.current = map
      }}
      // 'greedy' — same reasoning as AddressMapPicker: plain drag/scroll instead of requiring
      // Ctrl+scroll or two fingers to zoom.
      options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, zoomControl: false, cameraControl: false, gestureHandling: 'greedy' }}
    >
      {live ? (
        <>
          {path.length > 0 && <PolylineF path={[...path, riderPosition!]} options={{ strokeColor: BRAND, strokeOpacity: 0.55, strokeWeight: 4, zIndex: 2 }} />}
          <PolylineF path={[riderPosition!, target]} options={casing} />
          <PolylineF path={[riderPosition!, target]} options={route} />
        </>
      ) : (
        <>
          <PolylineF path={[restaurant, destination]} options={casing} />
          <PolylineF path={[restaurant, destination]} options={route} />
        </>
      )}
      <MarkerF position={restaurant} label={{ text: '🍴', fontSize: '16px' }} />
      <MarkerF position={destination} label={{ text: '📍', fontSize: '16px' }} />
      {riderPosition && <MarkerF position={riderPosition} label={{ text: '🛵', fontSize: '18px' }} opacity={live && rider!.stale ? 0.55 : 1} zIndex={10} />}
    </GoogleMap>
  )
}
