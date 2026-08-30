import { useNavigate } from 'react-router-dom'
import { Home, MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { useActiveLocation } from '@/hooks/useLocation'
import { addressService } from '@/services/addressService'
import { classNames } from '@/lib/format'
import type { Address } from '@/types/entities'

export default function AddressesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { activeAddress, setActiveAddress } = useActiveLocation()
  const { data: addresses, isLoading, reload } = useAsync(() => (user ? addressService.list(user.id) : Promise.resolve([])), [user?.id])

  async function handleDelete(address: Address) {
    if (!window.confirm(`Delete "${address.tag ?? address.house}"?`)) return
    await addressService.remove(address.id)
    reload()
  }

  async function handleSetDefault(address: Address) {
    if (!user) return
    await addressService.setDefault(user.id, address.id)
    reload()
  }

  return (
    <div>
      <PageHeader title="Your addresses" actions={<button onClick={() => navigate('/profile/addresses/new')} className="text-sm font-semibold text-brand-600">Add new</button>} />
      <div className="mx-auto max-w-lg px-4 py-4">
        <button onClick={() => navigate('/profile/addresses/new')} className="hidden w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-300 py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:border-brand-500/40 dark:hover:bg-brand-500/10 md:flex">
          <Plus size={16} /> Add new address
        </button>

        {isLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : !addresses || addresses.length === 0 ? (
          <EmptyState title="No saved addresses" description="Add one so you can check out faster." icon={<MapPin size={22} />} />
        ) : (
          <div className="mt-4 space-y-3">
            {addresses.map((address) => (
              <div key={address.id} className={classNames('card p-4', activeAddress?.id === address.id && 'border-brand-500 ring-1 ring-brand-500')}>
                <button onClick={() => setActiveAddress(address)} className="flex w-full items-start gap-3 text-left">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15">
                    <Home size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{address.tag ?? 'Address'}</p>
                      {address.isDefault && <Star size={12} className="fill-amber-400 text-amber-400" />}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {address.house}, {address.address}
                    </p>
                    {address.landmark && <p className="text-xs text-slate-400">Near {address.landmark}</p>}
                  </div>
                </button>
                <div className="mt-3 flex items-center gap-4 pl-12 text-xs font-semibold">
                  <button onClick={() => navigate(`/profile/addresses/${address.id}/edit`)} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:text-slate-400">
                    <Pencil size={12} /> Edit
                  </button>
                  {!address.isDefault && (
                    <button onClick={() => handleSetDefault(address)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400">
                      Set as default
                    </button>
                  )}
                  <button onClick={() => handleDelete(address)} className="flex items-center gap-1 text-rose-500 hover:text-rose-600">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
