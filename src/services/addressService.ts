import { apiClient } from '@/lib/apiClient'
import { mockDelay, nextMockId } from '@/lib/mockUtils'
import { toNumber } from '@/lib/format'
import { IS_MOCK } from '@/config/env'
import { addresses } from '@/mocks/fixtures/addresses'
import type { Address } from '@/types/entities'

export interface AddressInput {
  house: string
  address: string
  landmark: string | null
  tag: string | null
  latitude: number
  longitude: number
  makeDefault: boolean
}

interface LiveAddress {
  id: number
  house: string
  address: string
  landmark: string | null
  tag: string | null
  latitude: string
  longitude: string
  isDefault: boolean
}

function mapLive(d: LiveAddress): Address {
  return { id: d.id, house: d.house, address: d.address, landmark: d.landmark, tag: d.tag, latitude: toNumber(d.latitude), longitude: toNumber(d.longitude), isDefault: d.isDefault }
}

function stripUserId({ userId: _userId, ...rest }: (typeof addresses)[number]): Address {
  return rest
}

export const addressService = {
  async list(userId: number): Promise<Address[]> {
    if (IS_MOCK) {
      await mockDelay()
      return addresses.filter((a) => a.userId === userId).map(stripUserId)
    }
    const { data } = await apiClient.get<{ data: LiveAddress[] }>('/users/me/addresses')
    return data.data.map(mapLive)
  },

  async create(userId: number, payload: AddressInput): Promise<Address> {
    if (IS_MOCK) {
      await mockDelay()
      if (payload.makeDefault) addresses.forEach((a) => a.userId === userId && (a.isDefault = false))
      const created = { id: nextMockId(), userId, house: payload.house, address: payload.address, landmark: payload.landmark, tag: payload.tag, latitude: payload.latitude, longitude: payload.longitude, isDefault: payload.makeDefault }
      addresses.push(created)
      return stripUserId(created)
    }
    const { data } = await apiClient.post<{ data: LiveAddress }>('/users/me/addresses', payload)
    return mapLive(data.data)
  },

  async update(userId: number, id: number, payload: AddressInput): Promise<Address> {
    if (IS_MOCK) {
      await mockDelay()
      const index = addresses.findIndex((a) => a.id === id)
      if (index === -1) throw { message: 'Address not found' }
      if (payload.makeDefault) addresses.forEach((a) => a.userId === userId && (a.isDefault = false))
      addresses[index] = { ...addresses[index], house: payload.house, address: payload.address, landmark: payload.landmark, tag: payload.tag, latitude: payload.latitude, longitude: payload.longitude, isDefault: payload.makeDefault || addresses[index].isDefault }
      return stripUserId(addresses[index])
    }
    const { data } = await apiClient.put<{ data: LiveAddress }>(`/users/me/addresses/${id}`, payload)
    return mapLive(data.data)
  },

  async remove(id: number): Promise<void> {
    if (IS_MOCK) {
      await mockDelay()
      const index = addresses.findIndex((a) => a.id === id)
      if (index !== -1) addresses.splice(index, 1)
      return
    }
    await apiClient.delete(`/users/me/addresses/${id}`)
  },

  async setDefault(userId: number, id: number): Promise<void> {
    if (IS_MOCK) {
      await mockDelay(150)
      addresses.forEach((a) => a.userId === userId && (a.isDefault = a.id === id))
      return
    }
    await apiClient.patch(`/users/me/addresses/${id}/default`)
  },
}
