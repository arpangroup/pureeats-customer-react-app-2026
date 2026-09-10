import { Bell, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePushNotifications } from '@/hooks/usePushNotifications'

/** Registers this device's push token app-wide and shows a dismissible toast for any push that arrives while the tab is open — mounted once above the router so it runs regardless of which page the customer is on. See usePushNotifications. */
export function PushNotificationBootstrap() {
  const { toast, dismiss } = usePushNotifications()
  const navigate = useNavigate()

  if (!toast) return null

  function handleClick() {
    if (!toast?.clickAction) return
    dismiss()
    if (/^https?:\/\//.test(toast.clickAction)) {
      window.location.href = toast.clickAction
    } else {
      navigate(toast.clickAction)
    }
  }

  return (
    <div
      onClick={toast.clickAction ? handleClick : undefined}
      className={`fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl bg-slate-800 px-4 py-3 text-white shadow-lg animate-fade-in md:left-auto md:right-6 md:mx-0 dark:bg-slate-700 ${toast.clickAction ? 'cursor-pointer' : ''}`}
    >
      <Bell size={16} className="mt-0.5 shrink-0 text-brand-300" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.body && <p className="mt-0.5 text-xs text-white/80">{toast.body}</p>}
        {toast.image && <img src={toast.image} alt="" className="mt-2 max-h-32 w-full rounded-lg object-cover" />}
      </div>
      <button
        className="shrink-0 text-white/60"
        onClick={(e) => {
          e.stopPropagation()
          dismiss()
        }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}
