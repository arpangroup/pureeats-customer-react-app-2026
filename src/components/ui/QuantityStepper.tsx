import { Minus, Plus } from 'lucide-react'

export function QuantityStepper({ quantity, onChange, size = 'md' }: { quantity: number; onChange: (next: number) => void; size?: 'sm' | 'md' }) {
  const dims = size === 'sm' ? 'h-7 text-xs' : 'h-9 text-sm'
  return (
    <div className={`flex ${dims} items-center overflow-hidden rounded-lg border border-brand-600 bg-white dark:bg-slate-900`}>
      <button
        onClick={() => onChange(Math.max(0, quantity - 1))}
        className="flex h-full w-7 items-center justify-center text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10"
        aria-label="Decrease quantity"
      >
        <Minus size={13} />
      </button>
      <span className="flex h-full w-6 items-center justify-center font-bold text-brand-600">{quantity}</span>
      <button onClick={() => onChange(quantity + 1)} className="flex h-full w-7 items-center justify-center text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10" aria-label="Increase quantity">
        <Plus size={13} />
      </button>
    </div>
  )
}
