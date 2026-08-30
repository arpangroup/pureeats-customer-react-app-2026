import type { AddonCategory } from '@/types/entities'

export const addonCategories: AddonCategory[] = [
  { id: 1, restaurantId: 3, itemId: 23, name: 'Size', type: 'single', isRequired: true },
  { id: 2, restaurantId: 3, itemId: 23, name: 'Extra Toppings', type: 'multiple', isRequired: false },
  { id: 3, restaurantId: 3, itemId: 25, name: 'Size', type: 'single', isRequired: true },
  { id: 4, restaurantId: 3, itemId: 25, name: 'Extra Toppings', type: 'multiple', isRequired: false },
  { id: 5, restaurantId: 5, itemId: 36, name: 'Spice Level', type: 'single', isRequired: true },
  { id: 6, restaurantId: 8, itemId: 56, name: 'Add-ons', type: 'multiple', isRequired: false },
  { id: 7, restaurantId: 8, itemId: 57, name: 'Add-ons', type: 'multiple', isRequired: false },
  { id: 8, restaurantId: 11, itemId: 75, name: 'Size', type: 'single', isRequired: true },
]
