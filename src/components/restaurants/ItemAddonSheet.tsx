import { useEffect, useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { LoadingBlock } from '@/components/ui/Feedback'
import { VegBadge } from '@/components/ui/VegBadge'
import { useAsync } from '@/hooks/useAsync'
import { menuService } from '@/services/menuService'
import { formatCurrency } from '@/lib/format'
import { classNames } from '@/lib/format'
import type { CartAddon, MenuItem } from '@/types/entities'

export function ItemAddonSheet({
  item,
  open,
  onClose,
  onConfirm,
  initialQuantity = 1,
}: {
  item: MenuItem | null
  open: boolean
  onClose: () => void
  onConfirm: (addons: CartAddon[], quantity: number) => void
  /** Seeds the stepper with what's already in the cart for this item (base, no-addon line) — otherwise reopening the sheet always looked like a fresh add. */
  initialQuantity?: number
}) {
  const { data: groups, isLoading } = useAsync(() => (item ? menuService.addonGroupsForItem(item.id) : Promise.resolve([])), [item?.id])
  const [selected, setSelected] = useState<Record<number, number[]>>({})
  const [quantity, setQuantity] = useState(initialQuantity)

  useEffect(() => {
    if (open) {
      setSelected({})
      setQuantity(initialQuantity)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id])

  if (!item) return null

  function toggle(categoryId: number, addonId: number, type: 'single' | 'multiple') {
    setSelected((prev) => {
      const current = prev[categoryId] ?? []
      if (type === 'single') return { ...prev, [categoryId]: [addonId] }
      const next = current.includes(addonId) ? current.filter((id) => id !== addonId) : [...current, addonId]
      return { ...prev, [categoryId]: next }
    })
  }

  const chosenAddons: CartAddon[] = (groups ?? []).flatMap(({ category, addons }) =>
    (selected[category.id] ?? []).map((addonId) => {
      const addon = addons.find((a) => a.id === addonId)!
      return { addonId: addon.id, addonCategoryName: category.name, addonName: addon.name, addonPrice: addon.price }
    }),
  )
  const addonsTotal = chosenAddons.reduce((sum, a) => sum + a.addonPrice, 0)
  const unitPrice = item.price + addonsTotal
  const requiredMissing = (groups ?? []).some((g) => g.category.isRequired && (selected[g.category.id]?.length ?? 0) === 0)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={item.name}
      footer={
        <div className="flex items-center gap-3">
          <QuantityStepper quantity={quantity} onChange={(n) => setQuantity(Math.max(1, n))} />
          <button
            className="btn-primary flex-1"
            disabled={requiredMissing}
            onClick={() => {
              onConfirm(chosenAddons, quantity)
              onClose()
            }}
          >
            Add item — {formatCurrency(unitPrice * quantity)}
          </button>
        </div>
      }
    >
      {isLoading ? (
        <LoadingBlock />
      ) : (
        <div className="space-y-5">
          <div className="-mx-5 -mt-4 aspect-video w-[calc(100%+2.5rem)] overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          </div>
          <div>
            <VegBadge isVeg={item.isVeg} />
            <p className="mt-1.5 flex items-baseline gap-2 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(item.price)}</span>
              {item.oldPrice && <span className="text-xs text-slate-400 line-through">{formatCurrency(item.oldPrice)}</span>}
            </p>
          </div>
          {item.description && <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>}
          {(groups ?? []).map(({ category, addons }) => (
            <div key={category.id}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{category.name}</h3>
                {category.isRequired && <span className="text-[11px] font-medium text-brand-600">Required</span>}
              </div>
              <div className="space-y-2">
                {addons.map((addon) => {
                  const isSelected = (selected[category.id] ?? []).includes(addon.id)
                  return (
                    <button
                      key={addon.id}
                      onClick={() => toggle(category.id, addon.id, category.type)}
                      className={classNames(
                        'flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors',
                        isSelected ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 dark:border-slate-700',
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={classNames(
                            'flex h-4 w-4 shrink-0 items-center justify-center border-2',
                            category.type === 'single' ? 'rounded-full' : 'rounded-[4px]',
                            isSelected ? 'border-brand-600 bg-brand-600' : 'border-slate-300 dark:border-slate-600',
                          )}
                        >
                          {isSelected && <span className={classNames('bg-white', category.type === 'single' ? 'h-1.5 w-1.5 rounded-full' : 'h-2 w-2 rounded-[1px]')} />}
                        </span>
                        {addon.name}
                      </span>
                      {addon.price > 0 && <span className="text-slate-500 dark:text-slate-400">+{formatCurrency(addon.price)}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  )
}
