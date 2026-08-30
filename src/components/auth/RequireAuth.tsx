import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { EmptyState } from '@/components/ui/Feedback'

/**
 * Wraps the account-scoped content of an otherwise-public page (Orders,
 * Profile sections, Addresses, Wallet, Notifications) — the route itself
 * stays reachable by anyone (browsing never requires login), but the
 * content inside shows a plain "sign in" prompt instead of crashing or
 * silently rendering empty when there's no user yet.
 */
export function RequireAuth({ children, title = 'Sign in to continue', description = 'Log in to your account to see this.' }: { children?: ReactNode; title?: string; description?: string }) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <EmptyState
        title={title}
        description={description}
        icon={<LogIn size={22} />}
        action={
          <button className="btn-primary mt-3" onClick={() => navigate('/login', { state: { from: location.pathname } })}>
            Sign in
          </button>
        }
      />
    )
  }

  return <>{children}</>
}
