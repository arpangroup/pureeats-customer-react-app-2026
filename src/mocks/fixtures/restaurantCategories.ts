import { placeholderImage } from '@/lib/placeholderImage'
import type { RestaurantCategory } from '@/types/entities'

export const restaurantCategories: RestaurantCategory[] = [
  { id: 1, name: 'North Indian', image: placeholderImage('🍛', '#fb923c', '#e04a1a'), isActive: true },
  { id: 2, name: 'South Indian', image: placeholderImage('🥞', '#fbbf24', '#d97706'), isActive: true },
  { id: 3, name: 'Pizza', image: placeholderImage('🍕', '#f87171', '#b91c1c'), isActive: true },
  { id: 4, name: 'Chinese', image: placeholderImage('🥡', '#fb7185', '#be123c'), isActive: true },
  { id: 5, name: 'Biryani', image: placeholderImage('🍚', '#fbbf24', '#b45309'), isActive: true },
  { id: 6, name: 'Desserts', image: placeholderImage('🍰', '#f0abfc', '#a21caf'), isActive: true },
  { id: 7, name: 'Healthy', image: placeholderImage('🥗', '#86efac', '#15803d'), isActive: true },
  { id: 8, name: 'Fast Food', image: placeholderImage('🍔', '#fdba74', '#c2410c'), isActive: true },
]
