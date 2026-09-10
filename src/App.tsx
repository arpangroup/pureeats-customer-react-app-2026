import { AppRoutes } from '@/routes/AppRoutes'
import { AppConfigProvider } from '@/context/AppConfigContext'
import { CartProvider } from '@/context/CartContext'
import { LocationProvider } from '@/context/LocationContext'
import { FavoritesProvider } from '@/context/FavoritesContext'
import { LocationBootstrap } from '@/components/layout/LocationBootstrap'
import { LocationAutoDetectBootstrap } from '@/components/layout/LocationAutoDetectBootstrap'

export default function App() {
  return (
    <AppConfigProvider>
      <LocationProvider>
        <FavoritesProvider>
          <CartProvider>
            <LocationBootstrap />
            <LocationAutoDetectBootstrap />
            <AppRoutes />
          </CartProvider>
        </FavoritesProvider>
      </LocationProvider>
    </AppConfigProvider>
  )
}
