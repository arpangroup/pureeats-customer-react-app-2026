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

/** Handles the overnight case too (e.g. 18:00–02:00). */
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
