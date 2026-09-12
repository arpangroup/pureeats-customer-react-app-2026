import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import type { PaymentMode } from '@/types/entities'

export interface PaymentGateway {
  id: number
  name: string
  description: string
  logo: string
  /** Maps this row to an actual checkout option — a row with no code (or one that isn't 'COD'/'WALLET'/'UPI') is display-only and gets filtered out before rendering, since there's no matching payment flow to run. */
  code: string | null
}

// COD/WALLET/UPI/RAZORPAY have a real checkout flow behind them (code matches PaymentMode) - the
// rest are catalog placeholders for gateways not integrated yet, shown disabled on Checkout.
// Mirrors DemoContentSeeder's GATEWAYS. Razorpay is real (unlike Stripe/PayPal/...) but still needs
// an admin-set key (Settings → Payment Gateways → Razorpay) before it's actually selectable - see
// CheckoutPage's razorpayConfigured check.
const MOCK_GATEWAYS: PaymentGateway[] = [
  { id: 1, name: 'Cash on Delivery', description: 'Pay with cash when your order arrives', logo: '', code: 'COD' },
  { id: 2, name: 'PureEats Wallet', description: 'Pay using your wallet balance', logo: '', code: 'WALLET' },
  { id: 3, name: 'UPI', description: 'Pay via GPay, PhonePe, Paytm & more', logo: '', code: 'UPI' },
  { id: 4, name: 'Razorpay', description: 'Cards, UPI, netbanking and wallets', logo: '', code: 'RAZORPAY' },
  { id: 5, name: 'Stripe', description: 'International cards — not yet integrated', logo: '', code: null },
  { id: 6, name: 'PayPal', description: 'Not yet integrated', logo: '', code: null },
  { id: 7, name: 'PayStack', description: 'Not yet integrated', logo: '', code: null },
  { id: 8, name: 'PayTm', description: 'Not yet integrated', logo: '', code: null },
  { id: 9, name: 'PayUmoney', description: 'Not yet integrated', logo: '', code: null },
  { id: 10, name: 'CCAvenue', description: 'Not yet integrated', logo: '', code: null },
]

/** Admin-controlled (Settings → Payment gateways) — same GET /payment-gateways the admin panel's toggle list writes to, active-only. Replaces the old AppConfig.enabledPaymentMethods filter, which had no admin UI to actually edit. */
export const paymentGatewayService = {
  async list(): Promise<PaymentGateway[]> {
    if (IS_MOCK) {
      await mockDelay()
      return [...MOCK_GATEWAYS]
    }
    const { data } = await apiClient.get<{ data: PaymentGateway[] }>('/payment-gateways')
    return data.data
  },
}

export function isKnownPaymentMode(code: string | null): code is PaymentMode {
  return code === 'COD' || code === 'WALLET' || code === 'UPI' || code === 'RAZORPAY'
}
