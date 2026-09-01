import { useEffect, useState } from 'react'
import { IS_MOCK } from '@/config/env'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useActiveLocation } from '@/hooks/useLocation'
import { cartValidationService, type CartValidationResult, type DeliveryQuote } from '@/services/cartValidationService'

/**
 * Drives the Cart page's live availability/pricing check. Re-runs whenever the cart contents, the
 * applied coupon, OR the active address change — that address dependency is what makes "change
 * address, come back to Cart" recalculate delivery charge automatically, per the requirement that
 * an address change must refresh the payable amount.
 *
 * Authenticated users get the full backend validation (item/coupon/stock/restaurant-hours checks +
 * server-computed pricing). Guests get only a lightweight delivery-charge quote from their
 * IP-resolved location, since they have no saved address or order history to validate a coupon or
 * item availability against — full validation happens for everyone at order-placement time
 * regardless (OrderService.placeOrder), this is purely a "does the total look right" pre-check.
 *
 * A no-op in mock mode: there's no backend rule pipeline to ask, so the Cart page falls back to its
 * existing client-side pricing estimate, unchanged from before this feature existed.
 */
export function useCartValidation() {
  const cart = useCart()
  const { user, isAuthenticated } = useAuth()
  const { activeAddress } = useActiveLocation()
  const [result, setResult] = useState<CartValidationResult | null>(null)
  const [guestQuote, setGuestQuote] = useState<DeliveryQuote | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const restaurantId = cart.restaurantId
  const hasItems = cart.lines.length > 0
  const itemsKey = cart.lines.map((l) => `${l.itemId}:${l.quantity}:${l.addons.map((a) => a.addonId).sort().join(',')}`).join('|')
  const addressId = activeAddress?.id ?? null
  const addressLat = activeAddress?.latitude ?? null
  const addressLng = activeAddress?.longitude ?? null

  useEffect(() => {
    if (IS_MOCK || !isAuthenticated || !user || !restaurantId || !hasItems) {
      setResult(null)
      return
    }
    let cancelled = false
    setIsValidating(true)
    cartValidationService
      .validate({
        restaurantId,
        items: cart.lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity, selectedAddonIds: l.addons.map((a) => a.addonId) })),
        addressId,
        couponCode: cart.coupon?.code ?? null,
        deliveryType: cart.deliveryType,
      })
      .then((r) => {
        if (!cancelled) setResult(r)
      })
      .catch(() => {
        if (!cancelled) setResult(null)
      })
      .finally(() => {
        if (!cancelled) setIsValidating(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, restaurantId, hasItems, itemsKey, cart.coupon?.code, cart.deliveryType, addressId, addressLat, addressLng])

  useEffect(() => {
    if (IS_MOCK || isAuthenticated || !restaurantId || cart.deliveryType !== 'DELIVERY') {
      setGuestQuote(null)
      return
    }
    let cancelled = false
    cartValidationService
      .ipLocation()
      .then((loc) => {
        if (cancelled || loc.latitude == null || loc.longitude == null) return null
        return cartValidationService.guestDeliveryQuote(restaurantId, loc.latitude, loc.longitude)
      })
      .then((quote) => {
        if (!cancelled && quote) setGuestQuote(quote)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, restaurantId, cart.deliveryType])

  return { result, guestQuote, isValidating }
}
