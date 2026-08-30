import { Link } from 'react-router-dom'
import { Clock, Heart, Star } from 'lucide-react'
import type { Restaurant } from '@/types/entities'
import { useFavorites } from '@/hooks/useFavorites'
import { classNames } from '@/lib/format'

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorite = isFavorite(restaurant.id)

  return (
    <Link to={`/restaurants/${restaurant.id}`} className="card group block overflow-hidden">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img src={restaurant.image} alt={restaurant.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <button
          onClick={(e) => {
            e.preventDefault()
            toggleFavorite(restaurant.id)
          }}
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm backdrop-blur hover:text-rose-500 dark:bg-slate-900/90"
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart size={16} className={favorite ? 'fill-rose-500 text-rose-500' : ''} />
        </button>
        {restaurant.isPureveg && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 backdrop-blur dark:bg-slate-900/90">
            Pure Veg
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-slate-800 dark:text-slate-100">{restaurant.name}</h3>
          <span
            className={classNames(
              'flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold text-white',
              restaurant.rating >= 4 ? 'bg-emerald-600' : restaurant.rating >= 3 ? 'bg-amber-500' : 'bg-rose-500',
            )}
          >
            {restaurant.rating.toFixed(1)} <Star size={10} className="fill-white" />
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{restaurant.description}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {restaurant.deliveryTimeMinutes} mins
          </span>
          <span>{'₹'.repeat(restaurant.priceRange)} for two</span>
        </div>
      </div>
    </Link>
  )
}
