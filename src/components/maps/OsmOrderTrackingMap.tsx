import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { lerp, useRiderProgress, type LatLng } from '@/lib/orderTrackingProgress'
import type { OrderStatus } from '@/types/entities'

function emojiIcon(emoji: string): L.DivIcon {
  return L.divIcon({ className: '', html: `<span style="font-size:22px;line-height:1;display:block;filter:drop-shadow(0 1px 1px rgb(0 0 0 / 0.35))">${emoji}</span>`, iconSize: [26, 26], iconAnchor: [13, 13] })
}

const RESTAURANT_ICON = emojiIcon('🍴')
const DESTINATION_ICON = emojiIcon('📍')
const RIDER_ICON = emojiIcon('🛵')

/**
 * Free OpenStreetMap stand-in for OrderTrackingMap's Google-powered map — used when no
 * VITE_GOOGLE_MAPS_API_KEY is configured (or the Google script fails to load), mirroring the same
 * restaurant/destination markers, dashed route line, and simulated rider animation.
 */
export function OsmOrderTrackingMap({ restaurant, destination, status, tall }: { restaurant: LatLng; destination: LatLng; status: OrderStatus; tall?: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const riderMarkerRef = useRef<L.Marker | null>(null)
  const progress = useRiderProgress(status)

  const showRider = status === 'RIDER_ASSIGNED' || status === 'PICKED_UP' || status === 'DELIVERED'
  const riderPosition = lerp(restaurant, destination, status === 'RIDER_ASSIGNED' ? 0 : progress)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const bounds = L.latLngBounds([restaurant.lat, restaurant.lng], [destination.lat, destination.lng])
    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false }).fitBounds(bounds, { padding: [28, 28] })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    L.polyline(
      [
        [restaurant.lat, restaurant.lng],
        [destination.lat, destination.lng],
      ],
      { color: '#f2612c', weight: 3, opacity: 0.55, dashArray: '2 8' },
    ).addTo(map)
    L.marker([restaurant.lat, restaurant.lng], { icon: RESTAURANT_ICON, interactive: false }).addTo(map)
    L.marker([destination.lat, destination.lng], { icon: DESTINATION_ICON, interactive: false }).addTo(map)

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      riderMarkerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Add/move/remove the rider marker as delivery progresses — kept separate from the mount effect
  // so the marker eases smoothly instead of the whole map re-initializing every tick.
  useEffect(() => {
    if (!mapRef.current) return
    if (!showRider || status === 'DELIVERED') {
      riderMarkerRef.current?.remove()
      riderMarkerRef.current = null
      return
    }
    if (!riderMarkerRef.current) {
      riderMarkerRef.current = L.marker([riderPosition.lat, riderPosition.lng], { icon: RIDER_ICON, interactive: false }).addTo(mapRef.current)
    } else {
      riderMarkerRef.current.setLatLng([riderPosition.lat, riderPosition.lng])
    }
  }, [riderPosition.lat, riderPosition.lng, showRider, status])

  return <div ref={containerRef} className={tall ? 'h-[340px] w-full' : 'h-[200px] w-full overflow-hidden rounded-xl'} />
}
