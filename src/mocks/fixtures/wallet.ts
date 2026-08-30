import type { WalletTransaction } from '@/types/entities'

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
}

export const walletBalanceByUser: Record<number, number> = {
  12: 250,
  13: 100,
}

export const walletTransactionsByUser: Record<number, WalletTransaction[]> = {
  12: [
    { id: 1, type: 'credit', amount: 500, note: 'Welcome bonus', createdAt: hoursAgo(200) },
    { id: 2, type: 'debit', amount: 345, note: 'Order PE-2026-000505', createdAt: hoursAgo(1.3) },
    { id: 3, type: 'credit', amount: 95, note: 'Refund for cancelled order PE-2026-000509', createdAt: hoursAgo(119) },
  ],
  13: [{ id: 4, type: 'credit', amount: 100, note: 'Welcome bonus', createdAt: hoursAgo(300) }],
}
