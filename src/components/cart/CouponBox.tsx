import { useState } from 'react'
import { Tag, X } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { AppliedCoupon } from '@/lib/pricing'

export function CouponBox({
  applied,
  onApply,
  onRemove,
}: {
  applied: AppliedCoupon | null
  onApply: (code: string) => Promise<void>
  onRemove: () => void
}) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)

  async function handleApply() {
    if (!code.trim()) return
    setApplying(true)
    setError(null)
    try {
      await onApply(code.trim())
      setCode('')
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not apply this coupon')
    } finally {
      setApplying(false)
    }
  }

  if (applied) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <Tag size={18} className="shrink-0 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-emerald-700 dark:text-emerald-400">{applied.code} applied</p>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70">{applied.waivesDelivery ? 'Free delivery' : `You saved ${formatCurrency(applied.discountAmount)}`}</p>
        </div>
        <button onClick={onRemove} className="rounded-full p-1 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-500/20" aria-label="Remove coupon">
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder="Enter coupon code"
          className="input flex-1"
        />
        <button className="btn-secondary" onClick={handleApply} disabled={applying || !code.trim()}>
          {applying ? 'Applying…' : 'Apply'}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-500">{error}</p>}
    </div>
  )
}
