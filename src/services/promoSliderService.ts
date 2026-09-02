import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { promoSliders } from '@/mocks/fixtures/promoSliders'
import type { PromoSlide, PromoSlider } from '@/types/entities'

interface LiveSlide {
  id: number
  name: string
  image: string
  imagePlaceholder: string | null
  url: string | null
}

interface LiveSlider {
  id: number
  name: string
  positionId: number | null
  size: number | null
  slides: LiveSlide[]
}

function mapLiveSlide(s: LiveSlide): PromoSlide {
  return { id: s.id, name: s.name, image: s.image || s.imagePlaceholder || '', url: s.url }
}

function mapLiveSlider(s: LiveSlider): PromoSlider {
  return { id: s.id, name: s.name, slides: s.slides.map(mapLiveSlide) }
}

export const promoSliderService = {
  /** Flattens every active slider's slides into one list — the Home page shows a single slider (one slide visible at a time), it doesn't need multiple named sliders. */
  async listSlides(): Promise<PromoSlide[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      return promoSliders.flatMap((s) => s.slides)
    }
    const { data } = await apiClient.get<{ data: LiveSlider[] }>('/promo-sliders')
    return data.data.map(mapLiveSlider).flatMap((s) => s.slides)
  },
}
