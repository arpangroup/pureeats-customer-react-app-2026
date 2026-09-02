import { GoogleMap, Marker, Polyline } from '@react-google-maps/api'
import { useAppConfig } from '@/context/AppConfigContext'
import { useGoogleMaps } from '@/lib/googleMaps'
import { OsmOrderTrackingMap } from './OsmOrderTrackingMap'
import { lerp, useRiderProgress, type LatLng } from '@/lib/orderTrackingProgress'
import type { OrderStatus } from '@/types/entities'

/** Restaurant + delivery-address markers, plus a simulated rider marker that eases along the route once a rider is assigned — purely cosmetic (no real GPS feed) but gives the tracking page a live feel. Full-bleed/taller (`tall`) for the order-tracking page's redesigned top-of-page layout. */
export function OrderTrackingMap({ restaurant, destination, status, tall }: { restaurant: LatLng; destination: LatLng; status: OrderStatus; tall?: boolean }) {
  const { mapProvider } = useAppConfig()
  const { isLoaded, loadError, hasApiKey } = useGoogleMaps()
  const progress = useRiderProgress(status)
  const mapContainerStyle = { width: '100%', height: tall ? '340px' : '200px', borderRadius: tall ? '0' : '12px' }

  // Same provider-selection rule as AddressMapPicker: OSM by default, Google only when the backend
  // opts in AND a key is actually configured, falling back to OSM on any load failure either way.
  const wantsGoogle = mapProvider === 'GOOGLE' && hasApiKey && !loadError
  if (!wantsGoogle) return <OsmOrderTrackingMap restaurant={restaurant} destination={destination} status={status} tall={tall} />
  if (!isLoaded) return <div className="flex h-[200px] items-center justify-center text-xs text-slate-400">Loading map…</div>

  const showRider = status === 'RIDER_ASSIGNED' || status === 'PICKED_UP' || status === 'DELIVERED'
  const riderPosition = lerp(restaurant, destination, status === 'RIDER_ASSIGNED' ? 0 : progress)
  const bounds = { lat: (restaurant.lat + destination.lat) / 2, lng: (restaurant.lng + destination.lng) / 2 }

  return (
    <GoogleMap mapContainerStyle={mapContainerStyle} center={bounds} zoom={13} options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, zoomControl: false }}>
      <Polyline path={[restaurant, destination]} options={{ strokeColor: '#f2612c', strokeOpacity: 0.5, strokeWeight: 3, icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.7 }, offset: '0', repeat: '12px' }] }} />
      <Marker position={restaurant} label={{ text: '🍴', fontSize: '16px' }} />
      <Marker position={destination} label={{ text: '📍', fontSize: '16px' }} />
      {showRider && status !== 'DELIVERED' && <Marker position={riderPosition} label={{ text: '🛵', fontSize: '16px' }} />}
    </GoogleMap>
  )
}
