import { placeholderImage } from '@/lib/placeholderImage'
import type { MenuItem } from '@/types/entities'

function img(emoji: string, veg: boolean) {
  return veg ? placeholderImage(emoji, '#86efac', '#15803d') : placeholderImage(emoji, '#fda4af', '#be123c')
}

interface Draft {
  id: number
  restaurantId: number
  itemCategoryId: number
  name: string
  description: string
  price: number
  oldPrice?: number
  emoji: string
  isVeg: boolean
  isRecommended?: boolean
  isPopular?: boolean
  isNew?: boolean
  addonCategoryIds?: number[]
}

const drafts: Draft[] = [
  // Spice Villa — Starters
  { id: 1, restaurantId: 1, itemCategoryId: 1, name: 'Paneer Tikka', description: 'Char-grilled cottage cheese, smoky spices.', price: 220, emoji: '🧀', isVeg: true },
  { id: 2, restaurantId: 1, itemCategoryId: 1, name: 'Chicken Seekh Kebab', description: 'Minced chicken skewers, tandoor-roasted.', price: 260, emoji: '🍢', isVeg: false },
  { id: 3, restaurantId: 1, itemCategoryId: 1, name: 'Veg Spring Roll', description: 'Crisp rolls with mixed vegetables.', price: 180, emoji: '🥟', isVeg: true },
  { id: 4, restaurantId: 1, itemCategoryId: 1, name: 'Tandoori Chicken (Half)', description: 'Classic clay-oven roasted chicken.', price: 320, emoji: '🍗', isVeg: false, isPopular: true },
  // Spice Villa — Main Course
  { id: 5, restaurantId: 1, itemCategoryId: 2, name: 'Butter Chicken', description: 'Tomato-butter gravy, tender chicken.', price: 340, oldPrice: 380, emoji: '🍛', isVeg: false, isRecommended: true },
  { id: 6, restaurantId: 1, itemCategoryId: 2, name: 'Paneer Butter Masala', description: 'Rich, creamy tomato gravy.', price: 280, emoji: '🍛', isVeg: true },
  { id: 7, restaurantId: 1, itemCategoryId: 2, name: 'Dal Makhani', description: 'Slow-cooked black lentils and butter.', price: 220, emoji: '🍲', isVeg: true },
  { id: 8, restaurantId: 1, itemCategoryId: 2, name: 'Chicken Biryani', description: 'Fragrant basmati, spiced chicken.', price: 300, emoji: '🍚', isVeg: false, isPopular: true },
  // Spice Villa — Breads
  { id: 9, restaurantId: 1, itemCategoryId: 3, name: 'Butter Naan', description: '', price: 50, emoji: '🫓', isVeg: true },
  { id: 10, restaurantId: 1, itemCategoryId: 3, name: 'Garlic Naan', description: '', price: 60, emoji: '🫓', isVeg: true },
  { id: 11, restaurantId: 1, itemCategoryId: 3, name: 'Tandoori Roti', description: '', price: 30, emoji: '🫓', isVeg: true },

  // Dosa Junction — Dosas
  { id: 12, restaurantId: 2, itemCategoryId: 4, name: 'Plain Dosa', description: 'Crisp rice-lentil crepe.', price: 90, emoji: '🥞', isVeg: true, isRecommended: true },
  { id: 13, restaurantId: 2, itemCategoryId: 4, name: 'Masala Dosa', description: 'Stuffed with spiced potato masala.', price: 110, emoji: '🥞', isVeg: true, isPopular: true },
  { id: 14, restaurantId: 2, itemCategoryId: 4, name: 'Mysore Masala Dosa', description: 'Spicy red chutney layer inside.', price: 130, emoji: '🥞', isVeg: true },
  { id: 15, restaurantId: 2, itemCategoryId: 4, name: 'Rava Dosa', description: 'Lacy semolina crepe.', price: 120, emoji: '🥞', isVeg: true },
  { id: 16, restaurantId: 2, itemCategoryId: 4, name: 'Cheese Dosa', description: 'Loaded with molten cheese.', price: 140, emoji: '🥞', isVeg: true, isNew: true },
  // Dosa Junction — Idli & Vada
  { id: 17, restaurantId: 2, itemCategoryId: 5, name: 'Idli (2pcs)', description: 'Steamed rice cakes with sambar.', price: 60, emoji: '⚪', isVeg: true },
  { id: 18, restaurantId: 2, itemCategoryId: 5, name: 'Medu Vada (2pcs)', description: 'Crispy lentil doughnuts.', price: 70, emoji: '🍩', isVeg: true },
  { id: 19, restaurantId: 2, itemCategoryId: 5, name: 'Idli Vada Combo', description: 'Best of both, one plate.', price: 100, emoji: '🍽️', isVeg: true },
  // Dosa Junction — Beverages
  { id: 20, restaurantId: 2, itemCategoryId: 6, name: 'Filter Coffee', description: '', price: 40, emoji: '☕', isVeg: true },
  { id: 21, restaurantId: 2, itemCategoryId: 6, name: 'Fresh Lime Soda', description: '', price: 50, emoji: '🥤', isVeg: true },
  { id: 22, restaurantId: 2, itemCategoryId: 6, name: 'Buttermilk', description: '', price: 35, emoji: '🥛', isVeg: true },

  // Pizza Bella — Pizzas
  { id: 23, restaurantId: 3, itemCategoryId: 7, name: 'Margherita', description: 'Classic tomato, mozzarella, basil.', price: 249, emoji: '🍕', isVeg: true, isRecommended: true, addonCategoryIds: [1, 2] },
  { id: 24, restaurantId: 3, itemCategoryId: 7, name: 'Farmhouse', description: 'Onion, capsicum, tomato, corn.', price: 329, emoji: '🍕', isVeg: true },
  { id: 25, restaurantId: 3, itemCategoryId: 7, name: 'Pepperoni', description: 'Loaded with spicy pepperoni.', price: 379, emoji: '🍕', isVeg: false, isPopular: true, addonCategoryIds: [3, 4] },
  { id: 26, restaurantId: 3, itemCategoryId: 7, name: 'Chicken Tikka Pizza', description: 'Tandoori chicken tikka topping.', price: 399, emoji: '🍕', isVeg: false },
  // Pizza Bella — Sides
  { id: 27, restaurantId: 3, itemCategoryId: 8, name: 'Garlic Bread', description: '', price: 149, emoji: '🥖', isVeg: true },
  { id: 28, restaurantId: 3, itemCategoryId: 8, name: 'Cheesy Fries', description: '', price: 129, emoji: '🍟', isVeg: true },

  // Wok This Way — Starters
  { id: 29, restaurantId: 4, itemCategoryId: 9, name: 'Veg Manchurian', description: 'Crispy veg balls in tangy sauce.', price: 190, emoji: '🥘', isVeg: true },
  { id: 30, restaurantId: 4, itemCategoryId: 9, name: 'Chicken Manchurian', description: '', price: 230, emoji: '🥘', isVeg: false },
  { id: 31, restaurantId: 4, itemCategoryId: 9, name: 'Spring Rolls', description: '', price: 170, emoji: '🥟', isVeg: true },
  // Wok This Way — Main Course
  { id: 32, restaurantId: 4, itemCategoryId: 10, name: 'Veg Fried Rice', description: '', price: 180, emoji: '🍚', isVeg: true },
  { id: 33, restaurantId: 4, itemCategoryId: 10, name: 'Chicken Fried Rice', description: '', price: 220, emoji: '🍚', isVeg: false, isRecommended: true },
  { id: 34, restaurantId: 4, itemCategoryId: 10, name: 'Hakka Noodles', description: '', price: 190, emoji: '🍜', isVeg: true },
  { id: 35, restaurantId: 4, itemCategoryId: 10, name: 'Chilli Chicken', description: 'Wok-tossed, spicy and tangy.', price: 260, emoji: '🌶️', isVeg: false, isPopular: true },

  // Biryani Nawab — Biryani
  { id: 36, restaurantId: 5, itemCategoryId: 11, name: 'Chicken Dum Biryani', description: 'Slow dum-cooked, aromatic spices.', price: 280, emoji: '🍚', isVeg: false, isRecommended: true, addonCategoryIds: [5] },
  { id: 37, restaurantId: 5, itemCategoryId: 11, name: 'Mutton Biryani', description: 'Tender mutton, layered rice.', price: 380, emoji: '🍚', isVeg: false, isPopular: true },
  { id: 38, restaurantId: 5, itemCategoryId: 11, name: 'Veg Biryani', description: '', price: 220, emoji: '🍚', isVeg: true },
  { id: 39, restaurantId: 5, itemCategoryId: 11, name: 'Egg Biryani', description: '', price: 210, emoji: '🍚', isVeg: false },
  // Biryani Nawab — Sides
  { id: 40, restaurantId: 5, itemCategoryId: 12, name: 'Chicken 65', description: '', price: 220, emoji: '🍗', isVeg: false },
  { id: 41, restaurantId: 5, itemCategoryId: 12, name: 'Raita', description: '', price: 40, emoji: '🥣', isVeg: true },
  { id: 42, restaurantId: 5, itemCategoryId: 12, name: 'Mirchi Ka Salan', description: '', price: 80, emoji: '🌶️', isVeg: true },

  // Sweet Treats Bakery — Cakes
  { id: 43, restaurantId: 6, itemCategoryId: 13, name: 'Chocolate Truffle Cake (500g)', description: '', price: 450, emoji: '🍰', isVeg: true, isRecommended: true },
  { id: 44, restaurantId: 6, itemCategoryId: 13, name: 'Red Velvet Cake (500g)', description: '', price: 480, emoji: '🍰', isVeg: true },
  { id: 45, restaurantId: 6, itemCategoryId: 13, name: 'Black Forest Cake (500g)', description: '', price: 420, emoji: '🍰', isVeg: true },
  { id: 46, restaurantId: 6, itemCategoryId: 13, name: 'Fresh Fruit Cake (500g)', description: '', price: 460, emoji: '🍰', isVeg: true, isNew: true },
  // Sweet Treats Bakery — Pastries & Cookies
  { id: 47, restaurantId: 6, itemCategoryId: 14, name: 'Chocolate Pastry', description: '', price: 90, emoji: '🧁', isVeg: true },
  { id: 48, restaurantId: 6, itemCategoryId: 14, name: 'Butterscotch Pastry', description: '', price: 90, emoji: '🧁', isVeg: true },
  { id: 49, restaurantId: 6, itemCategoryId: 14, name: 'Choco Chip Cookies (6pcs)', description: '', price: 150, emoji: '🍪', isVeg: true },

  // Green Bowl Cafe — Salads
  { id: 50, restaurantId: 7, itemCategoryId: 15, name: 'Greek Salad', description: '', price: 220, emoji: '🥗', isVeg: true, isRecommended: true },
  { id: 51, restaurantId: 7, itemCategoryId: 15, name: 'Caesar Salad (Veg)', description: '', price: 240, emoji: '🥗', isVeg: true },
  { id: 52, restaurantId: 7, itemCategoryId: 15, name: 'Sprouts Salad', description: '', price: 180, emoji: '🥗', isVeg: true },
  // Green Bowl Cafe — Bowls
  { id: 53, restaurantId: 7, itemCategoryId: 16, name: 'Buddha Bowl', description: 'Grains, greens, roasted veg.', price: 280, emoji: '🥙', isVeg: true, isPopular: true },
  { id: 54, restaurantId: 7, itemCategoryId: 16, name: 'Quinoa Power Bowl', description: '', price: 300, emoji: '🥙', isVeg: true },
  { id: 55, restaurantId: 7, itemCategoryId: 16, name: 'Smoothie Bowl', description: '', price: 250, emoji: '🍓', isVeg: true, isNew: true },

  // Burger Barn — Burgers
  { id: 56, restaurantId: 8, itemCategoryId: 17, name: 'Classic Veg Burger', description: '', price: 130, emoji: '🍔', isVeg: true, addonCategoryIds: [6] },
  { id: 57, restaurantId: 8, itemCategoryId: 17, name: 'Cheese Burst Burger', description: '', price: 160, emoji: '🍔', isVeg: true, isPopular: true, addonCategoryIds: [7] },
  { id: 58, restaurantId: 8, itemCategoryId: 17, name: 'Chicken Zinger Burger', description: 'Crispy fried chicken, spicy mayo.', price: 180, emoji: '🍔', isVeg: false, isRecommended: true },
  { id: 59, restaurantId: 8, itemCategoryId: 17, name: 'Double Chicken Burger', description: '', price: 220, emoji: '🍔', isVeg: false },
  // Burger Barn — Sides & Shakes
  { id: 60, restaurantId: 8, itemCategoryId: 18, name: 'Peri Peri Fries', description: '', price: 110, emoji: '🍟', isVeg: true },
  { id: 61, restaurantId: 8, itemCategoryId: 18, name: 'Choco Milkshake', description: '', price: 130, emoji: '🥤', isVeg: true },
  { id: 62, restaurantId: 8, itemCategoryId: 18, name: 'Oreo Shake', description: '', price: 150, emoji: '🥤', isVeg: true },

  // Punjabi Tadka — Main Course
  { id: 63, restaurantId: 9, itemCategoryId: 19, name: 'Dal Tadka', description: '', price: 160, emoji: '🍲', isVeg: true, isRecommended: true },
  { id: 64, restaurantId: 9, itemCategoryId: 19, name: 'Rajma Chawal', description: '', price: 170, emoji: '🍛', isVeg: true },
  { id: 65, restaurantId: 9, itemCategoryId: 19, name: 'Sarson Ka Saag', description: '', price: 180, emoji: '🥬', isVeg: true },
  { id: 66, restaurantId: 9, itemCategoryId: 19, name: 'Chicken Curry', description: '', price: 260, emoji: '🍛', isVeg: false, isPopular: true },
  // Punjabi Tadka — Breads
  { id: 67, restaurantId: 9, itemCategoryId: 20, name: 'Tandoori Roti', description: '', price: 25, emoji: '🫓', isVeg: true },
  { id: 68, restaurantId: 9, itemCategoryId: 20, name: 'Missi Roti', description: '', price: 35, emoji: '🫓', isVeg: true },
  { id: 69, restaurantId: 9, itemCategoryId: 20, name: 'Lachha Paratha', description: '', price: 45, emoji: '🫓', isVeg: true },

  // Idli Dosa Express — Breakfast
  { id: 70, restaurantId: 10, itemCategoryId: 21, name: 'Idli Sambar', description: '', price: 60, emoji: '⚪', isVeg: true, isRecommended: true },
  { id: 71, restaurantId: 10, itemCategoryId: 21, name: 'Plain Dosa', description: '', price: 80, emoji: '🥞', isVeg: true },
  { id: 72, restaurantId: 10, itemCategoryId: 21, name: 'Rava Idli', description: '', price: 70, emoji: '⚪', isVeg: true },
  { id: 73, restaurantId: 10, itemCategoryId: 21, name: 'Upma', description: '', price: 60, emoji: '🍚', isVeg: true, isNew: true },
  { id: 74, restaurantId: 10, itemCategoryId: 21, name: 'Filter Coffee', description: '', price: 35, emoji: '☕', isVeg: true },

  // Cheesy Slice — Pizzas
  { id: 75, restaurantId: 11, itemCategoryId: 22, name: 'Margherita (Veg)', description: '', price: 229, emoji: '🍕', isVeg: true, isRecommended: true, addonCategoryIds: [8] },
  { id: 76, restaurantId: 11, itemCategoryId: 22, name: 'Paneer Tikka Pizza', description: '', price: 329, emoji: '🍕', isVeg: true, isPopular: true },
  { id: 77, restaurantId: 11, itemCategoryId: 22, name: 'Corn & Cheese Pizza', description: '', price: 289, emoji: '🍕', isVeg: true },
  { id: 78, restaurantId: 11, itemCategoryId: 22, name: 'Veggie Supreme', description: '', price: 349, emoji: '🍕', isVeg: true },

  // Dragon Wok — Main Course
  { id: 79, restaurantId: 12, itemCategoryId: 23, name: 'Kung Pao Chicken', description: '', price: 280, emoji: '🥘', isVeg: false, isRecommended: true },
  { id: 80, restaurantId: 12, itemCategoryId: 23, name: 'Szechuan Veg', description: '', price: 220, emoji: '🥘', isVeg: true },
  { id: 81, restaurantId: 12, itemCategoryId: 23, name: 'Sweet & Sour Chicken', description: '', price: 260, emoji: '🥘', isVeg: false, isPopular: true },
  { id: 82, restaurantId: 12, itemCategoryId: 23, name: 'Dragon Chicken', description: '', price: 270, emoji: '🐉', isVeg: false, isNew: true },
]

export const items: MenuItem[] = drafts.map((d) => ({
  id: d.id,
  restaurantId: d.restaurantId,
  itemCategoryId: d.itemCategoryId,
  name: d.name,
  description: d.description,
  price: d.price,
  oldPrice: d.oldPrice ?? null,
  image: img(d.emoji, d.isVeg),
  isVeg: d.isVeg,
  isRecommended: d.isRecommended ?? false,
  isPopular: d.isPopular ?? false,
  isNew: d.isNew ?? false,
  isActive: true,
  addonCategoryIds: d.addonCategoryIds ?? [],
}))
