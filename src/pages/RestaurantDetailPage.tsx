import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Heart, MapPin, Star } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { restaurantService } from '@/services/restaurantService'
import { menuService } from '@/services/menuService'
import { useCart } from '@/hooks/useCart'
import { useFavorites } from '@/hooks/useFavorites'
import { LoadingBlock, EmptyState } from '@/components/ui/Feedback'
import { MenuItemCard } from '@/components/restaurants/MenuItemCard'
import { ItemAddonSheet } from '@/components/restaurants/ItemAddonSheet'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatCurrency } from '@/lib/format'
import type { CartAddon, MenuItem } from '@/types/entities'

export default function RestaurantDetailPage() {
  const { id } = useParams()
  const restaurantId = Number(id)
  const navigate = useNavigate()
  const { data: restaurant, isLoading: loadingRestaurant } = useAsync(() => restaurantService.get(restaurantId), [restaurantId])
  const { data: items, isLoading: loadingItems } = useAsync(() => menuService.itemsForRestaurant(restaurantId), [restaurantId])
  const { data: categories } = useAsync(() => menuService.itemCategoriesForRestaurant(restaurantId), [restaurantId])
  const cart = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()

  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null)
  const [pendingAdd, setPendingAdd] = useState<{ item: MenuItem; addons: CartAddon[]; quantity: number } | null>(null)

  const grouped = useMemo(() => {
    if (!items) return []
    const categoryName = (categoryId: number) => categories?.find((c) => c.id === categoryId)?.name ?? 'Menu'
    const byCategory = new Map<number, MenuItem[]>()
    for (const item of items) {
      const list = byCategory.get(item.itemCategoryId) ?? []
      list.push(item)
      byCategory.set(item.itemCategoryId, list)
    }
    return [...byCategory.entries()].map(([categoryId, list]) => ({ categoryId, name: categoryName(categoryId), items: list }))
  }, [items, categories])

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

  function quantityFor(item: MenuItem): number {
    if (item.addonCategoryIds.length > 0) {
      return cart.lines.filter((l) => l.itemId === item.id).reduce((sum, l) => sum + l.quantity, 0)
    }
    return cart.lines.find((l) => l.itemId === item.id && l.addons.length === 0)?.quantity ?? 0
  }

  if (loadingRestaurant) return <LoadingBlock />
  if (!restaurant) return <EmptyState title="Restaurant not found" />

  return (
    <div>
      <div className="relative">
        <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 sm:aspect-[21/9]">
          <img src={restaurant.coverImage} alt={restaurant.name} className="h-full w-full object-cover" />
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
      </div>

      <div className="border-t-8 border-slate-100 px-4 py-4 dark:border-slate-800">
        <h2 className="mb-1 text-lg font-bold text-slate-800 dark:text-slate-100">Menu</h2>
        {loadingItems ? (
          <LoadingBlock />
        ) : grouped.length === 0 ? (
          <EmptyState title="Menu unavailable" />
        ) : (
          grouped.map((group) => (
            <div key={group.categoryId} className="mt-4">
              <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {group.name} ({group.items.length})
              </h3>
              <div>
                {group.items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantityInCart={quantityFor(item)}
                    onAdd={() => handleAddClick(item)}
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

      <ItemAddonSheet item={sheetItem} open={!!sheetItem} onClose={() => setSheetItem(null)} onConfirm={(addons, quantity) => sheetItem && performAdd(sheetItem, addons, quantity)} />

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
    </div>
  )
}
