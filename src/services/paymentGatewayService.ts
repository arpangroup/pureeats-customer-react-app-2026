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

const MOCK_GATEWAYS: PaymentGateway[] = [
  { id: 1, name: 'Cash on Delivery', description: 'Pay with cash when your order arrives', logo: '', code: 'COD' },
  { id: 2, name: 'PureEats Wallet', description: 'Pay using your wallet balance', logo: '', code: 'WALLET' },
  { id: 3, name: 'UPI / Razorpay', description: 'Pay via GPay, PhonePe, Paytm, cards & more', logo: '', code: 'UPI' },
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
  return code === 'COD' || code === 'WALLET' || code === 'UPI'
}
