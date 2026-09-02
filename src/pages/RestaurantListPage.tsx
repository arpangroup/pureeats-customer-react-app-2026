import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { RestaurantCard } from '@/components/restaurants/RestaurantCard'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { restaurantService } from '@/services/restaurantService'
import { couponService } from '@/services/couponService'
import { useAppConfig } from '@/context/AppConfigContext'
import { columnLayoutClass } from '@/lib/columnLayout'
import { classNames } from '@/lib/format'

type SortKey = 'relevance' | 'rating' | 'deliveryTime'

export default function RestaurantListPage() {
  const { id } = useParams()
  const categoryId = Number(id)
  const config = useAppConfig()
  const { data: categories } = useAsync(() => restaurantService.categories(), [])
  const { data: coupons } = useAsync(() => couponService.listGlobal(), [])
  const { data: restaurants, isLoading } = useAsync(() => restaurantService.byCategory(categoryId), [categoryId])
  const [vegOnly, setVegOnly] = useState(false)
  const [ratingFilter, setRatingFilter] = useState(false)
  const [sort, setSort] = useState<SortKey>('relevance')

  const category = categories?.find((c) => c.id === categoryId)

  const filtered = useMemo(() => {
    let rows = restaurants ?? []
    if (vegOnly) rows = rows.filter((r) => r.isPureveg)
    if (ratingFilter) rows = rows.filter((r) => r.rating >= 4)
    if (sort === 'rating') rows = [...rows].sort((a, b) => b.rating - a.rating)
    if (sort === 'deliveryTime') rows = [...rows].sort((a, b) => a.deliveryTimeMinutes - b.deliveryTimeMinutes)
    return rows
  }, [restaurants, vegOnly, ratingFilter, sort])

  return (
    <div>
      <PageHeader title={category?.name ?? 'Restaurants'} />
      <div className="px-4 py-4">
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={vegOnly} onClick={() => setVegOnly((v) => !v)} label="Pure Veg" />
          <FilterChip active={ratingFilter} onClick={() => setRatingFilter((v) => !v)} label="Rating 4.0+" />
          <FilterChip active={sort === 'rating'} onClick={() => setSort((s) => (s === 'rating' ? 'relevance' : 'rating'))} label="Top rated" />
          <FilterChip active={sort === 'deliveryTime'} onClick={() => setSort((s) => (s === 'deliveryTime' ? 'relevance' : 'deliveryTime'))} label="Fastest delivery" />
        </div>

        {isLoading ? (
          <div className={classNames('grid gap-4', columnLayoutClass(config.restaurantListLayout))}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[16/10] w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No restaurants match" description="Try clearing a filter." />
        ) : (
          <div className={classNames('grid gap-4', columnLayoutClass(config.restaurantListLayout))}>
            {filtered.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} coupons={coupons ?? []} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
        active ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300',
      )}
    >
      {label}
    </button>
  )
}
