import { Briefcase, Home, MapPin } from 'lucide-react'

function TagIcon({ tag }: { tag: string }) {
  const t = tag.trim().toLowerCase()
  if (t === 'home') return <Home size={11} />
  if (t === 'work' || t === 'office') return <Briefcase size={11} />
  return <MapPin size={11} />
}

/**
 * A delivery address the way the customer saved it: the "Save as" badge (Home / Work / ...), the full address
 * (house + street) and the landmark. Used on the cart, checkout and order tracking screens.
 */
export function AddressSummary({
  tag,
  house,
  address,
  landmark,
  title,
  compact,
}: {
  tag?: string | null
  /** Omit when `address` already starts with it (an order's address is stored as "house, address"). */
  house?: string | null
  address: string
  landmark?: string | null
  /** Small heading above the badge, e.g. "Delivering to". */
  title?: string
  /** Single-line address (the cart's tappable row). */
  compact?: boolean
}) {
  const full = house && house.trim() ? `${house.trim()}, ${address}` : address
  return (
    <div className="min-w-0">
      {(title || tag) && (
        <div className="flex flex-wrap items-center gap-2">
          {title && <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>}
          {tag && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <TagIcon tag={tag} />
              {tag}
            </span>
          )}
        </div>
      )}
      <p className={compact ? 'mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400' : 'mt-1 text-sm text-slate-500 dark:text-slate-400'}>{full}</p>
      {landmark && <p className="mt-0.5 truncate text-xs text-slate-400">Landmark: {landmark}</p>}
    </div>
  )
}
