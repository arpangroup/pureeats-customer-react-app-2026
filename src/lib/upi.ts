import { UPI_PAYEE_NAME, UPI_PAYEE_VPA } from '@/config/env'

/** True on Android/iOS, where a `upi://pay` link actually launches an installed UPI app's payment sheet — desktop browsers have nothing to hand it to. */
export function isMobileDevice(): boolean {
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent)
}

/**
 * Builds the UPI "collect" deep link params (the same `upi://pay` scheme GPay/PhonePe/Paytm/BHIM
 * all register for), pre-filled with the payee, amount and a reference note. There's no gateway
 * behind this to confirm completion (see CheckoutPage's confirmation step), so `note`/`transactionRef`
 * are for the user's and their UPI app's records, not for us to verify against.
 */
function upiParams({ amountInRupees, transactionRef, note }: { amountInRupees: number; transactionRef: string; note: string }): URLSearchParams {
  return new URLSearchParams({
    pa: UPI_PAYEE_VPA,
    pn: UPI_PAYEE_NAME,
    am: amountInRupees.toFixed(2),
    cu: 'INR',
    tr: transactionRef,
    tn: note,
  })
}

/**
 * Android Chrome frequently swallows a plain `upi://` navigation silently (no chooser, no error) —
 * it only reliably resolves custom schemes wrapped as an explicit `intent://` Android Intent, with
 * a `browser_fallback_url` so Chrome has somewhere to go if no UPI app claims the intent (e.g. none
 * installed). iOS Safari/WebKit has no such quirk — `upi://` navigates straight to the app picker.
 */
export function buildUpiLaunchUrl(args: { amountInRupees: number; transactionRef: string; note: string }): string {
  const params = upiParams(args).toString()
  if (!isAndroid()) {
    return `upi://pay?${params}`
  }
  const fallback = encodeURIComponent(window.location.href)
  return `intent://pay?${params}#Intent;scheme=upi;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=${fallback};end`
}
