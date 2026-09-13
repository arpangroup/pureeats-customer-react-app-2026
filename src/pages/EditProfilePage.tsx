import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Check, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Field, TextInput } from '@/components/ui/FormControls'
import { useAuth } from '@/hooks/useAuth'
import { userService } from '@/services/userService'
import { initials } from '@/lib/format'
import { IS_MOCK } from '@/config/env'
import type { Gender } from '@/types/entities'

type ContactField = 'phone' | 'email'

/** Inline "change phone/email" flow — request an OTP to the new destination, then verify it before
 * the change takes effect, reusing the same OTP-challenge mechanism login/signup already use (fixed
 * "123456" code today, per the backend's OtpChallengeService). */
function ContactChangeCard({
  field,
  userId,
  currentValue,
  onChanged,
}: {
  field: ContactField
  userId: number
  currentValue: string
  onChanged: (value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [step, setStep] = useState<'input' | 'otp'>('input')
  const [value, setValue] = useState(currentValue)
  const [otp, setOtp] = useState('')
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [maskedDestination, setMaskedDestination] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setEditing(false)
    setStep('input')
    setValue(currentValue)
    setOtp('')
    setChallengeId(null)
    setError(null)
  }

  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const result = field === 'phone' ? await userService.requestPhoneChange(userId, value) : await userService.requestEmailChange(userId, value)
      setChallengeId(result.challengeId)
      setMaskedDestination(result.maskedDestination)
      setStep('otp')
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not send OTP.')
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    if (!challengeId) return
    setBusy(true)
    setError(null)
    try {
      const updated = field === 'phone' ? await userService.confirmPhoneChange(challengeId, otp) : await userService.confirmEmailChange(challengeId, otp)
      onChanged(field === 'phone' ? updated.phone : updated.email)
      reset()
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Invalid or expired OTP.')
    } finally {
      setBusy(false)
    }
  }

  const label = field === 'phone' ? 'Mobile number' : 'Email address'

  if (!editing) {
    return (
      <div className="flex items-center justify-between py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{currentValue || '—'}</p>
        </div>
        <button type="button" className="shrink-0 text-xs font-semibold text-brand-600" onClick={() => setEditing(true)}>
          Change
        </button>
      </div>
    )
  }

  return (
    <div className="py-3">
      <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      {step === 'input' ? (
        <form onSubmit={handleRequestOtp} className="space-y-2">
          <TextInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type={field === 'email' ? 'email' : 'tel'}
            placeholder={field === 'phone' ? '9876543210' : 'you@example.com'}
            autoFocus
            required
          />
          {error && <p className="text-xs text-rose-500">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1" disabled={busy || value === currentValue}>
              {busy ? 'Sending OTP…' : 'Send OTP'}
            </button>
            <button type="button" className="btn-secondary" onClick={reset}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter the code sent to <span className="font-medium">{maskedDestination}</span>
          </p>
          <TextInput
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            inputMode="numeric"
            maxLength={6}
            className="text-center text-lg tracking-[0.4em]"
            autoFocus
            required
          />
          {error && <p className="text-xs text-rose-500">{error}</p>}
          {IS_MOCK && <p className="text-xs text-amber-600 dark:text-amber-400">Mock mode: use 123456.</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1" disabled={busy || otp.length !== 6}>
              {busy ? 'Verifying…' : 'Verify & save'}
            </button>
            <button type="button" className="btn-secondary" onClick={reset}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(user?.name ?? '')
  const [dob, setDob] = useState(user?.dob ?? '')
  const [gender, setGender] = useState<Gender | ''>(user?.gender ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [photo, setPhoto] = useState(user?.photo ?? null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) {
    navigate('/profile', { replace: true })
    return null
  }

  async function handlePhotoSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    setError(null)
    try {
      const updated = await userService.uploadPhoto(file)
      setPhoto(updated.photo)
      await refreshUser()
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not upload photo.')
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await userService.updateProfile({ name: name.trim(), dob: dob || null, gender: gender || null })
      await refreshUser()
      setSaved(true)
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not save your changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Edit profile" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="relative">
            <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xl font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
              {photo ? <img src={photo} alt={name} className="h-full w-full object-cover" /> : initials(name || user.name)}
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm"
              aria-label="Change photo"
            >
              {uploadingPhoto ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelected} />
          </div>
        </div>

        <form onSubmit={handleSave} className="card mt-2 space-y-4 p-4">
          <Field label="Name" required>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Date of birth">
            <TextInput type="date" value={dob ?? ''} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field label="Gender">
            <select className="input" value={gender} onChange={(e) => setGender(e.target.value as Gender | '')}>
              <option value="">Prefer not to say</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>}

          <button type="submit" className="btn-primary flex w-full items-center justify-center gap-2" disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : saved ? (
              <>
                <Check size={16} /> Saved
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </form>

        <div className="card mt-4 divide-y divide-slate-100 px-4 dark:divide-slate-800">
          <ContactChangeCard field="phone" userId={user.id} currentValue={phone} onChanged={setPhone} />
          <ContactChangeCard field="email" userId={user.id} currentValue={email} onChanged={setEmail} />
        </div>
      </div>
    </div>
  )
}
