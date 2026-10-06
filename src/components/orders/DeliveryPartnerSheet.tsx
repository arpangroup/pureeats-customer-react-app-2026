import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { BadgeCheck, Bike, Star, X } from 'lucide-react'
import { orderService } from '@/services/orderService'
import { classNames } from '@/lib/format'
import type { DeliveryPartnerProfile, OrderDeliveryPartner } from '@/types/entities'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}

function compact(n: number): string {
  return n >= 10_000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k` : n.toLocaleString('en-IN')
}

function Avatar({ name, photo, className }: { name: string; photo: string | null; className: string }) {
  const [failed, setFailed] = useState(false)
  if (photo && !failed) {
    return <img src={photo} alt={name} onError={() => setFailed(true)} className={classNames('object-cover', className)} />
  }
  return (
    <span className={classNames('flex items-center justify-center bg-brand-100 font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400', className)}>
      {initials(name) || <Bike size={28} />}
    </span>
  )
}

/**
 * Delivery partner sheet, opened by tapping the rider on the tracking page. Only the essentials:
 * photo with the verified badge, name, vehicle number, overall rating and trips completed. Photo,
 * name and vehicle come from the order and render instantly; rating and trips fill in from
 * GET /orders/{id}/delivery-partner. (Calling the rider stays on the tracking page's rider card.)
 */
export function DeliveryPartnerSheet({
  open,
  onClose,
  userId,
  orderId,
  partner,
}: {
  open: boolean
  onClose: () => void
  userId: number
  orderId: number
  /** What the order already knows - rendered immediately while the profile loads. */
  partner: OrderDeliveryPartner
}) {
  const [profile, setProfile] = useState<DeliveryPartnerProfile | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    orderService
      .deliveryPartner(userId, orderId)
      .then((p) => !cancelled && setProfile(p))
      // The essentials are already on screen from the order - a failed fetch just leaves out rating/trips.
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [open, userId, orderId])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const name = profile?.name ?? partner.name
  const photo = profile?.photo ?? partner.photo
  const vehicle = profile?.vehicleNumber ?? partner.vehicleNumber
  const verified = profile?.verified ?? true

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-[1px] sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="relative w-full overflow-hidden rounded-t-3xl bg-white px-6 pb-safe pt-3 shadow-sheet animate-slide-up dark:bg-slate-900 sm:max-w-sm sm:rounded-3xl sm:animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Delivery partner ${name}`}
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-700 sm:hidden" />
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800" aria-label="Close">
          <X size={18} />
        </button>

        <div className="flex flex-col items-center pb-6 pt-6 text-center">
          <div className="relative">
            <Avatar name={name} photo={photo} className="h-28 w-28 rounded-full text-3xl shadow-md" />
            {verified && (
              <span className="absolute bottom-0.5 right-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow dark:bg-slate-900" title="Verified">
                <BadgeCheck size={24} className="fill-sky-500 text-white" aria-label="Verified" />
              </span>
            )}
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{name}</h2>
          {verified && <p className="text-xs font-medium text-sky-600 dark:text-sky-400">Verified partner</p>}

          {vehicle && (
            <span className="mt-3 rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {vehicle.toUpperCase()}
            </span>
          )}

          <div className="mt-5 grid w-full grid-cols-2 divide-x divide-slate-100 rounded-2xl bg-slate-50 py-3 dark:divide-slate-800 dark:bg-slate-800/50">
            <div>
              <p className="flex items-center justify-center gap-1 text-lg font-bold text-slate-900 dark:text-white">
                <Star size={16} className="fill-amber-400 text-amber-400" />
                {profile ? (profile.rating != null ? profile.rating.toFixed(1) : 'New') : '—'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Rating</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{profile ? compact(profile.completedTrips) : '—'}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Trips completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
