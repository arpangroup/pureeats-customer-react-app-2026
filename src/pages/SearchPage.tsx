import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Search, X } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { restaurantService } from '@/services/restaurantService'
import { menuService } from '@/services/menuService'
import { RestaurantCard } from '@/components/restaurants/RestaurantCard'
import { VegBadge } from '@/components/ui/VegBadge'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { readStorage, writeStorage } from '@/lib/storage'
import { formatCurrency } from '@/lib/format'

const RECENT_SEARCHES_KEY = 'pureeats.recentSearches'

export default function SearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [recent, setRecent] = useState<string[]>(() => readStorage<string[]>(RECENT_SEARCHES_KEY, []))

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data: results, isLoading } = useAsync(() => restaurantService.search(debounced), [debounced])
  const { data: categories } = useAsync(() => (debounced ? Promise.resolve(null) : restaurantService.categories()), [debounced])
  const { data: popularDishes } = useAsync(() => (debounced ? Promise.resolve(null) : menuService.popularItems(8)), [debounced])

  function commitSearch(q: string) {
    if (!q.trim()) return
    const next = [q, ...recent.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 8)
    setRecent(next)
    writeStorage(RECENT_SEARCHES_KEY, next)
  }

  return (
    <div>
      <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3 pt-safe dark:border-slate-800 dark:bg-slate-900">
        <button onClick={() => navigate(-1)} className="rounded-full p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="input flex flex-1 items-center gap-2">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commitSearch(query)}
            placeholder="Search for restaurants and dishes"
            autoFocus
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear">
              <X size={15} className="text-slate-400" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        {!debounced ? (
          <div className="space-y-6">
            {recent.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent searches</p>
                <div className="flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <button
                      key={r}
                      onClick={() => setQuery(r)}
                      className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300"
                    >
                      <Clock size={12} /> {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {categories && categories.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Popular cuisines</p>
                <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                  {categories.map((c) => (
                    <button key={c.id} onClick={() => navigate(`/category/${c.id}`)} className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center">
                      <span className="h-14 w-14 overflow-hidden rounded-full border border-slate-200 dark:border-slate-800">
                        <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                      </span>
                      <span className="text-[11px] font-medium leading-tight text-slate-600 dark:text-slate-300">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {popularDishes && popularDishes.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Popular dishes near you</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {popularDishes.map((item) => (
                    <button key={item.id} onClick={() => navigate(`/restaurants/${item.restaurantId}`)} className="card overflow-hidden text-left">
                      <div className="aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="p-2.5">
                        <VegBadge isVeg={item.isVeg} size={11} />
                        <p className="mt-0.5 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{item.name}</p>
                        <p className="truncate text-[11px] text-slate-400">{item.restaurantName}</p>
                        <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">{formatCurrency(item.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recent.length === 0 && !categories && !popularDishes && (
              <EmptyState title="Find your next meal" description="Search by restaurant name, cuisine, or dish." icon={<Search size={22} />} />
            )}
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[16/10] w-full" />
            ))}
          </div>
        ) : results && results.length > 0 ? (
          <div onClick={() => commitSearch(debounced)} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        ) : (
          <EmptyState title={`No results for "${debounced}"`} description="Try a different restaurant name or cuisine." />
        )}
      </div>
    </div>
  )
}
