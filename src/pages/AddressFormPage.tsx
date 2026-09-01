import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { LocateFixed } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Field, TextInput } from '@/components/ui/FormControls'
import { LoadingBlock } from '@/components/ui/Feedback'
import { AddressMapPicker } from '@/components/maps/AddressMapPicker'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { useActiveLocation } from '@/hooks/useLocation'
import { addressService, type AddressInput } from '@/services/addressService'
import { getCurrentPosition } from '@/lib/geolocation'
import { DEFAULT_MAP_CENTER } from '@/lib/googleMaps'

const TAGS = ['Home', 'Work', 'Other']

export default function AddressFormPage() {
  const { id } = useParams()
  const addressId = id ? Number(id) : null
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = (location.state as { from?: string } | null)?.from
  const { setActiveAddress } = useActiveLocation()
  const { data: existingList, isLoading } = useAsync(() => (user && addressId ? addressService.list(user.id) : Promise.resolve(null)), [user?.id, addressId])
  const existing = existingList?.find((a) => a.id === addressId)

  const [house, setHouse] = useState('')
  const [address, setAddress] = useState('')
  const [landmark, setLandmark] = useState('')
  const [tag, setTag] = useState('Home')
  const [makeDefault, setMakeDefault] = useState(false)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (existing) {
      setHouse(existing.house)
      setAddress(existing.address)
      setLandmark(existing.landmark ?? '')
      setTag(existing.tag ?? 'Home')
      setMakeDefault(existing.isDefault)
      setCoords({ latitude: existing.latitude, longitude: existing.longitude })
    }
  }, [existing])

  async function handleUseCurrentLocation() {
    setLocating(true)
    setError(null)
    try {
      const position = await getCurrentPosition()
      setCoords(position)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLocating(false)
    }
  }

  function handleMapChange(next: { latitude: number; longitude: number }, formattedAddress?: string) {
    setCoords(next)
    if (formattedAddress) setAddress(formattedAddress)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      const payload: AddressInput = {
        house,
        address,
        landmark: landmark.trim() || null,
        tag,
        latitude: coords?.latitude ?? 12.9716,
        longitude: coords?.longitude ?? 77.5946,
        makeDefault,
      }
      const saved = addressId ? await addressService.update(user.id, addressId, payload) : await addressService.create(user.id, payload)
      setActiveAddress(saved)
      navigate(returnTo ?? '/profile/addresses', { replace: true })
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not save this address')
    } finally {
      setSaving(false)
    }
  }

  if (addressId && isLoading) return <LoadingBlock />

  return (
    <div>
      <PageHeader title={addressId ? 'Edit address' : 'Add address'} />
      <div className="mx-auto max-w-lg px-4 py-4">
        <RequireAuth title="Sign in to add an address" description="Saving an address — and picking it on the map — needs an account.">
          <button type="button" onClick={handleUseCurrentLocation} disabled={locating} className="btn-secondary mb-4 w-full">
            <LocateFixed size={16} /> {locating ? 'Locating…' : 'Use my current location'}
          </button>

          <div className="mb-4">
            <AddressMapPicker
              latitude={coords?.latitude ?? DEFAULT_MAP_CENTER.lat}
              longitude={coords?.longitude ?? DEFAULT_MAP_CENTER.lng}
              onChange={handleMapChange}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Flat / House / Building" required>
              <TextInput value={house} onChange={(e) => setHouse(e.target.value)} placeholder="e.g. 221B, Brigade Towers" required />
            </Field>
            <Field label="Area / Street" required>
              <TextInput value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 5th Block, Koramangala" required />
            </Field>
            <Field label="Landmark (optional)">
              <TextInput value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="e.g. Near Forum Mall" />
            </Field>

            <Field label="Save as">
              <div className="flex gap-2">
                {TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-semibold ${tag === t ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>

            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
              Set as default address
            </label>

            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>}

            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? 'Saving…' : 'Save address'}
            </button>
          </form>
        </RequireAuth>
      </div>
    </div>
  )
}
