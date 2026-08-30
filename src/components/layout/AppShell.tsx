import { Outlet } from 'react-router-dom'
import { TopNavBar } from './TopNavBar'
import { BottomTabBar } from './BottomTabBar'
import { CartFloatingBar } from '@/components/cart/CartFloatingBar'

/**
 * The one layout component behind every authenticated route. Chrome swaps
 * by breakpoint via Tailwind's `md:` prefix — TopNavBar only renders on
 * desktop, BottomTabBar only on mobile — rather than maintaining two
 * separate page trees.
 */
export function AppShell() {
  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950">
      <TopNavBar />
      <main className="mx-auto max-w-6xl pb-24 md:pb-10">
        <Outlet />
      </main>
      <CartFloatingBar />
      <BottomTabBar />
    </div>
  )
}
