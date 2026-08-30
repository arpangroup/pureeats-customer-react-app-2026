import type { Addon } from '@/types/entities'

export const addons: Addon[] = [
  // Margherita (item 23) — Size
  { id: 1, addonCategoryId: 1, name: 'Regular (8")', price: 0, isActive: true },
  { id: 2, addonCategoryId: 1, name: 'Medium (10")', price: 120, isActive: true },
  { id: 3, addonCategoryId: 1, name: 'Large (12")', price: 220, isActive: true },
  // Margherita (item 23) — Extra Toppings
  { id: 4, addonCategoryId: 2, name: 'Extra Cheese', price: 40, isActive: true },
  { id: 5, addonCategoryId: 2, name: 'Mushroom', price: 30, isActive: true },
  { id: 6, addonCategoryId: 2, name: 'Olives', price: 30, isActive: true },
  // Pepperoni (item 25) — Size
  { id: 7, addonCategoryId: 3, name: 'Regular (8")', price: 0, isActive: true },
  { id: 8, addonCategoryId: 3, name: 'Medium (10")', price: 140, isActive: true },
  { id: 9, addonCategoryId: 3, name: 'Large (12")', price: 240, isActive: true },
  // Pepperoni (item 25) — Extra Toppings
  { id: 10, addonCategoryId: 4, name: 'Extra Cheese', price: 40, isActive: true },
  { id: 11, addonCategoryId: 4, name: 'Jalapeno', price: 30, isActive: true },
  // Chicken Dum Biryani (item 36) — Spice Level
  { id: 12, addonCategoryId: 5, name: 'Mild', price: 0, isActive: true },
  { id: 13, addonCategoryId: 5, name: 'Medium', price: 0, isActive: true },
  { id: 14, addonCategoryId: 5, name: 'Spicy', price: 0, isActive: true },
  // Classic Veg Burger (item 56) — Add-ons
  { id: 15, addonCategoryId: 6, name: 'Extra Cheese', price: 25, isActive: true },
  { id: 16, addonCategoryId: 6, name: 'Extra Patty', price: 50, isActive: true },
  // Cheese Burst Burger (item 57) — Add-ons
  { id: 17, addonCategoryId: 7, name: 'Extra Cheese', price: 25, isActive: true },
  { id: 18, addonCategoryId: 7, name: 'Extra Patty', price: 50, isActive: true },
  // Margherita Veg (item 75) — Size
  { id: 19, addonCategoryId: 8, name: 'Regular (8")', price: 0, isActive: true },
  { id: 20, addonCategoryId: 8, name: 'Medium (10")', price: 110, isActive: true },
  { id: 21, addonCategoryId: 8, name: 'Large (12")', price: 200, isActive: true },
]
