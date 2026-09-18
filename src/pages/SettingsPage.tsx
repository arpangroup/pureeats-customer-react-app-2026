import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Moon, ShieldCheck, Sun, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { userService } from '@/services/userService'

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const { canInstall, promptInstall } = useInstallPrompt()
  const navigate = useNavigate()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  async function handleDeleteAccount() {
    if (!user) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await userService.deleteAccount(user.id)
      // The account can never log in again after this - clear the local session immediately
      // rather than waiting on the access token to naturally expire.
      await logout()
      navigate('/login', { state: { accountDeleted: true } })
    } catch (err) {
      setDeleteError((err as { message?: string })?.message ?? 'Could not delete your account. Please try again.')
      setConfirmingDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Settings" />
      <div className="mx-auto max-w-lg px-4 py-4 md:py-8">
        <div className="card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
          {canInstall && (
            <button onClick={promptInstall} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60">
              <Download size={18} className="text-brand-600" />
              <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">Install PureEats app</span>
            </button>
          )}
          <button onClick={toggleTheme} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60">
            {theme === 'dark' ? <Sun size={18} className="text-slate-500 dark:text-slate-400" /> : <Moon size={18} className="text-slate-500 dark:text-slate-400" />}
            <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</span>
          </button>
          <button onClick={() => navigate('/profile/settings/permissions')} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60">
            <ShieldCheck size={18} className="text-slate-500 dark:text-slate-400" />
            <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">App permissions</span>
          </button>
        </div>

        <button onClick={handleLogout} className="btn-secondary mt-4 w-full">
          Sign out
        </button>

        {user && (
          <>
            {deleteError && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{deleteError}</p>}
            <button
              onClick={() => setConfirmingDelete(true)}
              className="mt-6 flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-rose-600 dark:text-rose-400"
            >
              <Trash2 size={16} />
              Delete account
            </button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete your account?"
        description="This can't be undone from the app. You'll be signed out immediately and won't be able to log back into this account — you'd need to create a new one with a different email or phone number."
        confirmLabel={deleting ? 'Deleting…' : 'Delete my account'}
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  )
}
