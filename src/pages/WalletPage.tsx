import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { walletService } from '@/services/walletService'
import { formatCurrency, formatDate } from '@/lib/format'

export default function WalletPage() {
  const { user } = useAuth()
  const { data: balance, isLoading: loadingBalance } = useAsync(() => (user ? walletService.balance(user.id) : Promise.resolve(0)), [user?.id])
  const { data: transactions, isLoading: loadingTx } = useAsync(() => (user ? walletService.transactions(user.id) : Promise.resolve([])), [user?.id])

  return (
    <div>
      <PageHeader title="Wallet" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="card bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white">
          <div className="flex items-center gap-2 text-white/80">
            <Wallet size={16} /> <span className="text-sm">PureEats Wallet</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{loadingBalance ? '—' : formatCurrency(balance ?? 0)}</p>
        </div>

        <h2 className="mb-2 mt-5 text-sm font-semibold text-slate-700 dark:text-slate-200">Transaction history</h2>
        {loadingTx ? (
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <EmptyState title="No transactions yet" />
        ) : (
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.type === 'credit' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/15'}`}>
                  {t.type === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{t.note ?? (t.type === 'credit' ? 'Credit' : 'Debit')}</p>
                  <p className="text-xs text-slate-400">{formatDate(t.createdAt)}</p>
                </div>
                <span className={`text-sm font-bold ${t.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
