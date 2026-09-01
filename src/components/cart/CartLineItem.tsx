import { AlertCircle, Trash2 } from 'lucide-react'
import { VegBadge } from '@/components/ui/VegBadge'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { formatCurrency, classNames } from '@/lib/format'
import type { CartLine } from '@/types/entities'

export function CartLineItem({
  line,
  unavailableReason,
  onQuantityChange,
  onRemove,
}: {
  line: CartLine
  /** Set once the backend flags this item as no longer orderable — replaces the quantity stepper with a removal prompt instead. */
  unavailableReason?: string | null
  onQuantityChange: (next: number) => void
  onRemove: () => void
}) {
  const unitPrice = line.price + line.addons.reduce((sum, a) => sum + a.addonPrice, 0)
  const isUnavailable = !!unavailableReason

  return (
    <div className={classNames('flex items-start gap-3 py-3.5', isUnavailable && 'opacity-50')}>
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
        <img src={line.image} alt={line.name} className={classNames('h-full w-full object-cover', isUnavailable && 'grayscale')} />
      </div>
      <div className="min-w-0 flex-1">
        <VegBadge isVeg={line.isVeg} size={12} />
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{line.name}</p>
        {line.addons.length > 0 && <p className="truncate text-xs text-slate-400">{line.addons.map((a) => a.addonName).join(', ')}</p>}
        {isUnavailable ? (
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-rose-500">
            <AlertCircle size={12} /> {unavailableReason}
          </p>
        ) : (
          <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{formatCurrency(unitPrice)}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        {isUnavailable ? (
          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-500 dark:bg-rose-500/10">Unavailable</span>
        ) : (
          <QuantityStepper quantity={line.quantity} onChange={onQuantityChange} size="sm" />
        )}
        <button onClick={onRemove} className="text-slate-400 hover:text-rose-500" aria-label="Remove item">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
