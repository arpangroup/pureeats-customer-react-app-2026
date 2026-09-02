import { placeholderImage } from '@/lib/placeholderImage'
import type { PromoSlider } from '@/types/entities'

function banner(emoji: string, from: string, to: string) {
  return placeholderImage(emoji, from, to)
}

/** A single home-page slider containing every promo slide — the Home page shows one slide at a time, auto-advancing through this list (mirrors the shape GET /api/v1/promo-sliders returns). */
export const promoSliders: PromoSlider[] = [
  {
    id: 1,
    name: 'Home banners',
    slides: [
      { id: 1, name: 'First order discount', image: banner('🎉', '#fb923c', '#c2410c'), url: '/category/1' },
      { id: 2, name: 'Free delivery weekend', image: banner('🛵', '#38bdf8', '#0369a1'), url: '/category/2' },
      { id: 3, name: 'New restaurants added', image: banner('🍽️', '#a78bfa', '#6d28d9'), url: null },
    ],
  },
]
