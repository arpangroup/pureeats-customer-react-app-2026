import { Mic } from 'lucide-react'

/**
 * Design-only voice-search affordance, right of the search input — gated entirely by
 * `config.audioSearchEnabled` at the call site so the backend can remove it at any time with no
 * client release. No speech-recognition wiring yet; it's a no-op tap target for now.
 */
export function AudioSearchIcon({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick?.()
      }}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white"
      aria-label="Search by voice"
    >
      <Mic size={14} />
    </button>
  )
}
