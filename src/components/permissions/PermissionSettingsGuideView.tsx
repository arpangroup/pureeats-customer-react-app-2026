import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { PermissionSettingsGuide } from '@/lib/platform'

/**
 * The "how to turn this back on" block — a copyable deep link where the browser offers one, plus
 * numbered manual steps either way — shared by LocationPermissionDialog and PermissionsPage so
 * both present a once-denied permission's recovery path identically instead of two hand-maintained
 * copies of the same JSX.
 */
export function PermissionSettingsGuideView({ guide }: { guide: PermissionSettingsGuide }) {
  const [copied, setCopied] = useState(false)

  async function handleCopyPath() {
    if (!guide.copyablePath) return
    try {
      await navigator.clipboard.writeText(guide.copyablePath)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard access denied — the path is still shown as plain text to copy manually
    }
  }

  return (
    <>
      {guide.copyablePath && (
        <div className="w-full space-y-1.5 rounded-xl border border-brand-200 bg-brand-50 p-3.5 text-left dark:border-brand-500/30 dark:bg-brand-500/10">
          <p className="text-xs font-semibold text-brand-700 dark:text-brand-400">
            {guide.isSiteSpecific ? "Fastest way — jumps straight to this site's setting" : 'Quick way — opens the settings page below'}
          </p>
          <button
            onClick={handleCopyPath}
            className="flex w-full items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-brand-50 dark:border-brand-500/30 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {copied ? <Check size={13} className="shrink-0 text-brand-600" /> : <Copy size={13} className="shrink-0 text-slate-400" />}
            <span className="truncate font-mono">{guide.copyablePath}</span>
          </button>
          <p className="text-[11px] text-brand-600/80 dark:text-brand-400/70">
            {copied ? 'Copied — paste it into a new browser tab and press Enter.' : "Tap to copy, then paste into a new tab — browsers don't allow a website to open this page directly."}
          </p>
        </div>
      )}

      <details className="w-full text-left" open={!guide.copyablePath}>
        <summary className="cursor-pointer text-xs font-medium text-slate-500 dark:text-slate-400">{guide.copyablePath ? 'Or do it manually' : 'Steps'}</summary>
        <ol className="mt-2 space-y-2 rounded-xl bg-slate-50 p-3.5 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          {guide.steps.map((step, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-brand-600 dark:bg-slate-900">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </details>
    </>
  )
}
