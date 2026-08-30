import { AppRoutes } from '@/routes/AppRoutes'
import { CartProvider } from '@/context/CartContext'
import { LocationProvider } from '@/context/LocationContext'
import { FavoritesProvider } from '@/context/FavoritesContext'
import { LocationBootstrap } from '@/components/layout/LocationBootstrap'

export default function App() {
  return (
    <LocationProvider>
      <FavoritesProvider>
        <CartProvider>
          <LocationBootstrap />
          <AppRoutes />
        </CartProvider>
      </FavoritesProvider>
    </LocationProvider>
  )
}
