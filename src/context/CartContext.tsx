import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { readStorage, writeStorage } from '@/lib/storage'
import type { CartAddon, CartLine, OrderDeliveryType } from '@/types/entities'
import type { AppliedCoupon } from '@/lib/pricing'

const CART_STORAGE_KEY = 'pureeats.cart'

interface CartState {
  restaurantId: number | null
  restaurantName: string | null
  lines: CartLine[]
  coupon: AppliedCoupon | null
  tipAmount: number
  deliveryType: OrderDeliveryType
  cookingNote: string
  deliveryInstructions: string
}

const EMPTY_CART: CartState = {
  restaurantId: null,
  restaurantName: null,
  lines: [],
  coupon: null,
  tipAmount: 0,
  deliveryType: 'DELIVERY',
  cookingNote: '',
  deliveryInstructions: '',
}

function lineKey(itemId: number, addons: CartAddon[]): string {
  return `${itemId}:${addons.map((a) => a.addonId).sort((a, b) => a - b).join(',')}`
}

interface AddItemInput {
  itemId: number
  name: string
  price: number
  image: string
  isVeg: boolean
  addons: CartAddon[]
  quantity?: number
}

interface CartContextValue {
  restaurantId: number | null
  restaurantName: string | null
  lines: CartLine[]
  itemCount: number
  subtotal: number
  /** True when adding from a different restaurant than what's already in the cart — the caller should confirm before calling replaceCart. */
  wouldReplaceRestaurant: (restaurantId: number) => boolean
  addItem: (restaurantId: number, restaurantName: string, item: AddItemInput) => void
  /** Clears the cart first, then adds — use after the user confirms switching restaurants. */
  replaceCart: (restaurantId: number, restaurantName: string, item: AddItemInput) => void
  /** Clears the cart and adds every item in one persisted update — unlike calling replaceCart/addItem
   * in a loop (each of those closes over the cart state from render time, so a tight synchronous
   * loop of them clobbers all but the last write), this folds every item into one state transition
   * before persisting once. Used by "Reorder" to replay every line from a past order. */
  replaceCartWithItems: (restaurantId: number, restaurantName: string, items: AddItemInput[]) => void
  updateQuantity: (key: string, quantity: number) => void
  removeLine: (key: string) => void
  clearCart: () => void
  coupon: AppliedCoupon | null
  setCoupon: (coupon: AppliedCoupon | null) => void
  tipAmount: number
  setTipAmount: (amount: number) => void
  deliveryType: OrderDeliveryType
  setDeliveryType: (type: OrderDeliveryType) => void
  cookingNote: string
  setCookingNote: (note: string) => void
  deliveryInstructions: string
  setDeliveryInstructions: (instructions: string) => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>(() => readStorage<CartState>(CART_STORAGE_KEY, EMPTY_CART))

  const persist = useCallback((next: CartState) => {
    writeStorage(CART_STORAGE_KEY, next)
    setCart(next)
  }, [])

  const wouldReplaceRestaurant = useCallback(
    (restaurantId: number) => cart.lines.length > 0 && cart.restaurantId !== null && cart.restaurantId !== restaurantId,
    [cart.lines.length, cart.restaurantId],
  )

  const addToState = useCallback((base: CartState, restaurantId: number, restaurantName: string, item: AddItemInput): CartState => {
    const key = lineKey(item.itemId, item.addons)
    const existing = base.lines.find((l) => l.key === key)
    const quantity = item.quantity ?? 1
    const lines = existing
      ? base.lines.map((l) => (l.key === key ? { ...l, quantity: l.quantity + quantity } : l))
      : [...base.lines, { key, itemId: item.itemId, name: item.name, price: item.price, image: item.image, isVeg: item.isVeg, quantity, addons: item.addons }]
    return {
      restaurantId,
      restaurantName,
      lines,
      coupon: base.coupon,
      tipAmount: base.tipAmount,
      deliveryType: base.deliveryType,
      cookingNote: base.cookingNote,
      deliveryInstructions: base.deliveryInstructions,
    }
  }, [])

  const addItem = useCallback(
    (restaurantId: number, restaurantName: string, item: AddItemInput) => {
      persist(addToState(cart, restaurantId, restaurantName, item))
    },
    [cart, persist, addToState],
  )

  const replaceCart = useCallback(
    (restaurantId: number, restaurantName: string, item: AddItemInput) => {
      persist(addToState(EMPTY_CART, restaurantId, restaurantName, item))
    },
    [persist, addToState],
  )

  const replaceCartWithItems = useCallback(
    (restaurantId: number, restaurantName: string, items: AddItemInput[]) => {
      const next = items.reduce((state, item) => addToState(state, restaurantId, restaurantName, item), EMPTY_CART)
      persist(next)
    },
    [persist, addToState],
  )

  const updateQuantity = useCallback(
    (key: string, quantity: number) => {
      if (quantity <= 0) {
        const lines = cart.lines.filter((l) => l.key !== key)
        persist(lines.length === 0 ? EMPTY_CART : { ...cart, lines })
        return
      }
      persist({ ...cart, lines: cart.lines.map((l) => (l.key === key ? { ...l, quantity } : l)) })
    },
    [cart, persist],
  )

  const removeLine = useCallback(
    (key: string) => {
      const lines = cart.lines.filter((l) => l.key !== key)
      persist(lines.length === 0 ? EMPTY_CART : { ...cart, lines })
    },
    [cart, persist],
  )

  const clearCart = useCallback(() => persist(EMPTY_CART), [persist])

  const setCoupon = useCallback((coupon: AppliedCoupon | null) => persist({ ...cart, coupon }), [cart, persist])
  const setTipAmount = useCallback((tipAmount: number) => persist({ ...cart, tipAmount }), [cart, persist])
  const setDeliveryType = useCallback((deliveryType: OrderDeliveryType) => persist({ ...cart, deliveryType }), [cart, persist])
  const setCookingNote = useCallback((cookingNote: string) => persist({ ...cart, cookingNote }), [cart, persist])
  const setDeliveryInstructions = useCallback((deliveryInstructions: string) => persist({ ...cart, deliveryInstructions }), [cart, persist])

  const itemCount = useMemo(() => cart.lines.reduce((sum, l) => sum + l.quantity, 0), [cart.lines])
  const subtotal = useMemo(
    () => cart.lines.reduce((sum, l) => sum + (l.price + l.addons.reduce((a, addon) => a + addon.addonPrice, 0)) * l.quantity, 0),
    [cart.lines],
  )

  const value = useMemo<CartContextValue>(
    () => ({
      restaurantId: cart.restaurantId,
      restaurantName: cart.restaurantName,
      lines: cart.lines,
      itemCount,
      subtotal,
      wouldReplaceRestaurant,
      addItem,
      replaceCart,
      replaceCartWithItems,
      updateQuantity,
      removeLine,
      clearCart,
      coupon: cart.coupon,
      setCoupon,
      tipAmount: cart.tipAmount,
      setTipAmount,
      deliveryType: cart.deliveryType,
      setDeliveryType,
      cookingNote: cart.cookingNote,
      setCookingNote,
      deliveryInstructions: cart.deliveryInstructions,
      setDeliveryInstructions,
    }),
    [
      cart,
      itemCount,
      subtotal,
      wouldReplaceRestaurant,
      addItem,
      replaceCart,
      replaceCartWithItems,
      updateQuantity,
      removeLine,
      clearCart,
      setCoupon,
      setTipAmount,
      setDeliveryType,
      setCookingNote,
      setDeliveryInstructions,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
