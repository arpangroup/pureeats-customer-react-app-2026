import { Trash2 } from 'lucide-react'
import { VegBadge } from '@/components/ui/VegBadge'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { formatCurrency } from '@/lib/format'
import type { CartLine } from '@/types/entities'

export function CartLineItem({ line, onQuantityChange, onRemove }: { line: CartLine; onQuantityChange: (next: number) => void; onRemove: () => void }) {
  const unitPrice = line.price + line.addons.reduce((sum, a) => sum + a.addonPrice, 0)

  return (
    <div className="flex items-start gap-3 py-3.5">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
        <img src={line.image} alt={line.name} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <VegBadge isVeg={line.isVeg} size={12} />
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{line.name}</p>
        {line.addons.length > 0 && <p className="truncate text-xs text-slate-400">{line.addons.map((a) => a.addonName).join(', ')}</p>}
        <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{formatCurrency(unitPrice)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <QuantityStepper quantity={line.quantity} onChange={onQuantityChange} size="sm" />
        <button onClick={onRemove} className="text-slate-400 hover:text-rose-500" aria-label="Remove item">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
