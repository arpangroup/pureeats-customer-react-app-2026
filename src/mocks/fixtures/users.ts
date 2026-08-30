import type { User } from '@/types/entities'

/**
 * Demo customer accounts. The first two match the backend's real
 * DemoUserSeeder (`demo.customer1@pureeats.local` / `demo.customer2@pureeats.local`,
 * role CUSTOMER) so the exact same login works unmodified once switched to
 * VITE_DATA_SOURCE=live. The rest are mock-only, for a fuller demo picker.
 */
export const users: User[] = [
  { id: 12, name: 'Demo Customer One', email: 'demo.customer1@pureeats.local', phone: '7000000009', photo: null, role: 'customer', defaultAddressId: 1 },
  { id: 13, name: 'Demo Customer Two', email: 'demo.customer2@pureeats.local', phone: '7000000010', photo: null, role: 'customer', defaultAddressId: 2 },
  { id: 100001, name: 'Arjun Mehta', email: 'arjun.mehta@example.com', phone: '9820011223', photo: null, role: 'customer', defaultAddressId: 3 },
  { id: 100002, name: 'Priya Nair', email: 'priya.nair@example.com', phone: '9820044556', photo: null, role: 'customer', defaultAddressId: 4 },
]
