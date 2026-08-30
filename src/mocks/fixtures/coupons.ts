import type { Coupon } from '@/types/entities'

export const coupons: Coupon[] = [
  {
    id: 1, code: 'WELCOME50', name: 'Welcome Offer', description: '50% off on your first order',
    discountType: 'percentage', discount: 50, minOrderAmount: 199, uptoAmount: 100,
    expiryDate: '2026-12-31', isActive: true, restaurantId: null, firstOrderOnly: true,
  },
  {
    id: 2, code: 'FREESHIP', name: 'Free Delivery', description: 'Zero delivery charges on this order',
    discountType: 'free_delivery', discount: 0, minOrderAmount: 149, uptoAmount: null,
    expiryDate: '2026-12-31', isActive: true, restaurantId: null, firstOrderOnly: false,
  },
  {
    id: 3, code: 'SPICE100', name: 'Spice Villa Special', description: 'Flat ₹100 off at Spice Villa',
    discountType: 'flat', discount: 100, minOrderAmount: 399, uptoAmount: null,
    expiryDate: '2026-12-31', isActive: true, restaurantId: 1, firstOrderOnly: false,
  },
]
