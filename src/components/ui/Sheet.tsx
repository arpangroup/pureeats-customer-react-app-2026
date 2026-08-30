import { X } from 'lucide-react'
import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { classNames } from '@/lib/format'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
}

/**
 * One component for both breakpoints: slides up from the bottom edge-to-edge
 * on mobile (the native bottom-sheet pattern every food-delivery app uses
 * for item/addon detail), and becomes a centered modal dialog on desktop —
 * exactly the "bottom-sheet mobile / modal desktop" requirement, without a
 * second component to keep in sync.
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-[1px] sm:items-center sm:p-4">
      <div
        className={classNames(
          'flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-sheet animate-slide-up',
          'dark:bg-slate-900',
          'sm:max-h-[85vh] sm:max-w-md sm:rounded-3xl sm:animate-fade-in',
        )}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 sm:hidden" />
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
            <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="shrink-0 border-t border-slate-100 px-5 py-3.5 pb-safe dark:border-slate-800">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
