import { useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { OrderCard } from '@/components/orders/OrderCard'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { orderService } from '@/services/orderService'
import { ACTIVE_STATUSES } from '@/lib/orderStatus'

export default function OrdersPage() {
  const { user } = useAuth()
  const { data: orders, isLoading } = useAsync(() => (user ? orderService.listMine(user.id) : Promise.resolve([])), [user?.id])

  const { active, past } = useMemo(() => {
    const all = orders ?? []
    return { active: all.filter((o) => ACTIVE_STATUSES.includes(o.status)), past: all.filter((o) => !ACTIVE_STATUSES.includes(o.status)) }
  }, [orders])

  return (
    <div>
      <PageHeader title="Your orders" />
      <div className="mx-auto max-w-lg px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (orders ?? []).length === 0 ? (
          <EmptyState title="No orders yet" description="When you place an order, it'll show up here." />
        ) : (
          <>
            {active.length > 0 && (
              <section className="mb-5">
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Active</h2>
                <div className="space-y-2.5">
                  {active.map((o) => (
                    <OrderCard key={o.id} order={o} />
                  ))}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Past orders</h2>
                <div className="space-y-2.5">
                  {past.map((o) => (
                    <OrderCard key={o.id} order={o} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
