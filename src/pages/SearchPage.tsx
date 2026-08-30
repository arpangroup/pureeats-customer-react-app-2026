import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Search, X } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { restaurantService } from '@/services/restaurantService'
import { RestaurantCard } from '@/components/restaurants/RestaurantCard'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { readStorage, writeStorage } from '@/lib/storage'

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
          recent.length > 0 ? (
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
          ) : (
            <EmptyState title="Find your next meal" description="Search by restaurant name, cuisine, or dish." icon={<Search size={22} />} />
          )
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
