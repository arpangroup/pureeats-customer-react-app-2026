// Canonical app-level types. Every component consumes these — never the raw
// backend wire shape directly. Each services/* function is responsible for
// mapping mock fixtures AND live API responses into this same shape (the
// live branch also converts wire strings like price/rating/lat-long, which
// the backend serializes as String for BigDecimal fields, into numbers).

export type UserRole = 'admin' | 'employee' | 'restaurant-owner' | 'delivery-guy' | 'customer'

export interface User {
  id: number
  name: string
  email: string
  phone: string
  photo: string | null
  role: UserRole
  defaultAddressId: number | null
}

export interface RestaurantCategory {
  id: number
  name: string
  image: string
  isActive: boolean
}

export type RestaurantDeliveryType = 'delivery' | 'self-pickup' | 'both'

export interface Restaurant {
  id: number
  name: string
  slug: string
  description: string
  image: string
  coverImage: string
  contactNumber: string
  rating: number
  ratingCount: number
  deliveryTimeMinutes: number
  /** 1-4, rendered as ₹ / ₹₹ / ₹₹₹ / ₹₹₹₹ */
  priceRange: number
  isPureveg: boolean
  address: string
  pincode: string
  landmark: string
  latitude: number
  longitude: number
  distanceKm: number
  deliveryCharge: number
  minOrderAmount: number
  deliveryRadiusKm: number
  deliveryType: RestaurantDeliveryType
  isSchedulable: boolean
  isActive: boolean
  isAccepted: boolean
  isFeatured: boolean
  isAcceptCod: boolean
  certificate: string | null
  openingTime: string
  closingTime: string
  categoryIds: number[]
}

export interface ItemCategory {
  id: number
  restaurantId: number
  name: string
  isEnabled: boolean
}

export type AddonCategoryType = 'single' | 'multiple'

export interface AddonCategory {
  id: number
  restaurantId: number
  itemId: number
  name: string
  type: AddonCategoryType
  isRequired: boolean
}

export interface Addon {
  id: number
  addonCategoryId: number
  name: string
  price: number
  isActive: boolean
}

export interface MenuItem {
  id: number
  restaurantId: number
  itemCategoryId: number
  name: string
  description: string
  price: number
  oldPrice: number | null
  image: string
  isVeg: boolean
  isRecommended: boolean
  isPopular: boolean
  isNew: boolean
  isActive: boolean
  addonCategoryIds: number[]
}

export type DiscountType = 'flat' | 'percentage' | 'free_delivery'

export interface Coupon {
  id: number
  code: string
  name: string
  description: string
  discountType: DiscountType
  discount: number
  minOrderAmount: number
  uptoAmount: number | null
  expiryDate: string
  isActive: boolean
  restaurantId: number | null
  firstOrderOnly: boolean
}

export interface Address {
  id: number
  house: string
  address: string
  landmark: string | null
  tag: string | null
  latitude: number
  longitude: number
  isDefault: boolean
}

export type PaymentMode = 'COD' | 'WALLET' | 'UPI'
export type OrderDeliveryType = 'DELIVERY' | 'SELF_PICKUP'

export interface CartAddon {
  addonId: number
  addonCategoryName: string
  addonName: string
  addonPrice: number
}

export interface CartLine {
  key: string
  itemId: number
  name: string
  price: number
  image: string
  isVeg: boolean
  quantity: number
  addons: CartAddon[]
}

export interface OrderItemAddon {
  addonCategoryName: string
  addonName: string
  addonPrice: number
}

export interface OrderItem {
  id: number
  itemId: number
  name: string
  quantity: number
  price: number
  addons: OrderItemAddon[]
}

export interface OrderCoupon {
  couponId: number | null
  code: string
  name: string
  discountType: string
  discountAmount: number
}

export type DeliveryChargeBasis = 'FIXED' | 'DYNAMIC' | 'SELF_PICKUP' | 'FREE_DELIVERY_COUPON'

export interface PricingBreakdown {
  itemTotal: number
  discountAmount: number
  amountAfterDiscount: number
  taxAmount: number
  taxPercentage: number
  restaurantChargeAmount: number
  restaurantChargePercentage: number
  deliveryChargeAmount: number
  deliveryChargeBasis: DeliveryChargeBasis
  distanceKm: number
}

export interface OrderTimeline {
  placedAt: string | null
  restaurantAcceptedAt: string | null
  restaurantReadyAt: string | null
  riderAssignedAt: string | null
  pickedUpAt: string | null
  deliveredAt: string | null
  selfPickupCompletedAt: string | null
  cancelledAt: string | null
}

export type OrderStatus =
  | 'PLACED'
  | 'RESTAURANT_ACCEPTED'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'SELF_PICKUP_COMPLETED'
  | 'CANCELLED'

export interface OrderDeliveryPartner {
  id: number
  name: string
  phone: string | null
  photo: string | null
  vehicleNumber: string | null
}

export interface Order {
  id: number
  uniqueOrderId: string
  status: OrderStatus
  restaurantId: number
  restaurantName: string
  restaurantImage: string
  restaurantContactNumber: string
  address: string
  items: OrderItem[]
  coupon: OrderCoupon | null
  tax: number
  restaurantCharge: number
  deliveryCharge: number
  driverTipAmount: number
  discountAmount: number
  total: number
  payable: number
  paymentMode: string
  deliveryPin: string
  orderComment: string | null
  deliveryType: OrderDeliveryType
  createdAt: string
  legalNextStatuses: OrderStatus[]
  pricingBreakdown: PricingBreakdown | null
  deliveryGuyId: number | null
  deliveryGuyName: string | null
  deliveryPartner: OrderDeliveryPartner | null
  isRated: boolean
}

/** The shape GET /orders (list) actually returns — lighter than the full Order the detail/tracking endpoints return. */
export interface OrderSummary {
  id: number
  uniqueOrderId: string
  status: OrderStatus
  restaurantId: number
  restaurantName: string
  restaurantImage: string
  total: number
  payable: number
  createdAt: string
  isRated: boolean
  deliveryGuyName: string | null
}

export type AppUpdateSeverity = 'NONE' | 'SOFT' | 'HARD'

export interface AppConfig {
  severity: AppUpdateSeverity
  message: string | null
  latestVersion: string | null
  googleMapsApiKey: string | null
  enabledPaymentMethods: string[]
  forceLogoutOnHardUpdate: boolean
}

export interface WalletTransaction {
  id: number
  type: 'credit' | 'debit'
  amount: number
  note: string | null
  createdAt: string
}

export type RateableType = 'RESTAURANT' | 'DRIVER'

export interface Rating {
  id: number
  orderId: number
  rateableType: RateableType
  rateableId: number
  rating: number
  comment: string | null
  tags: string[]
  raterName: string
  createdAt: string
}

export interface AppNotification {
  id: number
  title: string
  body: string
  type: string | null
  isRead: boolean
  createdAt: string
}
