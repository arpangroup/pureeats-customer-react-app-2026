import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallPromptContextValue {
  /** True once the browser has decided the app is installable and hasn't been prompted yet this session. */
  canInstall: boolean
  isInstalled: boolean
  /** Shows the native install dialog. Resolves 'accepted' | 'dismissed' | 'unavailable'. */
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>
}

const InstallPromptContext = createContext<InstallPromptContextValue | undefined>(undefined)

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as { standalone?: boolean }).standalone === true
}

export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(isStandalone)

  useEffect(() => {
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredEvent(e as BeforeInstallPromptEvent)
    }
    function handleAppInstalled() {
      setDeferredEvent(null)
      setIsInstalled(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  async function promptInstall() {
    if (!deferredEvent) return 'unavailable' as const
    await deferredEvent.prompt()
    const { outcome } = await deferredEvent.userChoice
    setDeferredEvent(null)
    return outcome
  }

  const value: InstallPromptContextValue = {
    canInstall: !!deferredEvent && !isInstalled,
    isInstalled,
    promptInstall,
  }

  return <InstallPromptContext.Provider value={value}>{children}</InstallPromptContext.Provider>
}

export function useInstallPrompt(): InstallPromptContextValue {
  const ctx = useContext(InstallPromptContext)
  if (!ctx) throw new Error('useInstallPrompt must be used within InstallPromptProvider')
  return ctx
}
