import { Flame, Plus, Sparkles, Star } from 'lucide-react'
import type { MenuItem } from '@/types/entities'
import { VegBadge } from '@/components/ui/VegBadge'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { formatCurrency } from '@/lib/format'

export function MenuItemCard({
  item,
  quantityInCart,
  onAdd,
  onQuantityChange,
}: {
  item: MenuItem
  quantityInCart: number
  onAdd: () => void
  onQuantityChange?: (next: number) => void
}) {
  const hasAddons = item.addonCategoryIds.length > 0

  return (
    <div className="flex gap-3 border-b border-slate-100 py-4 last:border-0 dark:border-slate-800">
      <div className="min-w-0 flex-1">
        <VegBadge isVeg={item.isVeg} />
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {item.isRecommended && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-600">
              <Star size={10} className="fill-brand-600" /> Recommended
            </span>
          )}
          {item.isPopular && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">
              <Flame size={10} /> Popular
            </span>
          )}
          {item.isNew && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-600">
              <Sparkles size={10} /> New
            </span>
          )}
        </div>
        <h3 className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">{item.name}</h3>
        <p className="mt-0.5 flex items-baseline gap-2 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(item.price)}</span>
          {item.oldPrice && <span className="text-xs text-slate-400 line-through">{formatCurrency(item.oldPrice)}</span>}
        </p>
        {item.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>}
      </div>

      <div className="flex w-28 shrink-0 flex-col items-center gap-2">
        <div className="h-24 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        </div>
        {hasAddons || !onQuantityChange || quantityInCart === 0 ? (
          <button
            onClick={onAdd}
            className="relative -mt-5 flex items-center gap-1 rounded-lg border border-brand-600 bg-white px-3 py-1.5 text-sm font-bold text-brand-600 shadow-sm hover:bg-brand-50 dark:bg-slate-900 dark:hover:bg-brand-500/10"
          >
            {quantityInCart > 0 ? `Add (${quantityInCart})` : (
              <>
                <Plus size={14} /> ADD
              </>
            )}
          </button>
        ) : (
          <div className="-mt-5">
            <QuantityStepper quantity={quantityInCart} onChange={onQuantityChange} />
          </div>
        )}
      </div>
    </div>
  )
}
