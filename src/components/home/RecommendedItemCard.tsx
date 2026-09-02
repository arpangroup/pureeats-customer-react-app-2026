import { Link } from 'react-router-dom'
import { VegBadge } from '@/components/ui/VegBadge'
import { formatCurrency } from '@/lib/format'
import type { RecommendedItem } from '@/services/menuService'

/** A cross-restaurant dish card for the Home page's "Recommended" section — tapping goes to that dish's restaurant (adding straight to a cart cross-restaurant isn't supported, mirrors SearchPage's popular-dishes card). */
export function RecommendedItemCard({ item }: { item: RecommendedItem }) {
  return (
    <Link to={`/restaurants/${item.restaurantId}`} className="group block overflow-hidden rounded-2xl bg-white dark:bg-slate-950">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
        <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <span className="absolute left-2.5 top-2.5 rounded-md bg-white/90 p-1 backdrop-blur dark:bg-slate-900/90">
          <VegBadge isVeg={item.isVeg} size={12} />
        </span>
      </div>
      <div className="pt-2.5">
        <h3 className="truncate text-[15px] font-semibold text-slate-800 dark:text-slate-100">{item.name}</h3>
        <p className="truncate text-xs text-slate-400">{item.restaurantName}</p>
        <p className="mt-1 flex items-baseline gap-1.5 text-sm">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(item.price)}</span>
          {item.oldPrice && <span className="text-xs text-slate-400 line-through">{formatCurrency(item.oldPrice)}</span>}
        </p>
      </div>
    </Link>
  )
}
