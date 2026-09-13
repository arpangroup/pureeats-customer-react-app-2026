import { readStorage, writeStorage } from '@/lib/storage'

export interface RecentLocation {
  label: string
  /** Searched place's name, when the pick came from a named-place search result rather than a
   * plain map click/drag — shown as the headline instead of a locality guessed from `label`. */
  title?: string
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
