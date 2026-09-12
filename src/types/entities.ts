// Canonical app-level types. Every component consumes these — never the raw
// backend wire shape directly. Each services/* function is responsible for
// mapping mock fixtures AND live API responses into this same shape (the
// live branch also converts wire strings like price/rating/lat-long, which
// the backend serializes as String for BigDecimal fields, into numbers).

export type UserRole = 'admin' | 'employee' | 'restaurant-owner' | 'delivery-guy' | 'customer'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export interface User {
  id: number
  name: string
  email: string
  phone: string
  photo: string | null
  role: UserRole
  defaultAddressId: number | null
  dob: string | null
  gender: Gender | null
}

export interface RestaurantCategory {
  id: number
  name: string
  image: string
  isActive: boolean
}

export type RestaurantDeliveryType = 'delivery' | 'self-pickup' | 'both'

/**
 * The real-time, day-aware open/closed answer computed server-side from the restaurant's actual
 * weekly schedule (today's weekday against today's slots) — unlike the legacy openingTime/closingTime
 * pair below, which is never day-aware. Absent for restaurants running on mock fixtures, which fall
 * back to computing from openingTime/closingTime client-side (see lib/restaurantAvailability.ts).
 */
export interface RestaurantOpenStatus {
  isOpenNow: boolean
  /** True only alongside isOpenNow — the current slot's close time is within the "closing soon" window. */
  isClosingSoon: boolean
  /** "HH:mm", set only when isOpenNow. */
  closesAt: string | null
  /** "HH:mm", set only when !isOpenNow and a future opening exists this week. */
  nextOpensAt: string | null
  /** "today" | "tomorrow" | a lowercase weekday name, set only alongside nextOpensAt. */
  nextOpensLabel: string | null
}

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
  openStatus?: RestaurantOpenStatus
  /** Admin/store-owner-set promo badge — independent of any Coupon. Both unset/null means no badge renders. */
  offerDiscountPercent?: number | null
  offerMaxDiscount?: number | null
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

export type PaymentMode = 'COD' | 'WALLET' | 'UPI' | 'RAZORPAY'
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
  platformFee: number
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

/** Where the "active address" shown on the home page can come from — see src/config/locationResolution.ts and src/lib/locationResolution.ts for how AppConfig's priority lists are interpreted. */
export type LocationSource = 'saved' | 'gps' | 'ip'

export type ColumnLayout = 'ONE_COLUMN' | 'TWO_COLUMN'
export type DeliveryInstructionMode = 'TEXT' | 'QUICK_OPTIONS'
export type MapProvider = 'OSM' | 'GOOGLE'
export type OrderStatusUpdateMode = 'POLL' | 'PUSH' | 'BOTH'

export interface DeliveryInstructionOption {
  key: string
  label: string
  /** lucide-react icon name, e.g. "DoorOpen" — mapped to a component client-side. */
  icon: string
}

export interface AppConfig {
  severity: AppUpdateSeverity
  message: string | null
  latestVersion: string | null
  googleMapsApiKey: string | null
  enabledPaymentMethods: string[]
  forceLogoutOnHardUpdate: boolean
  /** Every field below is a remote feature flag / layout switch — always paired with a client-side default so the UI never breaks on an old or partially-configured backend. */
  audioSearchEnabled: boolean
  promoSliderEnabled: boolean
  topPicksEnabled: boolean
  recommendedItemsEnabled: boolean
  cuisineCategorySectionEnabled: boolean
  restaurantListLayout: ColumnLayout
  recommendedItemsLayout: ColumnLayout
  restaurantItemsLayout: ColumnLayout
  deliveryInstructionMode: DeliveryInstructionMode
  deliveryInstructionOptions: DeliveryInstructionOption[]
  mapProvider: MapProvider
  orderStatusUpdateMode: OrderStatusUpdateMode
  orderStatusPollIntervalMs: number
  /** Ordered "saved" | "gps" | "ip" priority for the home page's active-address label — see src/config/locationResolution.ts and src/lib/locationResolution.ts for how this is interpreted. */
  locationResolutionAuthenticatedPriority: LocationSource[]
  locationResolutionGuestPriority: LocationSource[]
  locationResolutionAuthenticatedFallbackLabel: string
  locationResolutionGuestFallbackLabel: string
  /** Public Razorpay Key ID (never the secret — that never leaves the backend) — null until an admin sets one in Settings → Customer App. */
  razorpayKeyId: string | null
  /** Firebase web config for push notifications — see src/lib/firebaseMessaging.ts. Each field falls back to the matching VITE_FIREBASE_* build-time env var (src/config/env.ts) until an admin sets these. */
  firebaseApiKey: string | null
  firebaseAuthDomain: string | null
  firebaseProjectId: string | null
  firebaseStorageBucket: string | null
  firebaseMessagingSenderId: string | null
  firebaseAppId: string | null
  firebaseVapidKey: string | null
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

export interface PromoSlide {
  id: number
  name: string
  image: string
  /** Where tapping the slide should go — an absolute/relative URL, or empty for a decorative-only slide. */
  url: string | null
}

export interface PromoSlider {
  id: number
  name: string
  slides: PromoSlide[]
}

export interface AppNotification {
  id: number
  title: string
  body: string
  type: string | null
  isRead: boolean
  createdAt: string
}
