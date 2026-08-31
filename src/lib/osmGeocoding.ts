/**
 * Free fallback for the address map picker when no Google Maps API key is configured —
 * OpenStreetMap tiles (via Leaflet) plus Nominatim for search/reverse-geocoding, no key needed.
 * Nominatim's usage policy (https://operations.osmfoundation.org/policies/nominatim/) caps this
 * at low request volumes — fine for local dev/demo use; swap in a hosted Nominatim instance or a
 * paid geocoder before any real production traffic.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

export interface OsmPlaceResult {
  label: string
  latitude: number
  longitude: number
}

export async function osmReverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  try {
    const res = await fetch(`${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return undefined
    const data = await res.json()
    return typeof data?.display_name === 'string' ? data.display_name : undefined
  } catch {
    return undefined
  }
}

export async function osmSearchPlaces(query: string): Promise<OsmPlaceResult[]> {
  const q = query.trim()
  if (!q) return []
  try {
    const res = await fetch(`${NOMINATIM_BASE}/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.map((r: { display_name: string; lat: string; lon: string }) => ({
      label: r.display_name,
      latitude: Number(r.lat),
      longitude: Number(r.lon),
    }))
  } catch {
    return []
  }
}
