import { Heart } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { RestaurantCard } from '@/components/restaurants/RestaurantCard'
import { useAsync } from '@/hooks/useAsync'
import { useFavorites } from '@/hooks/useFavorites'
import { restaurantService } from '@/services/restaurantService'

export default function FavoritesPage() {
  const { favoriteIds } = useFavorites()
  const { data: restaurants, isLoading } = useAsync(() => restaurantService.list(), [])
  const favorites = (restaurants ?? []).filter((r) => favoriteIds.includes(r.id))

  return (
    <div>
      <PageHeader title="Favorites" />
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[16/10] w-full" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <EmptyState title="No favorites yet" description="Tap the heart on any restaurant to save it here." icon={<Heart size={22} />} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {favorites.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
