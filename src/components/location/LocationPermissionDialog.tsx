import { useMemo, useState } from 'react'
import { LocateFixed, MapPinOff, Copy, Check } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { detectPlatform, getLocationSettingsGuide } from '@/lib/platform'
import type { LocationDialogState } from '@/hooks/useLocationAutoDetect'

interface LocationPermissionDialogProps {
  open: boolean
  state: LocationDialogState
  requesting: boolean
  onAllow: () => void
  onSkip: () => void
  onRetry: () => void
}

/**
 * Shown on the home page when we don't yet know where to deliver. Two very different cases share
 * this one dialog: 'prompt' (never asked) gets a single "Allow location access" button that
 * triggers the real native browser prompt from a deliberate tap; 'denied' (browser already
 * refused, so we can no longer trigger that native prompt ourselves) gets step-by-step navigation
 * to the right settings screen for this exact OS/browser/PWA combination instead.
 */
export function LocationPermissionDialog({ open, state, requesting, onAllow, onSkip, onRetry }: LocationPermissionDialogProps) {
  const platform = useMemo(() => detectPlatform(), [])
  const guide = useMemo(() => getLocationSettingsGuide(platform), [platform])
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
    <Sheet
      open={open}
      onClose={onSkip}
      title={state === 'denied' ? 'Location is turned off' : 'Enable your location'}
      footer={
        <div className="flex gap-2">
          <button className="btn-secondary flex-1" onClick={onSkip}>
            Enter address manually
          </button>
          {state === 'denied' ? (
            <button className="btn-primary flex-1" onClick={onRetry} disabled={requesting}>
              {requesting ? 'Checking…' : "I've enabled it"}
            </button>
          ) : (
            <button className="btn-primary flex-1" onClick={onAllow} disabled={requesting}>
              {requesting ? 'Requesting…' : 'Allow location access'}
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10">
          {state === 'denied' ? <MapPinOff size={26} /> : <LocateFixed size={26} />}
        </div>

        {state === 'denied' ? (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              PureEats can't access your location because it's currently blocked for this {platform.isStandalone ? 'app' : 'site'}. Enable it in{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-100">{guide.target}</span> to see nearby restaurants and accurate delivery times automatically.
            </p>

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
              <summary className="cursor-pointer text-xs font-medium text-slate-500 dark:text-slate-400">
                {guide.copyablePath ? 'Or do it manually' : 'Steps'}
              </summary>
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
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Turn on location so we can show restaurants near you and estimate delivery time accurately. As a PWA, PureEats only asks your browser for this — nothing is shared until you tap Allow.
          </p>
        )}
      </div>
    </Sheet>
  )
}
