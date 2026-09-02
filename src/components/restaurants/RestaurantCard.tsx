import { Link } from 'react-router-dom'
import { Heart, Star } from 'lucide-react'
import type { Coupon, Restaurant } from '@/types/entities'
import { useFavorites } from '@/hooks/useFavorites'
import { bestCouponBadge, DEFAULT_COUPON_BADGE } from '@/lib/couponBadge'
import { isRestaurantOrderable } from '@/lib/restaurantAvailability'
import { classNames } from '@/lib/format'

export function RestaurantCard({ restaurant, coupons = [] }: { restaurant: Restaurant; coupons?: Coupon[] }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorite = isFavorite(restaurant.id)
  const badge = bestCouponBadge(coupons, restaurant.id) ?? DEFAULT_COUPON_BADGE
  const area = restaurant.landmark || restaurant.address
  // Still fully browsable when closed (tapping through to see the menu/hours is normal) — just
  // visually dimmed everywhere this card renders (Home, Search, category listing, Top Picks,
  // Favorites) so it reads as "not orderable right now" at a glance.
  const orderable = isRestaurantOrderable(restaurant)

  return (
    <Link to={`/restaurants/${restaurant.id}`} className="group block overflow-hidden rounded-2xl bg-white dark:bg-slate-950">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className={classNames(
            'h-full w-full object-cover transition-transform duration-300 group-hover:scale-105',
            !orderable && 'grayscale',
          )}
        />

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

        {!orderable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35">
            <span className="rounded-lg bg-slate-900/85 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">Closed now</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-2.5 pt-10">
          <p className="text-base font-extrabold leading-tight text-white">{badge.headline}</p>
          {badge.subline && <p className="text-[11px] font-medium leading-tight text-white/80">{badge.subline}</p>}
        </div>
      </div>
      <div className={classNames('pt-2.5', !orderable && 'opacity-60')}>
        <h3 className="truncate text-[15px] font-semibold text-slate-800 dark:text-slate-100">{restaurant.name}</h3>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600">
            <Star size={9} className="fill-white text-white" />
          </span>
          <span>{restaurant.rating.toFixed(1)} &middot; {restaurant.deliveryTimeMinutes} mins</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{restaurant.description}</p>
        {area && <p className="truncate text-xs text-slate-400 dark:text-slate-500">{area}</p>}
      </div>
    </Link>
  )
}
