import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { readStorage, writeStorage } from '@/lib/storage'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'pureeats.theme'

// Matches the actual header/tab-bar background per theme (see TopNavBar,
// PageHeader, BottomTabBar) so the OS status bar / PWA title bar blends
// into the app chrome instead of showing the brand color under every theme.
const STATUS_BAR_COLOR: Record<Theme, string> = { light: '#ffffff', dark: '#0f172a' }

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getInitialTheme(): Theme {
  const stored = readStorage<Theme | null>(THEME_STORAGE_KEY, null)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    writeStorage(THEME_STORAGE_KEY, theme)

    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute('content', STATUS_BAR_COLOR[theme])
    })
    document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute(
      'content',
      theme === 'dark' ? 'black-translucent' : 'default',
    )
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo<ThemeContextValue>(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
