/** Detects OS/browser so the location-permission dialog can show the right navigation path — Chrome's site-settings menu and iOS's Location Services screen live in different places, and a generic "check your settings" is useless on a PWA. */

export type DetectedOs = 'ios' | 'android' | 'windows' | 'mac' | 'linux' | 'other'
export type DetectedBrowser = 'chrome' | 'safari' | 'firefox' | 'edge' | 'samsung' | 'other'

export interface PlatformInfo {
  os: DetectedOs
  browser: DetectedBrowser
  /** True when launched from the home-screen icon (installed PWA) rather than a regular browser tab — the settings path differs on both Android and iOS. */
  isStandalone: boolean
}

/** Chromium's User-Agent Client Hints API — not in lib.dom.d.ts yet, and not implemented at all outside Chromium (Firefox, Safari, and every iOS browser stay undefined here since iOS forces WebKit regardless of browser). Where it exists it's the more future-proof signal: Chrome is progressively stripping OS/version detail out of the plain `navigator.userAgent` string for privacy, but this structured `platform` field is the replacement it ships alongside that reduction. */
interface NavigatorUaData {
  platform: string
  mobile: boolean
}

function getUaDataPlatform(): string | undefined {
  return (navigator as typeof navigator & { userAgentData?: NavigatorUaData }).userAgentData?.platform
}

export function detectPlatform(): PlatformInfo {
  const ua = navigator.userAgent
  const uaPlatform = getUaDataPlatform()

  let os: DetectedOs = 'other'
  if (/iPhone|iPad|iPod/.test(ua)) {
    // Checked first and always from the raw UA string, Client Hints or not — iOS browsers (Chrome
    // and Safari alike) never implement userAgentData, and this token is the one thing Apple has
    // never stripped from it, so it stays the reliable signal here even as Chromium trims others.
    os = 'ios'
  } else if (uaPlatform === 'Android') os = 'android'
  else if (uaPlatform === 'Windows') os = 'windows'
  else if (uaPlatform === 'macOS') os = 'mac'
  else if (uaPlatform === 'Linux' || uaPlatform === 'Chrome OS') os = 'linux'
  else if (/Android/.test(ua)) os = 'android'
  else if (/Win/.test(ua)) os = 'windows'
  else if (/Mac/.test(ua)) os = 'mac'
  else if (/Linux/.test(ua)) os = 'linux'

  let browser: DetectedBrowser = 'other'
  if (/SamsungBrowser/.test(ua)) browser = 'samsung'
  else if (/Edg\//.test(ua)) browser = 'edge'
  else if (/FxiOS|Firefox/.test(ua)) browser = 'firefox'
  else if (/CriOS|Chrome/.test(ua)) browser = 'chrome'
  else if (/Safari/.test(ua)) browser = 'safari'

  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as { standalone?: boolean }).standalone === true

  return { os, browser, isStandalone }
}

export interface LocationSettingsGuide {
  /** Short label for the settings surface these steps lead to, e.g. "Chrome site settings". */
  target: string
  steps: string[]
  /**
   * A settings-page path the customer can copy and paste into a new tab. Browser-internal schemes
   * (chrome://, edge://, about:) can only be reached by typing/pasting them into the address bar —
   * every Chromium and Gecko browser silently refuses a site-initiated navigation or `<a href>`
   * click to one of these, as a deliberate anti-abuse restriction, so this is never rendered as a
   * clickable link.
   */
  copyablePath?: string
  /** True when copyablePath jumps straight to this exact site's permission entry (Chromium's siteDetails page) rather than a general settings list the customer still has to search through. */
  isSiteSpecific?: boolean
}

/** Step-by-step instructions for re-enabling a once-denied location permission, tailored to the platform PureEats is currently running on. Browsers never let a site re-trigger its own permission prompt once the user has said "block" — the user has to flip it back on themselves. */
export function getLocationSettingsGuide({ os, browser, isStandalone }: PlatformInfo): LocationSettingsGuide {
  if (os === 'ios') {
    return {
      target: isStandalone ? 'iPhone Settings → PureEats' : 'iPhone Settings → Safari',
      steps: isStandalone
        ? ['Open the iPhone Settings app', 'Scroll down to "PureEats"', 'Tap "Location" and choose "While Using the App"', 'Come back and reopen PureEats']
        : ['Open the iPhone Settings app', 'Scroll down to Safari (or Privacy & Security → Location Services)', 'Tap "Location" and choose "Ask" or "Allow"', 'Reload this page'],
    }
  }

  if (os === 'android') {
    if (isStandalone) {
      return {
        target: 'Android Settings → Apps → PureEats',
        steps: ['Open Android Settings', 'Go to "Apps" → "PureEats"', 'Tap "Permissions" → "Location"', 'Select "Allow" and come back to the app'],
      }
    }
    return {
      target: 'Chrome site settings',
      steps: ['Tap the lock/info icon in the address bar', 'Tap "Permissions" (or "Site settings")', 'Set "Location" to "Allow"', 'Reload this page'],
    }
  }

  if (browser === 'firefox') {
    // Firefox has no chrome://-style deep link into a single site's permission entry — the closest
    // reachable-by-URL surface is the general Permissions list under Settings > Privacy & Security,
    // which still requires finding this site's row (or using the padlock's "Clear permission" on
    // this exact page, which is one click closer but not something we can jump the customer to).
    return {
      target: 'Firefox site permissions',
      steps: [
        'Click the lock icon in the address bar',
        'Open "Connection secure" → "More information" → "Permissions"',
        'Clear the "Blocked" setting for Location',
        'Reload this page',
      ],
      copyablePath: 'about:preferences#privacy',
    }
  }

  if (browser === 'safari') {
    return {
      target: 'Safari → Settings for This Website',
      steps: ['Click "Safari" in the menu bar → "Settings for This Website…"', 'Set "Location" to "Allow"', 'Reload this page'],
    }
  }

  // Chrome, Edge and other Chromium browsers on desktop share the same lock-icon flow — and both
  // expose a siteDetails settings page keyed off the exact origin, which is the closest thing to a
  // direct deep link a website can offer (still has to be pasted, not clicked — see copyablePath's
  // doc comment above).
  const scheme = browser === 'edge' ? 'edge' : 'chrome'
  return {
    target: browser === 'edge' ? 'Edge site settings' : 'Chrome site settings',
    steps: ['Click the lock/info icon at the start of the address bar', 'Click "Site settings"', 'Set "Location" to "Allow"', 'Reload this page'],
    copyablePath: `${scheme}://settings/content/siteDetails?site=${encodeURIComponent(window.location.origin)}`,
    isSiteSpecific: true,
  }
}
