import { useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { RestaurantCard } from '@/components/restaurants/RestaurantCard'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { restaurantService } from '@/services/restaurantService'
import { couponService } from '@/services/couponService'
import { useAppConfig } from '@/context/AppConfigContext'
import { columnLayoutClass } from '@/lib/columnLayout'
import { selectTopPicks } from '@/lib/topPicks'
import { classNames } from '@/lib/format'

/** "See all" destination for the Home page's Top Picks slider — same selectTopPicks selection, just uncapped (well, a generous cap) and shown as a full grid instead of a horizontal strip. */
export default function TopPicksPage() {
  const config = useAppConfig()
  const { data: restaurants, isLoading } = useAsync(() => restaurantService.list(), [])
  const { data: coupons } = useAsync(() => couponService.listGlobal(), [])

  const topPicks = useMemo(() => selectTopPicks(restaurants ?? [], 30), [restaurants])

  return (
    <div>
      <PageHeader title="Top picks" />
      <div className="px-4 py-4">
        {isLoading ? (
          <div className={classNames('grid gap-4', columnLayoutClass(config.restaurantListLayout))}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] w-full rounded-2xl" />
            ))}
          </div>
        ) : topPicks.length === 0 ? (
          <EmptyState title="No top picks yet" description="Check back once restaurants have ratings or featured picks." />
        ) : (
          <div className={classNames('grid gap-4', columnLayoutClass(config.restaurantListLayout))}>
            {topPicks.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} coupons={coupons ?? []} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
