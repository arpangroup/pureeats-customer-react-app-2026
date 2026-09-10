import { useMemo } from 'react'
import { LocateFixed, MapPinOff } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { PermissionSettingsGuideView } from '@/components/permissions/PermissionSettingsGuideView'
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

            <PermissionSettingsGuideView guide={guide} />
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
