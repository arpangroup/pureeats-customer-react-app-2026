import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'

export interface CmsPage {
  id: number
  name: string
  slug: string
  body: string
}

/** Generic admin-authored CMS pages (Terms, Privacy, Support/Contact, ...) — same GET /pages/{slug} the admin panel's Pages editor writes to. No mock fixtures exist for these yet, so mock mode always behaves as "not found", same as a fresh install with no CMS content authored. */
export const pageService = {
  async getBySlug(slug: string): Promise<CmsPage | null> {
    if (IS_MOCK) {
      await mockDelay()
      return null
    }
    try {
      const { data } = await apiClient.get<{ data: CmsPage }>(`/pages/${slug}`)
      return data.data
    } catch {
      return null
    }
  },
}
