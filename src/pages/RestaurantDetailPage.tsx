import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, Clock, Heart, Info, List, MapPin, Search, Star, X } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { restaurantService } from '@/services/restaurantService'
import { menuService } from '@/services/menuService'
import { couponService } from '@/services/couponService'
import { useCart } from '@/hooks/useCart'
import { useFavorites } from '@/hooks/useFavorites'
import { LoadingBlock, EmptyState, Badge } from '@/components/ui/Feedback'
import { MenuItemCard } from '@/components/restaurants/MenuItemCard'
import { ItemAddonSheet } from '@/components/restaurants/ItemAddonSheet'
import { MenuJumpSheet } from '@/components/restaurants/MenuJumpSheet'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FreebieNudge } from '@/components/cart/FreebieNudge'
import { useAppConfig } from '@/context/AppConfigContext'
import { getAvailability } from '@/lib/restaurantAvailability'
import { columnLayoutClass } from '@/lib/columnLayout'
import { classNames } from '@/lib/format'
import type { CartAddon, MenuItem } from '@/types/entities'

export default function RestaurantDetailPage() {
  const { id } = useParams()
  const restaurantId = Number(id)
  const navigate = useNavigate()
  const config = useAppConfig()
  const { data: restaurant, isLoading: loadingRestaurant } = useAsync(() => restaurantService.get(restaurantId), [restaurantId])
  const { data: items, isLoading: loadingItems } = useAsync(() => menuService.itemsForRestaurant(restaurantId), [restaurantId])
  const { data: categories } = useAsync(() => menuService.itemCategoriesForRestaurant(restaurantId), [restaurantId])
  const { data: coupons } = useAsync(() => couponService.listForRestaurant(restaurantId), [restaurantId])
  const cart = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()

  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null)
  const [pendingAdd, setPendingAdd] = useState<{ item: MenuItem; addons: CartAddon[]; quantity: number } | null>(null)
  const [dishQuery, setDishQuery] = useState('')
  const [vegOnly, setVegOnly] = useState(false)
  const [menuSheetOpen, setMenuSheetOpen] = useState(false)
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const filteredItems = useMemo(() => {
    if (!items) return []
    const q = dishQuery.trim().toLowerCase()
    return items.filter((i) => (!q || i.name.toLowerCase().includes(q)) && (!vegOnly || i.isVeg))
  }, [items, dishQuery, vegOnly])

  const grouped = useMemo(() => {
    const categoryName = (categoryId: number) => categories?.find((c) => c.id === categoryId)?.name ?? 'Menu'
    const byCategory = new Map<number, MenuItem[]>()
    for (const item of filteredItems) {
      const list = byCategory.get(item.itemCategoryId) ?? []
      list.push(item)
      byCategory.set(item.itemCategoryId, list)
    }
    return [...byCategory.entries()].map(([categoryId, list]) => ({ categoryId, name: categoryName(categoryId), items: list }))
  }, [filteredItems, categories])

  function performAdd(item: MenuItem, addons: CartAddon[], quantity: number) {
    const cartItem = { itemId: item.id, name: item.name, price: item.price, image: item.image, isVeg: item.isVeg, addons, quantity }
    if (cart.wouldReplaceRestaurant(restaurantId)) {
      setPendingAdd({ item, addons, quantity })
      return
    }
    cart.addItem(restaurantId, restaurant?.name ?? '', cartItem)
  }

  function handleAddClick(item: MenuItem) {
    if (item.addonCategoryIds.length > 0) {
      setSheetItem(item)
      return
    }
    performAdd(item, [], 1)
  }

  /** The sheet's stepper is seeded from the existing no-addon cart line (if any) — when that's
   * the case, confirming should set that line's quantity, not add the sheet's quantity on top of it. */
  function handleSheetConfirm(item: MenuItem, addons: CartAddon[], quantity: number) {
    if (addons.length === 0) {
      const line = cart.lines.find((l) => l.itemId === item.id && l.addons.length === 0)
      if (line) {
        cart.updateQuantity(line.key, quantity)
        return
      }
    }
    performAdd(item, addons, quantity)
  }

  function quantityFor(item: MenuItem): number {
    if (item.addonCategoryIds.length > 0) {
      return cart.lines.filter((l) => l.itemId === item.id).reduce((sum, l) => sum + l.quantity, 0)
    }
    return cart.lines.find((l) => l.itemId === item.id && l.addons.length === 0)?.quantity ?? 0
  }

  function scrollToCategory(categoryId: number) {
    sectionRefs.current[categoryId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loadingRestaurant) return <LoadingBlock />
  if (!restaurant) return <EmptyState title="Restaurant not found" />

  const availability = getAvailability(restaurant)
  const orderable = availability.orderable
  const showNudge = cart.restaurantId === restaurantId && cart.lines.length > 0 && coupons

  return (
    <div>
      <div className="relative">
        <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 sm:aspect-[21/9]">
          <img src={restaurant.coverImage} alt={restaurant.name} className={classNames('h-full w-full object-cover', !orderable && 'grayscale')} />
        </div>
        <button
          onClick={() => navigate(-1)}
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur dark:bg-slate-900/90 dark:text-slate-200"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={() => toggleFavorite(restaurantId)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm backdrop-blur hover:text-rose-500 dark:bg-slate-900/90"
          aria-label="Favorite"
        >
          <Heart size={17} className={isFavorite(restaurantId) ? 'fill-rose-500 text-rose-500' : ''} />
        </button>
      </div>

      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{restaurant.name}</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{restaurant.description}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1 font-semibold text-emerald-600">
            <Star size={14} className="fill-emerald-600" /> {restaurant.rating.toFixed(1)} ({restaurant.ratingCount})
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} /> {restaurant.deliveryTimeMinutes} mins
          </span>
          <span className="flex items-center gap-1 truncate">
            <MapPin size={14} className="shrink-0" /> {restaurant.address}
          </span>
        </div>
        <div className="mt-2">
          <Badge tone={!availability.isOpen ? 'red' : availability.isClosingSoon ? 'amber' : 'green'}>
            {availability.label}
          </Badge>
        </div>

        {coupons && coupons.length > 0 && (
          <div className="no-scrollbar -mx-4 mt-3.5 flex gap-3 overflow-x-auto px-4 pb-1">
            {coupons.map((c) => (
              <div key={c.id} className="flex min-w-[200px] shrink-0 items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50 px-3 py-2.5 dark:border-brand-500/40 dark:bg-brand-500/10">
                <BadgeCheck size={16} className="shrink-0 text-brand-600" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-brand-700 dark:text-brand-400">{c.name}</p>
                  <p className="truncate text-[11px] text-brand-600/80 dark:text-brand-400/70">
                    Code <span className="font-mono font-semibold">{c.code}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sticky top-0 z-10 border-y border-slate-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center gap-2">
          <div className="input flex flex-1 items-center gap-2">
            <Search size={15} className="shrink-0 text-slate-400" />
            <input
              value={dishQuery}
              onChange={(e) => setDishQuery(e.target.value)}
              placeholder="Search for dishes"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {dishQuery && (
              <button onClick={() => setDishQuery('')} aria-label="Clear">
                <X size={14} className="text-slate-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setMenuSheetOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
          >
            <List size={15} /> Menu
          </button>
        </div>

        <label className="mt-3 flex w-fit items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <button
            role="switch"
            aria-checked={vegOnly}
            onClick={() => setVegOnly((v) => !v)}
            className={classNames('relative h-5 w-9 shrink-0 rounded-full transition-colors', vegOnly ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700')}
          >
            <span className={classNames('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', vegOnly ? 'translate-x-4' : 'translate-x-0.5')} />
          </button>
          Veg only
        </label>
      </div>

      <div className="border-b-8 border-slate-100 px-4 py-4 dark:border-slate-800">
        {loadingItems ? (
          <LoadingBlock />
        ) : grouped.length === 0 ? (
          <EmptyState title="No dishes found" description={dishQuery ? `Nothing matches "${dishQuery}".` : undefined} />
        ) : (
          grouped.map((group) => (
            <div key={group.categoryId} ref={(el) => { sectionRefs.current[group.categoryId] = el }} className="mt-4 scroll-mt-24">
              <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {group.name} ({group.items.length})
              </h3>
              <div className={config.restaurantItemsLayout === 'TWO_COLUMN' ? classNames('grid gap-3.5', columnLayoutClass(config.restaurantItemsLayout)) : undefined}>
                {group.items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    compact={config.restaurantItemsLayout === 'TWO_COLUMN'}
                    disabled={!orderable}
                    quantityInCart={quantityFor(item)}
                    onAdd={() => handleAddClick(item)}
                    onView={() => setSheetItem(item)}
                    onQuantityChange={
                      item.addonCategoryIds.length === 0
                        ? (next) => {
                            const line = cart.lines.find((l) => l.itemId === item.id && l.addons.length === 0)
                            if (line) {
                              cart.updateQuantity(line.key, next)
                            } else if (next > 0) {
                              performAdd(item, [], next)
                            }
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {restaurant.certificate && (
        <div className="border-b-8 border-slate-100 flex items-center gap-2.5 px-4 py-4 text-xs text-slate-500 dark:text-slate-400">
          {/* Placeholder badge at /public/fssai.png — drop a real fssai.png over it later, no code change needed. */}
          <img src="/fssai.png" alt="FSSAI" className="h-6 w-6 shrink-0" />
          <span>
            FSSAI License No. <span className="font-mono font-medium text-slate-600 dark:text-slate-300">{restaurant.certificate}</span>
          </span>
        </div>
      )}

      <div className="mt-2 border-t border-slate-100 px-4 pb-8 pt-4 dark:border-slate-800 md:pb-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Info size={14} /> Disclaimer
        </h3>
        <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          <li>All prices are set directly by the restaurant.</li>
          <li>All nutritional information is indicative — values are per serve as shared by the restaurant and may vary depending on ingredients and portion size.</li>
          <li>Images are for representational purposes only; the actual item may vary.</li>
          <li>Please inform the restaurant of any allergies or dietary restrictions before ordering.</li>
        </ul>
      </div>

      {/* AppShell's <main> only reserves enough bottom padding for the tab bar — when the
          freebie nudge stacks on top of the floating cart bar too, a short menu list has
          nothing left to scroll past, so the last item's quantity stepper sits under them. */}
      {showNudge && <div className="h-[4.25rem] md:hidden" aria-hidden />}

      <ItemAddonSheet
        item={sheetItem}
        open={!!sheetItem}
        onClose={() => setSheetItem(null)}
        onConfirm={(addons, quantity) => sheetItem && handleSheetConfirm(sheetItem, addons, quantity)}
        initialQuantity={sheetItem && sheetItem.addonCategoryIds.length === 0 ? Math.max(1, quantityFor(sheetItem)) : 1}
      />

      <MenuJumpSheet open={menuSheetOpen} onClose={() => setMenuSheetOpen(false)} groups={grouped} onSelect={scrollToCategory} />

      {showNudge && <FreebieNudge coupons={coupons} subtotal={cart.subtotal} />}

      <ConfirmDialog
        open={!!pendingAdd}
        title="Start a new cart?"
        description={`Your cart has items from ${cart.restaurantName}. Adding from ${restaurant.name} will clear it.`}
        confirmLabel="Clear cart & add"
        onCancel={() => setPendingAdd(null)}
        onConfirm={() => {
          if (pendingAdd) {
            cart.replaceCart(restaurantId, restaurant.name, {
              itemId: pendingAdd.item.id,
              name: pendingAdd.item.name,
              price: pendingAdd.item.price,
              image: pendingAdd.item.image,
              isVeg: pendingAdd.item.isVeg,
              addons: pendingAdd.addons,
              quantity: pendingAdd.quantity,
            })
          }
          setPendingAdd(null)
        }}
      />

      {/* CartFloatingBar and OngoingOrderBar are `fixed` — they float over content rather than
            pushing it up, and can stack up to ~13rem tall together (cart bar + an active order).
            Reserves enough bottom space that the last grid row never renders underneath them. */}
      <div className="h-8 md:hidden" aria-hidden="true" />
    </div>
  )
}
