import { restaurants } from './restaurants'
import type { Order } from '@/types/entities'

function restaurantImage(id: number): string {
  return restaurants.find((r) => r.id === id)?.image ?? ''
}

function restaurantName(id: number): string {
  return restaurants.find((r) => r.id === id)?.name ?? 'Restaurant'
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
}

function order(partial: Omit<Order, 'restaurantName' | 'restaurantImage' | 'restaurantContactNumber'> & { restaurantId: number }): Order {
  return {
    ...partial,
    restaurantName: restaurantName(partial.restaurantId),
    restaurantImage: restaurantImage(partial.restaurantId),
    restaurantContactNumber: '9811100000',
  }
}

/** Every order below belongs to Demo Customer One (userId 12) unless noted — covers every OrderStatus for order-history/tracking screens. */
export const ordersByUser: Record<number, Order[]> = {
  12: [
    order({
      id: 501, uniqueOrderId: 'PE-2026-000501', status: 'PLACED', restaurantId: 1,
      address: '221B, Brigade Towers, 5th Block, Koramangala, Bengaluru',
      items: [
        { id: 1, itemId: 5, name: 'Butter Chicken', quantity: 1, price: 340, addons: [] },
        { id: 2, itemId: 9, name: 'Butter Naan', quantity: 2, price: 50, addons: [] },
      ],
      coupon: null, tax: 22, restaurantCharge: 20, deliveryCharge: 25, driverTipAmount: 0, discountAmount: 0,
      total: 482, payable: 507, paymentMode: 'COD', deliveryPin: '4821', orderComment: null, deliveryType: 'DELIVERY',
      createdAt: hoursAgo(0.2), legalNextStatuses: ['RESTAURANT_ACCEPTED', 'CANCELLED'], pricingBreakdown: null,
      deliveryGuyId: null, deliveryGuyName: null, isRated: false,
    }),
    order({
      id: 502, uniqueOrderId: 'PE-2026-000502', status: 'RESTAURANT_ACCEPTED', restaurantId: 5,
      address: '221B, Brigade Towers, 5th Block, Koramangala, Bengaluru',
      items: [
        { id: 3, itemId: 36, name: 'Chicken Dum Biryani', quantity: 2, price: 280, addons: [{ addonCategoryName: 'Spice Level', addonName: 'Spicy', addonPrice: 0 }] },
        { id: 4, itemId: 41, name: 'Raita', quantity: 1, price: 40, addons: [] },
      ],
      coupon: null, tax: 30, restaurantCharge: 25, deliveryCharge: 30, driverTipAmount: 0, discountAmount: 0,
      total: 655, payable: 685, paymentMode: 'UPI', deliveryPin: '7734', orderComment: 'Ring the bell twice', deliveryType: 'DELIVERY',
      createdAt: hoursAgo(0.5), legalNextStatuses: ['READY_FOR_PICKUP', 'CANCELLED'], pricingBreakdown: null,
      deliveryGuyId: null, deliveryGuyName: null, isRated: false,
    }),
    order({
      id: 503, uniqueOrderId: 'PE-2026-000503', status: 'READY_FOR_PICKUP', restaurantId: 3,
      address: '221B, Brigade Towers, 5th Block, Koramangala, Bengaluru',
      items: [
        { id: 5, itemId: 23, name: 'Margherita', quantity: 1, price: 409, addons: [{ addonCategoryName: 'Size', addonName: 'Medium (10")', addonPrice: 120 }, { addonCategoryName: 'Extra Toppings', addonName: 'Extra Cheese', addonPrice: 40 }] },
        { id: 6, itemId: 27, name: 'Garlic Bread', quantity: 1, price: 149, addons: [] },
      ],
      coupon: null, tax: 28, restaurantCharge: 25, deliveryCharge: 30, driverTipAmount: 0, discountAmount: 0,
      total: 611, payable: 641, paymentMode: 'UPI', deliveryPin: '3390', orderComment: null, deliveryType: 'DELIVERY',
      createdAt: hoursAgo(0.8), legalNextStatuses: ['RIDER_ASSIGNED', 'SELF_PICKUP_COMPLETED'], pricingBreakdown: null,
      deliveryGuyId: null, deliveryGuyName: null, isRated: false,
    }),
    order({
      id: 504, uniqueOrderId: 'PE-2026-000504', status: 'RIDER_ASSIGNED', restaurantId: 8,
      address: '221B, Brigade Towers, 5th Block, Koramangala, Bengaluru',
      items: [
        { id: 7, itemId: 57, name: 'Cheese Burst Burger', quantity: 2, price: 160, addons: [{ addonCategoryName: 'Add-ons', addonName: 'Extra Cheese', addonPrice: 25 }, { addonCategoryName: 'Add-ons', addonName: 'Extra Patty', addonPrice: 50 }] },
        { id: 8, itemId: 60, name: 'Peri Peri Fries', quantity: 1, price: 110, addons: [] },
      ],
      coupon: null, tax: 29, restaurantCharge: 20, deliveryCharge: 20, driverTipAmount: 20, discountAmount: 0,
      total: 629, payable: 669, paymentMode: 'COD', deliveryPin: '5512', orderComment: null, deliveryType: 'DELIVERY',
      createdAt: hoursAgo(1), legalNextStatuses: ['PICKED_UP'], pricingBreakdown: null,
      deliveryGuyId: 10, deliveryGuyName: 'Demo Delivery One', isRated: false,
    }),
    order({
      id: 505, uniqueOrderId: 'PE-2026-000505', status: 'PICKED_UP', restaurantId: 2,
      address: '221B, Brigade Towers, 5th Block, Koramangala, Bengaluru',
      items: [
        { id: 9, itemId: 13, name: 'Masala Dosa', quantity: 2, price: 110, addons: [] },
        { id: 10, itemId: 20, name: 'Filter Coffee', quantity: 2, price: 40, addons: [] },
      ],
      coupon: null, tax: 15, restaurantCharge: 10, deliveryCharge: 20, driverTipAmount: 0, discountAmount: 0,
      total: 325, payable: 345, paymentMode: 'WALLET', deliveryPin: '9081', orderComment: null, deliveryType: 'DELIVERY',
      createdAt: hoursAgo(1.3), legalNextStatuses: ['DELIVERED'], pricingBreakdown: null,
      deliveryGuyId: 10, deliveryGuyName: 'Demo Delivery One', isRated: false,
    }),
    order({
      id: 506, uniqueOrderId: 'PE-2026-000506', status: 'DELIVERED', restaurantId: 1,
      address: '221B, Brigade Towers, 5th Block, Koramangala, Bengaluru',
      items: [
        { id: 11, itemId: 8, name: 'Chicken Biryani', quantity: 1, price: 300, addons: [] },
        { id: 12, itemId: 7, name: 'Dal Makhani', quantity: 1, price: 220, addons: [] },
      ],
      coupon: { couponId: 2, code: 'FREESHIP', name: 'Free Delivery', discountType: 'free_delivery', discountAmount: 25 },
      tax: 26, restaurantCharge: 20, deliveryCharge: 0, driverTipAmount: 0, discountAmount: 25,
      total: 566, payable: 566, paymentMode: 'COD', deliveryPin: '2244', orderComment: null, deliveryType: 'DELIVERY',
      createdAt: hoursAgo(72), legalNextStatuses: [], pricingBreakdown: null,
      deliveryGuyId: 11, deliveryGuyName: 'Demo Delivery Two', isRated: true,
    }),
    order({
      id: 507, uniqueOrderId: 'PE-2026-000507', status: 'DELIVERED', restaurantId: 5,
      address: '221B, Brigade Towers, 5th Block, Koramangala, Bengaluru',
      items: [{ id: 13, itemId: 37, name: 'Mutton Biryani', quantity: 1, price: 380, addons: [] }],
      coupon: null, tax: 19, restaurantCharge: 25, deliveryCharge: 30, driverTipAmount: 30, discountAmount: 0,
      total: 424, payable: 454, paymentMode: 'UPI', deliveryPin: '6673', orderComment: null, deliveryType: 'DELIVERY',
      createdAt: hoursAgo(26), legalNextStatuses: [], pricingBreakdown: null,
      deliveryGuyId: 11, deliveryGuyName: 'Demo Delivery Two', isRated: false,
    }),
    order({
      id: 508, uniqueOrderId: 'PE-2026-000508', status: 'SELF_PICKUP_COMPLETED', restaurantId: 2,
      address: '221B, Brigade Towers, 5th Block, Koramangala, Bengaluru',
      items: [{ id: 14, itemId: 12, name: 'Plain Dosa', quantity: 3, price: 90, addons: [] }],
      coupon: null, tax: 13, restaurantCharge: 10, deliveryCharge: 0, driverTipAmount: 0, discountAmount: 0,
      total: 293, payable: 293, paymentMode: 'COD', deliveryPin: '1187', orderComment: null, deliveryType: 'SELF_PICKUP',
      createdAt: hoursAgo(50), legalNextStatuses: [], pricingBreakdown: null,
      deliveryGuyId: null, deliveryGuyName: null, isRated: false,
    }),
    order({
      id: 509, uniqueOrderId: 'PE-2026-000509', status: 'CANCELLED', restaurantId: 3,
      address: '221B, Brigade Towers, 5th Block, Koramangala, Bengaluru',
      items: [{ id: 15, itemId: 24, name: 'Farmhouse', quantity: 1, price: 329, addons: [] }],
      coupon: null, tax: 16, restaurantCharge: 25, deliveryCharge: 30, driverTipAmount: 0, discountAmount: 0,
      total: 370, payable: 400, paymentMode: 'UPI', deliveryPin: '4456', orderComment: null, deliveryType: 'DELIVERY',
      createdAt: hoursAgo(120), legalNextStatuses: [], pricingBreakdown: null,
      deliveryGuyId: null, deliveryGuyName: null, isRated: false,
    }),
  ],
  13: [
    order({
      id: 510, uniqueOrderId: 'PE-2026-000510', status: 'DELIVERED', restaurantId: 7,
      address: 'Flat 302, Prestige Meadows, HSR Layout, Bengaluru',
      items: [{ id: 16, itemId: 53, name: 'Buddha Bowl', quantity: 1, price: 280, addons: [] }],
      coupon: null, tax: 14, restaurantCharge: 15, deliveryCharge: 22, driverTipAmount: 0, discountAmount: 0,
      total: 331, payable: 353, paymentMode: 'COD', deliveryPin: '8820', orderComment: null, deliveryType: 'DELIVERY',
      createdAt: hoursAgo(30), legalNextStatuses: [], pricingBreakdown: null,
      deliveryGuyId: 10, deliveryGuyName: 'Demo Delivery One', isRated: false,
    }),
  ],
}
