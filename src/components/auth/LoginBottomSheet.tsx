import { useNavigate } from 'react-router-dom'
import { Phone } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'

/**
 * The one moment browsing turns into "you need an account" — shown when a
 * guest tries to place an order. Everything before this (browsing, cart,
 * coupons) works without login; this is the single gate.
 */
export function LoginBottomSheet({ open, onClose, from }: { open: boolean; onClose: () => void; from: string }) {
  const navigate = useNavigate()

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex flex-col items-center px-2 py-2 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15">
          <Phone size={26} />
        </span>
        <h2 className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-100">Almost there!</h2>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Login or create your account quickly to place this order.</p>

        <button
          className="btn-primary mt-6 w-full"
          onClick={() => {
            onClose()
            navigate('/login', { state: { from, method: 'PHONE' } })
          }}
        >
          <Phone size={16} /> Proceed with phone number
        </button>
        <button className="btn-ghost mt-1.5 w-full" onClick={onClose}>
          Maybe later
        </button>
      </div>
    </Sheet>
  )
}
