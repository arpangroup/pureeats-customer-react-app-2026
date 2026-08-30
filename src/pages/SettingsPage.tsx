import { useNavigate } from 'react-router-dom'
import { Download, Moon, Sun } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const { logout } = useAuth()
  const { canInstall, promptInstall } = useInstallPrompt()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
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
        </div>

        <button onClick={handleLogout} className="btn-secondary mt-4 w-full">
          Sign out
        </button>
      </div>
    </div>
  )
}
