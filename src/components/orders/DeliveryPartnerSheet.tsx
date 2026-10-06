import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { BadgeCheck, Bike, CalendarDays, MessageSquareQuote, Phone, Route, Star, ThumbsUp, X } from 'lucide-react'
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

function memberSinceLabel(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

function tenureLabel(iso: string | null): string | null {
  if (!iso) return null
  const months = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / (30.44 * 86_400_000)))
  if (months < 1) return 'New partner'
  if (months < 12) return `${months} mo with PureEats`
  const years = Math.floor(months / 12)
  return `${years}+ yr${years > 1 ? 's' : ''} with PureEats`
}

function compact(n: number): string {
  return n >= 10_000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k` : n.toLocaleString('en-IN')
}

function daysAgo(iso: string | null): string {
  if (!iso) return ''
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  return days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : days < 30 ? `${days} days ago` : new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function Avatar({ name, photo, className }: { name: string; photo: string | null; className: string }) {
  const [failed, setFailed] = useState(false)
  if (photo && !failed) {
    return <img src={photo} alt={name} onError={() => setFailed(true)} className={classNames('object-cover', className)} />
  }
  return (
    <span className={classNames('flex items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 font-bold text-white', className)}>
      {initials(name) || <Bike size={28} />}
    </span>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={11} className={n <= value ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700'} />
      ))}
    </span>
  )
}

function StatTile({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 px-2 py-3">
      <span className="text-brand-500">{icon}</span>
      <span className="text-base font-bold leading-tight text-slate-800 dark:text-slate-100">{value}</span>
      <span className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  )
}

/**
 * Delivery partner profile, opened by tapping the rider's photo/card on the tracking page. Shows the
 * basic details instantly from the order (name, photo, vehicle, phone) and fills in the reputation
 * section - rating + breakdown, completed trips, tenure, compliments, recent reviews - from
 * GET /orders/{id}/delivery-partner. Bottom sheet on mobile, centered card on wider screens.
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
  /** What the order already knows - rendered immediately while the full profile loads. */
  partner: OrderDeliveryPartner
}) {
  const [profile, setProfile] = useState<DeliveryPartnerProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setError(null)
    orderService
      .deliveryPartner(userId, orderId)
      .then((p) => !cancelled && setProfile(p))
      .catch((err) => !cancelled && setError((err as { message?: string })?.message ?? 'Could not load the delivery partner details.'))
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
  const phone = profile?.phone ?? partner.phone
  const maxBucket = Math.max(1, ...(profile?.ratingBreakdown.map((b) => b.count) ?? [1]))

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-sheet animate-slide-up dark:bg-slate-900 sm:max-w-md sm:rounded-3xl sm:animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Delivery partner ${name}`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Hero */}
          <div className="relative h-28 shrink-0 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800">
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:14px_14px]" />
            <div className="absolute left-1/2 top-2.5 h-1.5 w-10 -translate-x-1/2 rounded-full bg-white/50 sm:hidden" />
            <button onClick={onClose} className="absolute right-3 top-3 rounded-full bg-black/20 p-1.5 text-white backdrop-blur hover:bg-black/30" aria-label="Close">
              <X size={18} />
            </button>
            <p className="absolute left-4 top-4 text-[11px] font-semibold uppercase tracking-widest text-white/80">Your delivery partner</p>
          </div>

          <div className="-mt-16 flex flex-col items-center px-5 text-center">
            <div className="relative">
              <Avatar name={name} photo={photo} className="h-32 w-32 rounded-full text-3xl ring-4 ring-white shadow-xl dark:ring-slate-900" />
              {(profile?.verified ?? true) && (
                <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow dark:bg-slate-900" title="Verified partner">
                  <BadgeCheck size={24} className="fill-sky-500 text-white" />
                </span>
              )}
            </div>
            <h2 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">{name}</h2>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {profile?.verified !== false && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                  <BadgeCheck size={12} /> Verified
                </span>
              )}
              {tenureLabel(profile?.memberSince ?? null) && <span>{tenureLabel(profile?.memberSince ?? null)}</span>}
            </div>
            {vehicle && (
              <span className="mt-3 inline-flex items-center gap-2 rounded-md border-2 border-slate-800 bg-amber-300 px-2.5 py-0.5 font-mono text-sm font-bold tracking-widest text-slate-900 shadow-sm dark:border-slate-200">
                <Bike size={14} /> {vehicle.toUpperCase()}
              </span>
            )}
          </div>

          {/* Stats strip */}
          <div className="mx-5 mt-5 flex divide-x divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/60 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-800/40">
            <StatTile
              icon={<Star size={16} className="fill-amber-400 text-amber-400" />}
              value={profile ? (profile.rating != null ? profile.rating.toFixed(1) : 'New') : '—'}
              label={profile ? (profile.ratingCount ? `${compact(profile.ratingCount)} ratings` : 'No ratings yet') : 'Rating'}
            />
            <StatTile icon={<Route size={16} />} value={profile ? compact(profile.completedTrips) : '—'} label="Trips completed" />
            <StatTile icon={<CalendarDays size={16} />} value={memberSinceLabel(profile?.memberSince ?? null) ?? '—'} label="Partner since" />
          </div>

          {profile && profile.deliveriesForYou > 0 && (
            <p className="mx-5 mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <ThumbsUp size={13} /> Has delivered to you {profile.deliveriesForYou} time{profile.deliveriesForYou > 1 ? 's' : ''} before
            </p>
          )}

          {error && <p className="mx-5 mt-4 rounded-xl bg-rose-50 px-3 py-2 text-center text-xs text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}

          {!profile && !error && (
            <div className="mx-5 mt-5 space-y-3" aria-hidden="true">
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
              <div className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            </div>
          )}

          {profile && profile.ratingCount > 0 && (
            <section className="mx-5 mt-5">
              <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Customer ratings</h3>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{profile.rating?.toFixed(1)}</p>
                  <Stars value={Math.round(profile.rating ?? 0)} />
                  <p className="mt-0.5 text-[11px] text-slate-400">{compact(profile.ratingCount)} ratings</p>
                </div>
                <div className="flex-1 space-y-1">
                  {profile.ratingBreakdown.map((b) => (
                    <div key={b.stars} className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="w-3 text-right">{b.stars}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${(b.count / maxBucket) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right tabular-nums">{compact(b.count)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {profile && profile.topCompliments.length > 0 && (
            <section className="mx-5 mt-5">
              <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Customers love</h3>
              <div className="flex flex-wrap gap-2">
                {profile.topCompliments.map((c) => (
                  <span key={c.label} className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
                    {c.label}
                    <span className="rounded-full bg-white px-1.5 text-[10px] font-bold text-brand-600 dark:bg-slate-900 dark:text-brand-300">{compact(c.count)}</span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {profile && profile.recentReviews.length > 0 && (
            <section className="mx-5 mt-5">
              <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Recent reviews</h3>
              <ul className="space-y-2">
                {profile.recentReviews.map((r, i) => (
                  <li key={i} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <div className="flex items-center justify-between">
                      <Stars value={r.rating} />
                      <span className="text-[11px] text-slate-400">{daysAgo(r.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 flex gap-1.5 text-sm text-slate-700 dark:text-slate-200">
                      <MessageSquareQuote size={14} className="mt-0.5 shrink-0 text-slate-300" />
                      {r.comment}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-slate-400">— {r.reviewerName}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {profile && profile.totalDistanceKm > 0 && (
            <p className="mx-5 mt-4 text-center text-[11px] text-slate-400">
              {compact(Math.round(profile.totalDistanceKm))} km travelled delivering with PureEats
            </p>
          )}
          <div className="h-4" />
        </div>

        <div className="flex shrink-0 gap-2 border-t border-slate-100 px-5 py-3 pb-safe dark:border-slate-800">
          {phone ? (
            <a href={`tel:${phone}`} className="btn-primary flex flex-1 items-center justify-center gap-2">
              <Phone size={16} /> Call {name.split(' ')[0]}
            </a>
          ) : (
            <span className="flex-1" />
          )}
          <button onClick={onClose} className="btn-secondary flex-1">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
