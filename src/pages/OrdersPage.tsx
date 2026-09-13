import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { OrderCard } from '@/components/orders/OrderCard'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { orderService } from '@/services/orderService'
import { ACTIVE_STATUSES } from '@/lib/orderStatus'
import type { Order, OrderSummary } from '@/types/entities'

export default function OrdersPage() {
  const { user } = useAuth()
  const cart = useCart()
  const navigate = useNavigate()
  const { data: orders, isLoading } = useAsync(() => (user ? orderService.listMine(user.id) : Promise.resolve([])), [user?.id])
  const [reorderingId, setReorderingId] = useState<number | null>(null)
  const [pendingReorder, setPendingReorder] = useState<Order | null>(null)

  function performReorder(target: Order) {
    const items = target.items.map((item) => ({ itemId: item.itemId, name: item.name, price: item.price, image: target.restaurantImage, isVeg: false, addons: [], quantity: item.quantity }))
    cart.replaceCartWithItems(target.restaurantId, target.restaurantName, items)
    navigate('/cart')
  }

  async function handleReorder(summary: OrderSummary) {
    if (!user) return
    setReorderingId(summary.id)
    try {
      const full = await orderService.get(user.id, summary.id)
      if (!full) return
      if (cart.wouldReplaceRestaurant(full.restaurantId)) {
        setPendingReorder(full)
        return
      }
      performReorder(full)
    } finally {
      setReorderingId(null)
    }
  }

  const { active, past } = useMemo(() => {
    const all = orders ?? []
    return { active: all.filter((o) => ACTIVE_STATUSES.includes(o.status)), past: all.filter((o) => !ACTIVE_STATUSES.includes(o.status)) }
  }, [orders])

  return (
    <div>
      <PageHeader title="Your orders" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <RequireAuth title="Sign in to see your orders" description="Your order history lives with your account.">
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
                      <OrderCard key={o.id} order={o} onReorder={handleReorder} reordering={reorderingId === o.id} />
                    ))}
                  </div>
                </section>
              )}
              {past.length > 0 && (
                <section>
                  <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Past orders</h2>
                  <div className="space-y-2.5">
                    {past.map((o) => (
                      <OrderCard key={o.id} order={o} onReorder={handleReorder} reordering={reorderingId === o.id} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </RequireAuth>
      </div>

      <ConfirmDialog
        open={!!pendingReorder}
        title="Start a new cart?"
        description={pendingReorder ? `Your cart has items from ${cart.restaurantName}. Reordering from ${pendingReorder.restaurantName} will clear it.` : ''}
        confirmLabel="Clear cart & reorder"
        onCancel={() => setPendingReorder(null)}
        onConfirm={() => {
          if (pendingReorder) performReorder(pendingReorder)
          setPendingReorder(null)
        }}
      />
    </div>
  )
}
