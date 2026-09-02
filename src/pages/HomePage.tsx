import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, MapPin, Search, Tag } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { restaurantService } from '@/services/restaurantService'
import { couponService } from '@/services/couponService'
import { menuService } from '@/services/menuService'
import { promoSliderService } from '@/services/promoSliderService'
import { useActiveLocation } from '@/hooks/useLocation'
import { useAppConfig } from '@/context/AppConfigContext'
import { RestaurantCard } from '@/components/restaurants/RestaurantCard'
import { RecommendedItemCard } from '@/components/home/RecommendedItemCard'
import { PromoSlider } from '@/components/home/PromoSlider'
import { AudioSearchIcon } from '@/components/ui/AudioSearchIcon'
import { OngoingOrderBar } from '@/components/orders/OngoingOrderBar'
import { Skeleton } from '@/components/ui/Feedback'
import { columnLayoutClass, evenOutForGrid } from '@/lib/columnLayout'
import { selectTopPicks } from '@/lib/topPicks'
import { classNames } from '@/lib/format'

export default function HomePage() {
  const navigate = useNavigate()
  const { activeAddress } = useActiveLocation()
  const config = useAppConfig()
  const { data: restaurants, isLoading } = useAsync(() => restaurantService.list(), [])
  const { data: categories } = useAsync(() => restaurantService.categories(), [])
  const { data: coupons } = useAsync(() => couponService.listGlobal(), [])
  const { data: promoSlides } = useAsync(() => (config.promoSliderEnabled ? promoSliderService.listSlides() : Promise.resolve([])), [config.promoSliderEnabled])
  const { data: recommendedItems, isLoading: loadingRecommended } = useAsync(
    () => (config.recommendedItemsEnabled ? menuService.recommendedItems(12) : Promise.resolve([])),
    [config.recommendedItemsEnabled],
  )

  // Capped at 4 — the slider is a quick taste, not a full listing (see the "See all" link to /top-picks).
  const topPicks = useMemo(() => selectTopPicks(restaurants ?? [], 4), [restaurants])
  const recommendedGrid = useMemo(
    () => evenOutForGrid(recommendedItems ?? [], config.recommendedItemsLayout),
    [recommendedItems, config.recommendedItemsLayout],
  )
  const restaurantGrid = useMemo(
    () => evenOutForGrid(restaurants ?? [], config.restaurantListLayout),
    [restaurants, config.restaurantListLayout],
  )

  return (
    <div className="bg-white dark:bg-slate-950">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3 pt-safe dark:border-slate-800 dark:bg-slate-900 md:hidden">
        <button onClick={() => navigate('/profile/addresses')} className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <MapPin size={16} className="text-brand-600" />
          {activeAddress ? activeAddress.tag ?? 'Delivering to' : 'Set your location'}
          <ChevronDown size={14} className="text-slate-400" />
        </button>
        <button onClick={() => navigate('/search')} className="input mt-2.5 flex items-center gap-2 text-left text-sm text-slate-400">
          <Search size={16} className="shrink-0" />
          <span className="flex-1">Search for restaurants and dishes</span>
          {config.audioSearchEnabled && <AudioSearchIcon onClick={() => navigate('/search')} />}
        </button>
      </div>

      <div className="px-4 py-4 md:px-0">
        {config.promoSliderEnabled && promoSlides && promoSlides.length > 0 && <PromoSlider slides={promoSlides} />}

        {categories && categories.length > 0 && (
          <section className="mb-6">
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {categories.map((c) => (
                <Link key={c.id} to={`/category/${c.id}`} className="flex w-18 shrink-0 flex-col items-center gap-1.5 text-center">
                  <span className="h-16 w-16 overflow-hidden rounded-3xl border border-slate-200 shadow-sm dark:border-slate-800">
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                  </span>
                  <span className="text-xs font-medium leading-tight text-slate-600 dark:text-slate-300">{c.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {coupons && coupons.length > 0 && (
          <section className="mb-6">
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {coupons.map((c) => (
                <div key={c.id} className="flex min-w-[220px] shrink-0 items-center gap-2.5 rounded-2xl border border-dashed border-brand-300 bg-brand-50 px-3.5 py-3 dark:border-brand-500/40 dark:bg-brand-500/10">
                  <Tag size={20} className="shrink-0 text-brand-600" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-brand-700 dark:text-brand-400">{c.name}</p>
                    <p className="truncate text-xs text-brand-600/80 dark:text-brand-400/70">
                      Use <span className="font-mono font-semibold">{c.code}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-white dark:bg-slate-950">
                <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
                <div className="space-y-2 pt-2.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {config.topPicksEnabled && topPicks.length > 0 && <SectionHeader title="Top picks" seeAllTo="/top-picks" />}
            {config.topPicksEnabled && topPicks.length > 0 && (
              <section className="mb-6">
                <div className="no-scrollbar -mx-4 flex gap-3.5 overflow-x-auto px-4 pb-1">
                  {topPicks.map((r) => (
                    <div key={r.id} className="w-64 shrink-0">
                      <RestaurantCard restaurant={r} coupons={coupons ?? []} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {config.recommendedItemsEnabled && (loadingRecommended || (recommendedItems && recommendedItems.length > 0)) && (
              <>
                <SectionHeader title="Recommended for you" />
                <section className="mb-6">
                  {loadingRecommended ? (
                    <div className={classNames('grid gap-3.5', columnLayoutClass(config.recommendedItemsLayout))}>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-[4/5] w-full rounded-2xl" />
                      ))}
                    </div>
                  ) : (
                    <div className={classNames('grid gap-3.5', columnLayoutClass(config.recommendedItemsLayout))}>
                      {recommendedGrid.map((item, i) => (
                        <RecommendedItemCard key={`${item.id}-${i}`} item={item} />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

            <SectionHeader title="All restaurants" />
            <section>
              <div className={classNames('grid gap-4', columnLayoutClass(config.restaurantListLayout))}>
                {restaurantGrid.map((r, i) => (
                  <RestaurantCard key={`${r.id}-${i}`} restaurant={r} coupons={coupons ?? []} />
                ))}
              </div>
            </section>
          </>
        )}

        {/* CartFloatingBar and OngoingOrderBar are `fixed` — they float over content rather than
            pushing it up, and can stack up to ~13rem tall together (cart bar + an active order).
            Reserves enough bottom space that the last grid row never renders underneath them. */}
        <div className="h-16 md:hidden" aria-hidden="true" />
      </div>
      <OngoingOrderBar />
    </div>
  )
}

function SectionHeader({ title, seeAllTo }: { title: string; seeAllTo?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h2>
      {seeAllTo && (
        <Link to={seeAllTo} className="flex items-center gap-0.5 text-xs font-semibold text-brand-600">
          See all <ChevronRight size={14} />
        </Link>
      )}
    </div>
  )
}
