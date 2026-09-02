import { Minus, Plus } from 'lucide-react'

export function QuantityStepper({
  quantity,
  onChange,
  size = 'md',
  disabled,
}: {
  quantity: number
  onChange: (next: number) => void
  size?: 'sm' | 'md'
  disabled?: boolean
}) {
  const dims = size === 'sm' ? 'h-7 text-xs' : 'h-9 text-sm'
  return (
    <div
      className={`flex ${dims} items-center overflow-hidden rounded-lg border bg-white dark:bg-slate-900 ${disabled ? 'border-slate-300 dark:border-slate-700' : 'border-brand-600'}`}
    >
      <button
        onClick={() => onChange(Math.max(0, quantity - 1))}
        disabled={disabled}
        className="flex h-full w-7 items-center justify-center text-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white dark:hover:bg-brand-500/10 dark:disabled:hover:bg-slate-900"
        aria-label="Decrease quantity"
      >
        <Minus size={13} />
      </button>
      <span className={`flex h-full w-6 items-center justify-center font-bold ${disabled ? 'text-slate-400' : 'text-brand-600'}`}>{quantity}</span>
      <button
        onClick={() => onChange(quantity + 1)}
        disabled={disabled}
        className="flex h-full w-7 items-center justify-center text-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white dark:hover:bg-brand-500/10 dark:disabled:hover:bg-slate-900"
        aria-label="Increase quantity"
      >
        <Plus size={13} />
      </button>
    </div>
  )
}
