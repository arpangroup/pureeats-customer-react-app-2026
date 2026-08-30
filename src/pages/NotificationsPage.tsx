import { Bell, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { notificationService } from '@/services/notificationService'
import { timeAgo } from '@/lib/format'
import { classNames } from '@/lib/format'

export default function NotificationsPage() {
  const { user } = useAuth()
  const { data: notifications, isLoading, reload } = useAsync(() => (user ? notificationService.list(user.id) : Promise.resolve([])), [user?.id])

  async function handleOpen(id: number, isRead: boolean) {
    if (!user || isRead) return
    await notificationService.markRead(user.id, id)
    reload()
  }

  async function handleRemove(id: number) {
    if (!user) return
    await notificationService.remove(user.id, id)
    reload()
  }

  async function handleMarkAllRead() {
    if (!user) return
    await notificationService.markAllRead(user.id)
    reload()
  }

  const hasUnread = (notifications ?? []).some((n) => !n.isRead)

  return (
    <div>
      <PageHeader title="Notifications" actions={hasUnread ? <button onClick={handleMarkAllRead} className="text-sm font-semibold text-brand-600">Mark all read</button> : undefined} />
      <div className="mx-auto max-w-lg px-4 py-4">
        <RequireAuth title="Sign in to see notifications" description="Order updates and offers show up here once you're signed in.">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <EmptyState title="No notifications" icon={<Bell size={22} />} />
          ) : (
            <div className="card divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((n) => (
                <div key={n.id} onClick={() => handleOpen(n.id, n.isRead)} className={classNames('flex items-start gap-3 px-4 py-3.5', !n.isRead && 'bg-brand-50/50 dark:bg-brand-500/5')}>
                  <span className={classNames('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.isRead ? 'bg-slate-200 dark:bg-slate-700' : 'bg-brand-600')} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{n.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{n.body}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(n.id)
                    }}
                    className="shrink-0 rounded-full p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500 dark:hover:bg-slate-800"
                    aria-label="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </RequireAuth>
      </div>
    </div>
  )
}
