import { Star } from 'lucide-react'

export function StarRating({ value, onChange, size = 32 }: { value: number; onChange?: (next: number) => void; size?: number }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star size={size} className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'} />
        </button>
      ))}
    </div>
  )
}
