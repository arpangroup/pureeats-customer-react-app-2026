import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingBlock, EmptyState } from '@/components/ui/Feedback'
import { StarRating } from '@/components/ui/StarRating'
import { Textarea } from '@/components/ui/FormControls'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { orderService } from '@/services/orderService'
import { ratingService } from '@/services/ratingService'
import { classNames } from '@/lib/format'

const RESTAURANT_TAGS = ['Tasty', 'On time', 'Well packed', 'Value for money']
const DRIVER_TAGS = ['Friendly', 'Fast', 'Careful handling']

export default function RateOrderPage() {
  const { id } = useParams()
  const orderId = Number(id)
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { data: order, isLoading } = useAsync(() => (user ? orderService.get(user.id, orderId) : Promise.resolve(undefined)), [user?.id, orderId])

  const [restaurantRating, setRestaurantRating] = useState(0)
  const [restaurantTags, setRestaurantTags] = useState<string[]>([])
  const [restaurantComment, setRestaurantComment] = useState('')
  const [driverRating, setDriverRating] = useState(0)
  const [driverTags, setDriverTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  if (!isAuthenticated) {
    return (
      <div>
        <PageHeader title="Rate your order" />
        <div className="mx-auto max-w-lg px-4 py-4">
          <RequireAuth title="Sign in to rate your order" />
        </div>
      </div>
    )
  }

  if (isLoading) return <LoadingBlock />
  if (!order) return <EmptyState title="Order not found" />

  function toggleTag(list: string[], setList: (next: string[]) => void, tag: string) {
    setList(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag])
  }

  async function handleSubmit() {
    if (!user || !order || restaurantRating === 0) return
    setSubmitting(true)
    try {
      await ratingService.submit(user.id, user.name, {
        orderId: order.id,
        rateableType: 'RESTAURANT',
        rateableId: order.restaurantId,
        rating: restaurantRating,
        comment: restaurantComment.trim() || null,
        tags: restaurantTags,
      })
      if (order.deliveryGuyId && driverRating > 0) {
        await ratingService.submit(user.id, user.name, {
          orderId: order.id,
          rateableType: 'DRIVER',
          rateableId: order.deliveryGuyId,
          rating: driverRating,
          comment: null,
          tags: driverTags,
        })
      }
      navigate(`/orders/${order.id}`, { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Rate your order" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="card p-5 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">How was {order.restaurantName}?</p>
          <div className="mt-3 flex justify-center">
            <StarRating value={restaurantRating} onChange={setRestaurantRating} />
          </div>
          {restaurantRating > 0 && (
            <>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {RESTAURANT_TAGS.map((tag) => (
                  <TagChip key={tag} label={tag} active={restaurantTags.includes(tag)} onClick={() => toggleTag(restaurantTags, setRestaurantTags, tag)} />
                ))}
              </div>
              <Textarea value={restaurantComment} onChange={(e) => setRestaurantComment(e.target.value)} placeholder="Tell us more (optional)" className="mt-4 text-left" />
            </>
          )}
        </div>

        {order.deliveryGuyName && (
          <div className="card mt-4 p-5 text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">How was {order.deliveryGuyName}?</p>
            <div className="mt-3 flex justify-center">
              <StarRating value={driverRating} onChange={setDriverRating} />
            </div>
            {driverRating > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {DRIVER_TAGS.map((tag) => (
                  <TagChip key={tag} label={tag} active={driverTags.includes(tag)} onClick={() => toggleTag(driverTags, setDriverTags, tag)} />
                ))}
              </div>
            )}
          </div>
        )}

        <button className="btn-primary mt-4 w-full" disabled={restaurantRating === 0 || submitting} onClick={handleSubmit}>
          {submitting ? 'Submitting…' : 'Submit rating'}
        </button>
      </div>
    </div>
  )
}

function TagChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
        active ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300',
      )}
    >
      {label}
    </button>
  )
}
