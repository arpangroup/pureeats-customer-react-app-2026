import { useMemo } from 'react'
import { iconByName } from '@/lib/iconRegistry'
import { classNames } from '@/lib/format'
import type { DeliveryInstructionOption } from '@/types/entities'

/**
 * Quick-pick delivery instructions (Cart page "Instructions" tab) — replaces free-text typing with
 * tappable icon chips, config-driven (`config.deliveryInstructionOptions`, already carrying a
 * client-side fallback list via AppConfigContext). Multi-selectable; the selected labels join into
 * the same `cart.deliveryInstructions` string the backend's `orderComment` field already expects, so
 * no wire-format change was needed to add this.
 */
export function InstructionChips({
  options,
  value,
  onChange,
}: {
  options: DeliveryInstructionOption[]
  value: string
  onChange: (next: string) => void
}) {
  const selectedLabels = useMemo(() => new Set(value ? value.split(', ') : []), [value])

  function toggle(option: DeliveryInstructionOption) {
    const next = new Set(selectedLabels)
    if (next.has(option.label)) {
      next.delete(option.label)
    } else {
      next.add(option.label)
    }
    onChange(options.filter((o) => next.has(o.label)).map((o) => o.label).join(', '))
  }

  return (
    <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
      {options.map((option) => {
        const Icon = iconByName(option.icon)
        const selected = selectedLabels.has(option.label)
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => toggle(option)}
            className={classNames(
              'flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center text-xs font-medium transition-colors',
              selected
                ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300',
            )}
            aria-pressed={selected}
          >
            <Icon size={20} className={selected ? 'text-brand-600' : 'text-slate-400'} />
            <span className="leading-tight">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
