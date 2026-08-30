import { useEffect, useState } from 'react'
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api'
import { useGoogleMaps } from '@/lib/googleMaps'
import { MapUnavailable } from './MapUnavailable'
import type { OrderStatus } from '@/types/entities'

const MAP_CONTAINER_STYLE = { width: '100%', height: '200px', borderRadius: '12px' }

interface Point {
  lat: number
  lng: number
}

function lerp(a: Point, b: Point, t: number): Point {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }
}

/** Restaurant + delivery-address markers, plus a simulated rider marker that eases along the route once a rider is assigned — purely cosmetic (no real GPS feed) but gives the tracking page a live feel. */
export function OrderTrackingMap({ restaurant, destination, status }: { restaurant: Point; destination: Point; status: OrderStatus }) {
  const { isLoaded, loadError, hasApiKey } = useGoogleMaps()
  const [progress, setProgress] = useState(status === 'PICKED_UP' ? 0.15 : status === 'DELIVERED' || status === 'SELF_PICKUP_COMPLETED' ? 1 : 0)

  useEffect(() => {
    if (status !== 'PICKED_UP') return
    const interval = setInterval(() => setProgress((p) => Math.min(0.95, p + 0.05)), 2000)
    return () => clearInterval(interval)
  }, [status])

  if (!hasApiKey || loadError) return <MapUnavailable hasApiKey={hasApiKey} reason={loadError ? 'Map failed to load' : undefined} />
  if (!isLoaded) return <div className="flex h-[200px] items-center justify-center text-xs text-slate-400">Loading map…</div>

  const showRider = status === 'RIDER_ASSIGNED' || status === 'PICKED_UP' || status === 'DELIVERED'
  const riderPosition = lerp(restaurant, destination, status === 'RIDER_ASSIGNED' ? 0 : progress)
  const bounds = { lat: (restaurant.lat + destination.lat) / 2, lng: (restaurant.lng + destination.lng) / 2 }

  return (
    <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} center={bounds} zoom={13} options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}>
      <Polyline path={[restaurant, destination]} options={{ strokeColor: '#f2612c', strokeOpacity: 0.5, strokeWeight: 3, icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.7 }, offset: '0', repeat: '12px' }] }} />
      <Marker position={restaurant} label={{ text: '🍴', fontSize: '16px' }} />
      <Marker position={destination} label={{ text: '📍', fontSize: '16px' }} />
      {showRider && status !== 'DELIVERED' && <Marker position={riderPosition} label={{ text: '🛵', fontSize: '16px' }} />}
    </GoogleMap>
  )
}
