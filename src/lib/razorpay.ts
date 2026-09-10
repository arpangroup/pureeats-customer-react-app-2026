const CHECKOUT_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

let scriptPromise: Promise<void> | null = null

/** Loads Razorpay's Checkout widget script once and caches the promise — every subsequent call (a customer re-opening the payment sheet after a failed attempt, say) reuses the same load instead of re-injecting the script tag. */
export function loadRazorpayCheckoutScript(): Promise<void> {
  if (typeof window !== 'undefined' && (window as unknown as { Razorpay?: unknown }).Razorpay) {
    return Promise.resolve()
  }
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = CHECKOUT_SCRIPT_SRC
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        scriptPromise = null // let a retry actually retry instead of resolving to a permanently-broken cached promise
        reject(new Error('Could not load the payment widget — check your connection and try again.'))
      }
      document.body.appendChild(script)
    })
  }
  return scriptPromise
}

export interface RazorpayCheckoutOptions {
  key: string
  orderId: string
  amountPaise: number
  currency: string
  name: string
  description?: string
  prefill?: { name?: string; email?: string; contact?: string }
  themeColor?: string
}

export interface RazorpayPaymentResult {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open(): void
  on(event: 'payment.failed', handler: (response: { error?: { description?: string } }) => void): void
}

interface RazorpayConstructor {
  new (options: Record<string, unknown>): RazorpayInstance
}

/** Opens the Checkout modal and resolves with the payment proof once the customer completes payment, or rejects if they dismiss the sheet or the payment fails. Requires loadRazorpayCheckoutScript() to have resolved first. */
export function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<RazorpayPaymentResult> {
  return new Promise((resolve, reject) => {
    const Razorpay = (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay
    if (!Razorpay) {
      reject(new Error('Payment widget is not ready yet — please try again.'))
      return
    }
    const instance = new Razorpay({
      key: options.key,
      order_id: options.orderId,
      amount: options.amountPaise,
      currency: options.currency,
      name: options.name,
      description: options.description,
      prefill: options.prefill,
      theme: options.themeColor ? { color: options.themeColor } : undefined,
      handler: (response: RazorpaySuccessResponse) => {
        resolve({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        })
      },
      modal: {
        // Checkout's own modal-dismiss callback is the only reliable "customer backed out" signal —
        // there's no separate cancel event.
        ondismiss: () => reject(new Error('Payment was not completed.')),
      },
    })
    instance.on('payment.failed', (response) => {
      reject(new Error(response.error?.description ?? 'Payment failed — please try again.'))
    })
    instance.open()
  })
}
