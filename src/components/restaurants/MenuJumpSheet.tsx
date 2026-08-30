import { Sheet } from '@/components/ui/Sheet'

interface MenuGroup {
  categoryId: number
  name: string
  items: unknown[]
}

export function MenuJumpSheet({ open, onClose, groups, onSelect }: { open: boolean; onClose: () => void; groups: MenuGroup[]; onSelect: (categoryId: number) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Menu">
      <div className="space-y-1">
        {groups.map((g) => (
          <button
            key={g.categoryId}
            onClick={() => {
              onSelect(g.categoryId)
              onClose()
            }}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {g.name}
            <span className="text-xs text-slate-400">{g.items.length}</span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
