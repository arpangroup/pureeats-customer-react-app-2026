import { Flame, Plus, Sparkles, Star } from 'lucide-react'
import type { MenuItem } from '@/types/entities'
import { VegBadge } from '@/components/ui/VegBadge'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { formatCurrency, classNames } from '@/lib/format'

export function MenuItemCard({
  item,
  quantityInCart,
  onAdd,
  onQuantityChange,
  onView,
  compact,
  disabled,
}: {
  item: MenuItem
  quantityInCart: number
  onAdd: () => void
  onQuantityChange?: (next: number) => void
  onView: () => void
  /** Vertical card (image on top) for a 2-column menu grid — driven by config.restaurantItemsLayout, falls back to the classic full-width row otherwise. */
  compact?: boolean
  /** Restaurant is currently closed/inactive — item still browsable (onView still works) but grayed out with Add/quantity controls disabled, since it can't actually be ordered right now. */
  disabled?: boolean
}) {
  const hasAddons = item.addonCategoryIds.length > 0
  const addLabel = quantityInCart > 0 ? `Add (${quantityInCart})` : (
    <>
      <Plus size={14} /> ADD
    </>
  )
  // Closed restaurant: there's no separate "view details" screen for an item (onView opens the
  // add/customize sheet), so the whole card goes non-interactive rather than just the Add button —
  // otherwise tapping through would still land on a sheet with a live "Add item" confirm button.
  const handleView = disabled ? undefined : onView

  if (compact) {
    return (
      <div className={classNames('card overflow-hidden', disabled && 'opacity-60')}>
        <button onClick={handleView} disabled={disabled} className="block aspect-square w-full overflow-hidden bg-slate-100 disabled:cursor-not-allowed dark:bg-slate-800" aria-label={`View ${item.name}`}>
          <img src={item.image} alt={item.name} className={classNames('h-full w-full object-cover', disabled && 'grayscale')} />
        </button>
        <div className="p-2.5">
          <button onClick={handleView} disabled={disabled} className="block w-full text-left disabled:cursor-not-allowed">
            <VegBadge isVeg={item.isVeg} size={12} />
            <h3 className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{item.name}</h3>
            <p className="mt-0.5 flex items-baseline gap-1.5 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(item.price)}</span>
              {item.oldPrice && <span className="text-xs text-slate-400 line-through">{formatCurrency(item.oldPrice)}</span>}
            </p>
          </button>
          <div className="mt-2">
            {hasAddons || !onQuantityChange || quantityInCart === 0 ? (
              <button
                onClick={onAdd}
                disabled={disabled}
                className="flex w-full items-center justify-center gap-1 rounded-lg border border-brand-600 bg-white py-1.5 text-sm font-bold text-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-white dark:bg-slate-900 dark:hover:bg-brand-500/10 dark:disabled:hover:bg-slate-900"
              >
                {addLabel}
              </button>
            ) : (
              <div className="flex justify-center">
                <QuantityStepper quantity={quantityInCart} onChange={onQuantityChange} disabled={disabled} />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={classNames('flex gap-3 border-b border-slate-100 py-4 last:border-0 dark:border-slate-800', disabled && 'opacity-60')}>
      <button onClick={handleView} disabled={disabled} className="min-w-0 flex-1 text-left disabled:cursor-not-allowed">
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
        {disabled && <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-rose-500">Restaurant closed</p>}
      </button>

      <div className="flex w-28 shrink-0 flex-col items-center gap-2">
        <button onClick={handleView} disabled={disabled} className="h-24 w-full overflow-hidden rounded-xl bg-slate-100 disabled:cursor-not-allowed dark:bg-slate-800" aria-label={`View ${item.name}`}>
          <img src={item.image} alt={item.name} className={classNames('h-full w-full object-cover', disabled && 'grayscale')} />
        </button>
        {hasAddons || !onQuantityChange || quantityInCart === 0 ? (
          <button
            onClick={onAdd}
            disabled={disabled}
            className="relative -mt-5 flex items-center gap-1 rounded-lg border border-brand-600 bg-white px-3 py-1.5 text-sm font-bold text-brand-600 shadow-sm hover:bg-brand-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-white dark:bg-slate-900 dark:hover:bg-brand-500/10 dark:disabled:hover:bg-slate-900"
          >
            {addLabel}
          </button>
        ) : (
          <div className="-mt-5">
            <QuantityStepper quantity={quantityInCart} onChange={onQuantityChange} disabled={disabled} />
          </div>
        )}
      </div>
    </div>
  )
}
