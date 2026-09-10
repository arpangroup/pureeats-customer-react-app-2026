import { useLocationAutoDetect } from '@/hooks/useLocationAutoDetect'
import { LocationPermissionDialog } from '@/components/location/LocationPermissionDialog'

/**
 * Mounted once above the router (see App.tsx, next to LocationBootstrap) so device-location
 * resolution starts at app boot rather than waiting for the customer to land on the home page
 * specifically — the "active address" pill in TopNavBar/HomePage's header is already visible on
 * first paint, so resolving late means it visibly flips from "Set your location"/"Other" to a
 * real value a beat later instead of showing the right thing immediately. Rendering the dialog
 * here too means it can prompt from wherever the customer actually lands (usually Home, but also a
 * deep-linked restaurant page), not only when HomePage itself is mounted.
 */
export function LocationAutoDetectBootstrap() {
  const { dialogOpen, dialogState, requesting, handleAllow, handleSkip, handleRetryAfterSettingsChange } = useLocationAutoDetect()
  return <LocationPermissionDialog open={dialogOpen} state={dialogState} requesting={requesting} onAllow={handleAllow} onSkip={handleSkip} onRetry={handleRetryAfterSettingsChange} />
}
