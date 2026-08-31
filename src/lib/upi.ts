import { UPI_PAYEE_NAME, UPI_PAYEE_VPA } from '@/config/env'

/** True on Android/iOS, where a `upi://pay` link actually launches an installed UPI app's payment sheet — desktop browsers have nothing to hand it to. */
export function isMobileDevice(): boolean {
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent)
}

/**
 * Builds a standard UPI "collect" deep link (the same `upi://pay` scheme GPay/PhonePe/Paytm/BHIM
 * all register for) — opening it hands off to whichever UPI app the user picks, pre-filled with
 * the payee, amount and a reference note. There's no gateway behind this to confirm completion
 * (see CheckoutPage's confirmation step), so `note`/`transactionRef` are for the user's and their
 * UPI app's records, not for us to verify against.
 */
export function buildUpiIntentUrl({ amountInRupees, transactionRef, note }: { amountInRupees: number; transactionRef: string; note: string }): string {
  const params = new URLSearchParams({
    pa: UPI_PAYEE_VPA,
    pn: UPI_PAYEE_NAME,
    am: amountInRupees.toFixed(2),
    cu: 'INR',
    tr: transactionRef,
    tn: note,
  })
  return `upi://pay?${params.toString()}`
}
