import type { ColumnLayout } from '@/types/entities'

/** Tailwind grid-cols classes for a config-driven column layout — ONE_COLUMN always renders a single column; TWO_COLUMN renders 2 up from mobile, 3 on large screens. Shared by every grid this app's backend can flip between 1 and 2 columns (Home sections, restaurant listings, a restaurant's menu). */
export function columnLayoutClass(layout: ColumnLayout): string {
  return layout === 'ONE_COLUMN' ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'
}

/**
 * In a TWO_COLUMN grid, an odd item count leaves one card alone on the last row — repeats the
 * first item at the end so the grid always fills evenly. A no-op for ONE_COLUMN (every item already
 * gets its own full-width row, nothing to balance) or an even/empty list. Callers rendering the
 * result must key by `${id}-${index}` rather than bare `id`, since the repeated tail item shares an
 * id with the first.
 */
export function evenOutForGrid<T>(items: T[], layout: ColumnLayout): T[] {
  if (layout !== 'TWO_COLUMN' || items.length === 0 || items.length % 2 === 0) return items
  return [...items, items[0]]
}
