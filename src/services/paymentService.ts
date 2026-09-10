import { apiClient } from '@/lib/apiClient'
import { IS_MOCK } from '@/config/env'

export interface RazorpayOrderInfo {
  razorpayOrderId: string
  keyId: string
  amountPaise: number
  currency: string
}

export const paymentService = {
  /** Creates the Razorpay order Checkout opens against — must happen server-side (Razorpay requires the secret key to create an order, which never reaches the browser). See docs/location-resolution/README.md's sibling design note in the backend for why the amount here isn't trusted on its own; OrderService re-derives and checks it independently before ever persisting the order. */
  async createRazorpayOrder(amount: number): Promise<RazorpayOrderInfo> {
    if (IS_MOCK) {
      return { razorpayOrderId: `order_mock_${Date.now()}`, keyId: 'rzp_test_mock', amountPaise: Math.round(amount * 100), currency: 'INR' }
    }
    const { data } = await apiClient.post<{ data: RazorpayOrderInfo }>('/payments/razorpay/orders', { amount })
    return data.data
  },
}
