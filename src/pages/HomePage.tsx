import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, MapPin, Search, Tag } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { restaurantService } from '@/services/restaurantService'
import { couponService } from '@/services/couponService'
import { useActiveLocation } from '@/hooks/useLocation'
import { RestaurantCard } from '@/components/restaurants/RestaurantCard'
import { OngoingOrderBar } from '@/components/orders/OngoingOrderBar'
import { Skeleton } from '@/components/ui/Feedback'

export default function HomePage() {
  const navigate = useNavigate()
  const { activeAddress } = useActiveLocation()
  const { data: restaurants, isLoading } = useAsync(() => restaurantService.list(), [])
  const { data: categories } = useAsync(() => restaurantService.categories(), [])
  const { data: coupons } = useAsync(() => couponService.listGlobal(), [])

  const featured = restaurants?.filter((r) => r.isFeatured) ?? []

  return (
    <div>
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3 pt-safe dark:border-slate-800 dark:bg-slate-900 md:hidden">
        <button onClick={() => navigate('/profile/addresses')} className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <MapPin size={16} className="text-brand-600" />
          {activeAddress ? activeAddress.tag ?? 'Delivering to' : 'Set your location'}
          <ChevronDown size={14} className="text-slate-400" />
        </button>
        <button onClick={() => navigate('/search')} className="input mt-2.5 flex items-center gap-2 text-left text-sm text-slate-400">
          <Search size={16} /> Search for restaurants and dishes
        </button>
      </div>

      <div className="px-4 py-4 md:px-0">
        {categories && categories.length > 0 && (
          <section className="mb-6">
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {categories.map((c) => (
                <Link key={c.id} to={`/category/${c.id}`} className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center">
                  <span className="h-14 w-14 overflow-hidden rounded-full border border-slate-200 dark:border-slate-800">
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                  </span>
                  <span className="text-[11px] font-medium leading-tight text-slate-600 dark:text-slate-300">{c.name}</span>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <Skeleton className="aspect-[16/10] w-full rounded-none" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <section className="mb-6">
                <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">Popular near you</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">All restaurants</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(restaurants ?? []).map((r) => (
                  <RestaurantCard key={r.id} restaurant={r} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
      <OngoingOrderBar />
    </div>
  )
}
