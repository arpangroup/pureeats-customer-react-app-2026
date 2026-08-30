import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'

import AuthLayout from '@/pages/auth/AuthLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import VerifyPage from '@/pages/auth/VerifyPage'

import HomePage from '@/pages/HomePage'
import SearchPage from '@/pages/SearchPage'
import RestaurantListPage from '@/pages/RestaurantListPage'
import RestaurantDetailPage from '@/pages/RestaurantDetailPage'
import CartPage from '@/pages/CartPage'
import CheckoutPage from '@/pages/CheckoutPage'
import OrderConfirmationPage from '@/pages/OrderConfirmationPage'
import OrdersPage from '@/pages/OrdersPage'
import OrderTrackingPage from '@/pages/OrderTrackingPage'
import RateOrderPage from '@/pages/RateOrderPage'
import ProfilePage from '@/pages/ProfilePage'
import AddressesPage from '@/pages/AddressesPage'
import AddressFormPage from '@/pages/AddressFormPage'
import WalletPage from '@/pages/WalletPage'
import FavoritesPage from '@/pages/FavoritesPage'
import NotificationsPage from '@/pages/NotificationsPage'
import SettingsPage from '@/pages/SettingsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerifyPage />} />
      </Route>

      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/category/:id" element={<RestaurantListPage />} />
        <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderTrackingPage />} />
        <Route path="/orders/:id/confirmation" element={<OrderConfirmationPage />} />
        <Route path="/orders/:id/rate" element={<RateOrderPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/addresses" element={<AddressesPage />} />
        <Route path="/profile/addresses/new" element={<AddressFormPage />} />
        <Route path="/profile/addresses/:id/edit" element={<AddressFormPage />} />
        <Route path="/profile/wallet" element={<WalletPage />} />
        <Route path="/profile/favorites" element={<FavoritesPage />} />
        <Route path="/profile/notifications" element={<NotificationsPage />} />
        <Route path="/profile/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
