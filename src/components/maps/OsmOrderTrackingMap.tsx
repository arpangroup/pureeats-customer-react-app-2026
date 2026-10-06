import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { lerp, useRiderProgress, type LatLng } from '@/lib/orderTrackingProgress'
import type { OrderTrackingMapProps } from './OrderTrackingMap'
import type { OrderStatus } from '@/types/entities'

function emojiIcon(emoji: string): L.DivIcon {
  return L.divIcon({ className: '', html: `<span style="font-size:22px;line-height:1;display:block;filter:drop-shadow(0 1px 1px rgb(0 0 0 / 0.35))">${emoji}</span>`, iconSize: [26, 26], iconAnchor: [13, 13] })
}

const RESTAURANT_ICON = emojiIcon('🍴')
const DESTINATION_ICON = emojiIcon('📍')
const RIDER_ICON = emojiIcon('🛵')
const BRAND = '#f2612c'

const toLL = (p: LatLng): L.LatLngTuple => [p.lat, p.lng]
const nextStop = (status: OrderStatus, restaurant: LatLng, destination: LatLng) => (status === 'RIDER_ASSIGNED' ? restaurant : destination)

/**
 * Free OpenStreetMap stand-in for OrderTrackingMap's Google-powered map — used when no Google Maps
 * key is configured (or the Google script fails to load). Same behaviour: live rider marker, solid
 * driven path and a dashed line to the next stop once GPS fixes arrive; a simulated marker before.
 */
export function OsmOrderTrackingMap({ restaurant, destination, status, rider, path = [], tall }: OrderTrackingMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const riderMarkerRef = useRef<L.Marker | null>(null)
  const trailRef = useRef<L.Polyline | null>(null)
  const legRef = useRef<L.Polyline | null>(null)
  const routeRef = useRef<L.Polyline | null>(null)
  const fittedForRider = useRef(false)
  const progress = useRiderProgress(status)

  const live = !!rider
  const riderPosition: LatLng | null = live
    ? { lat: rider!.lat, lng: rider!.lng }
    : status === 'RIDER_ASSIGNED' || status === 'PICKED_UP' || status === 'ON_THE_WAY'
      ? lerp(restaurant, destination, status === 'RIDER_ASSIGNED' ? 0 : progress)
      : null

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const bounds = L.latLngBounds([toLL(restaurant), toLL(destination)])
    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false }).fitBounds(bounds, { padding: [28, 28] })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)
    L.marker(toLL(restaurant), { icon: RESTAURANT_ICON, interactive: false }).addTo(map)
    L.marker(toLL(destination), { icon: DESTINATION_ICON, interactive: false }).addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      riderMarkerRef.current = null
      trailRef.current = null
      legRef.current = null
      routeRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Lines + rider marker - updated in place on every poll so the map never re-initializes.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (live) {
      routeRef.current?.remove()
      routeRef.current = null
      const trail = [...path.map(toLL), toLL(riderPosition!)]
      if (path.length > 0) {
        if (trailRef.current) trailRef.current.setLatLngs(trail)
        else trailRef.current = L.polyline(trail, { color: BRAND, weight: 4, opacity: 0.9 }).addTo(map)
      }
      const leg = [toLL(riderPosition!), toLL(nextStop(status, restaurant, destination))]
      if (legRef.current) legRef.current.setLatLngs(leg)
      else legRef.current = L.polyline(leg, { color: BRAND, weight: 3, opacity: 0.7, dashArray: '2 8' }).addTo(map)
      if (!fittedForRider.current) {
        map.fitBounds(L.latLngBounds([toLL(restaurant), toLL(destination), toLL(riderPosition!)]), { padding: [32, 32] })
        fittedForRider.current = true
      }
    } else if (!routeRef.current) {
      routeRef.current = L.polyline([toLL(restaurant), toLL(destination)], { color: BRAND, weight: 3, opacity: 0.55, dashArray: '2 8' }).addTo(map)
    }

    if (!riderPosition) {
      riderMarkerRef.current?.remove()
      riderMarkerRef.current = null
      return
    }
    if (!riderMarkerRef.current) {
      riderMarkerRef.current = L.marker(toLL(riderPosition), { icon: RIDER_ICON, interactive: false, zIndexOffset: 1000 }).addTo(map)
    } else {
      riderMarkerRef.current.setLatLng(toLL(riderPosition))
    }
    riderMarkerRef.current.setOpacity(live && rider!.stale ? 0.55 : 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, riderPosition?.lat, riderPosition?.lng, rider?.stale, path.length, status])

  return <div ref={containerRef} className={tall ? 'h-[340px] w-full' : 'h-[200px] w-full overflow-hidden rounded-xl'} />
}
