import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { toNumber } from '@/lib/format'
import { IS_MOCK } from '@/config/env'
import { walletBalanceByUser, walletTransactionsByUser } from '@/mocks/fixtures/wallet'
import type { WalletTransaction } from '@/types/entities'

export const walletService = {
  async balance(userId: number): Promise<number> {
    if (IS_MOCK) {
      await mockDelay()
      return walletBalanceByUser[userId] ?? 0
    }
    const { data } = await apiClient.get<{ data: { balance: string } }>('/users/me/wallet')
    return toNumber(data.data.balance)
  },

  async transactions(userId: number): Promise<WalletTransaction[]> {
    if (IS_MOCK) {
      await mockDelay()
      return [...(walletTransactionsByUser[userId] ?? [])].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    }
    const { data } = await apiClient.get<{ data: { id: number; type: string; amount: string; meta: string | null; createdAt: string }[] }>('/users/me/wallet/transactions')
    return data.data.map((t) => ({ id: t.id, type: t.type === 'credit' ? 'credit' : 'debit', amount: toNumber(t.amount), note: t.meta, createdAt: t.createdAt }))
  },
}
