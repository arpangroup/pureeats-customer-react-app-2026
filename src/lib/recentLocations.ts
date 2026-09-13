import { readStorage, writeStorage } from '@/lib/storage'

export interface RecentLocation {
  label: string
  latitude: number
  longitude: number
}

const STORAGE_KEY = 'pureeats.recentLocations'
const MAX_ENTRIES = 5

/** Most-recently-picked locations first — works the same for guests and signed-in users, since it's
 * purely a client-side convenience (not a saved address) and needs no account to be useful. */
export function getRecentLocations(): RecentLocation[] {
  return readStorage<RecentLocation[]>(STORAGE_KEY, [])
}

/** Moves `location` to the front, de-duplicating by label, capped at MAX_ENTRIES. */
export function addRecentLocation(location: RecentLocation): void {
  const existing = getRecentLocations().filter((l) => l.label !== location.label)
  writeStorage(STORAGE_KEY, [location, ...existing].slice(0, MAX_ENTRIES))
}
