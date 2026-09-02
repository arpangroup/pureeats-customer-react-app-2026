import { BellOff, DoorOpen, PhoneOff, UserCheck, PackageCheck, type LucideIcon } from 'lucide-react'

/**
 * Maps a lucide-react icon name (a plain string, as delivered by the backend's
 * `deliveryInstructionOptions` config) to its component. Backend config carries icon names as data
 * rather than JSX, so this is the one place that turns a name back into a renderable icon — add an
 * entry here whenever the backend gains a new option whose icon isn't listed yet. `PackageCheck` is
 * the fallback for an unrecognized name, so an admin-added option never renders nothing.
 */
const ICONS: Record<string, LucideIcon> = {
  DoorOpen,
  PhoneOff,
  BellOff,
  UserCheck,
}

export function iconByName(name: string): LucideIcon {
  return ICONS[name] ?? PackageCheck
}
