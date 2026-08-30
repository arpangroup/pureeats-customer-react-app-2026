import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { orderService } from '@/services/orderService'
import { LoadingBlock } from '@/components/ui/Feedback'
import { formatCurrency } from '@/lib/format'

export default function OrderConfirmationPage() {
  const { id } = useParams()
  const orderId = Number(id)
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { data: order, isLoading } = useAsync(() => (user ? orderService.get(user.id, orderId) : Promise.resolve(undefined)), [user?.id, orderId])

  if (!isAuthenticated) return <Navigate to="/" replace />
  if (isLoading) return <LoadingBlock />
  if (!order) return null

  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-fade-in dark:bg-emerald-500/15">
        <CheckCircle2 size={44} />
      </div>
      <h1 className="mt-5 text-xl font-bold text-slate-800 dark:text-slate-100">Order placed!</h1>
      <p className="mt-1.5 max-w-xs text-sm text-slate-500 dark:text-slate-400">
        {order.restaurantName} is preparing your order <span className="font-mono font-semibold">{order.uniqueOrderId}</span>.
      </p>
      <p className="mt-3 text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(order.payable)}</p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-2.5">
        <button className="btn-primary w-full" onClick={() => navigate(`/orders/${order.id}`)}>
          Track order
        </button>
        <button className="btn-secondary w-full" onClick={() => navigate('/')}>
          Back to home
        </button>
      </div>
    </div>
  )
}
