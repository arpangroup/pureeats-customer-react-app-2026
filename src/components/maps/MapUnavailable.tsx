import { MapPinOff } from 'lucide-react'

export function MapUnavailable({ hasApiKey, reason }: { hasApiKey: boolean; reason?: string }) {
  return (
    <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-4 text-center dark:bg-slate-800">
      <MapPinOff size={22} className="text-slate-400" />
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {hasApiKey ? (reason ?? "Map couldn't load") : 'Map unavailable — no Google Maps API key configured'}
      </p>
    </div>
  )
}
