import type { Address } from '@/types/entities'

/** Mock-only field, stripped by addressService before returning to the app (the real backend scopes addresses by the authenticated user, never returns a userId in the response). */
export interface MockAddress extends Address {
  userId: number
}

export const addresses: MockAddress[] = [
  { id: 1, userId: 12, house: '221B, Brigade Towers', address: '5th Block, Koramangala, Bengaluru', landmark: 'Forum Mall', tag: 'Home', latitude: 12.9352, longitude: 77.6101, isDefault: true },
  { id: 2, userId: 12, house: 'WeWork, 4th Floor', address: 'Outer Ring Road, Marathahalli, Bengaluru', landmark: 'Innovative Multiplex', tag: 'Work', latitude: 12.9569, longitude: 77.7011, isDefault: false },
  { id: 3, userId: 13, house: 'Flat 302, Prestige Meadows', address: 'HSR Layout, Bengaluru', landmark: 'Agara Lake', tag: 'Home', latitude: 12.9151, longitude: 77.6386, isDefault: true },
  { id: 4, userId: 100001, house: 'Villa 7, Palm Meadows', address: 'Whitefield, Bengaluru', landmark: '', tag: 'Home', latitude: 12.9698, longitude: 77.7500, isDefault: true },
  { id: 5, userId: 100002, house: 'A-604, Sobha Dream Acres', address: 'Panathur Road, Bengaluru', landmark: '', tag: 'Home', latitude: 12.9351, longitude: 77.6968, isDefault: true },
]
