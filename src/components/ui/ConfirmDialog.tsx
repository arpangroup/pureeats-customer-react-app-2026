import { Sheet } from './Sheet'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Sheet
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <div className="flex gap-2">
          <button className="btn-secondary flex-1" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary flex-1" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      }
    >
      {description && <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>}
    </Sheet>
  )
}
