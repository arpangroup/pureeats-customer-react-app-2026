import type { RestaurantOpenStatus } from '@/types/entities'

/** Parses "HH:mm" into minutes since midnight. */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export interface OpenStatus {
  isOpen: boolean
  closesAt: string
  opensAt: string
}

/**
 * Legacy client-side computation from a single openingTime/closingTime pair. Only used as a
 * fallback for mock fixtures, which don't carry a server-computed openStatus — anything backed by
 * the live API should go through describeOpenStatus below instead, which is day-aware.
 * Handles the overnight case too (e.g. 18:00–02:00).
 */
export function getOpenStatus(openingTime: string, closingTime: string, now: Date = new Date()): OpenStatus {
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const open = toMinutes(openingTime)
  const close = toMinutes(closingTime)
  const isOpen = open === close ? true : close > open ? nowMinutes >= open && nowMinutes < close : nowMinutes >= open || nowMinutes < close
  return { isOpen, closesAt: formatTime(closingTime), opensAt: formatTime(openingTime) }
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export interface OpenStatusDescription {
  isOpen: boolean
  isClosingSoon: boolean
  label: string
}

/** Turns the server-computed, day-aware openStatus into display-ready text — "Open now · Closes 10:00 PM", "Closing soon · 10:00 PM", "Closed · Opens tomorrow at 9:00 AM". */
export function describeOpenStatus(status: RestaurantOpenStatus): OpenStatusDescription {
  if (status.isOpenNow) {
    const closesAt = status.closesAt ? formatTime(status.closesAt) : ''
    return {
      isOpen: true,
      isClosingSoon: status.isClosingSoon,
      label: status.isClosingSoon ? `Closing soon · ${closesAt}` : `Open now · Closes ${closesAt}`,
    }
  }
  if (status.nextOpensAt) {
    const when =
      status.nextOpensLabel === 'today' || status.nextOpensLabel === 'tomorrow' || !status.nextOpensLabel
        ? status.nextOpensLabel ?? ''
        : capitalize(status.nextOpensLabel)
    return { isOpen: false, isClosingSoon: false, label: `Closed · Opens ${when} ${formatTime(status.nextOpensAt)}`.replace(/\s+/g, ' ').trim() }
  }
  return { isOpen: false, isClosingSoon: false, label: 'Closed' }
}
