# Architecture & state flow

How this app is put together and how state propagates through it — written for "where does X live and what updates it" questions, not as a tutorial. See the root `README.md` for scripts/setup, and the sibling `pureeats-backend-2026/PROMPT_CONTEXT.md` for the backend side of anything mentioned here.

## Provider tree

Every provider below is a React Context; nothing here is Redux/Zustand/a query library — see "Data fetching has no shared cache" further down for what that implies.

```
main.tsx
  BrowserRouter
    ThemeProvider              — light/dark, localStorage-persisted
      InstallPromptProvider    — PWA "Add to Home Screen" prompt capture
        AuthProvider           — user, JWT tokens, OTP login flow
          App.tsx
            AppConfigProvider  — /app-config fetch, SOFT/HARD update banners, Google Maps key, enabled payment methods
              LocationProvider   — activeAddress (selected delivery address)
                FavoritesProvider
                  CartProvider   — cart lines, coupon, delivery type, tip, notes
                    LocationBootstrap   (side-effect only, no UI: auto-selects a default address on login)
                    AppRoutes
                      AuthLayout (public: /login, /register, /verify)
                      AppShell (everything else — TopNavBar / BottomTabBar chrome, CartFloatingBar, the actual pages)
```

`AppConfigProvider` sits *inside* `AuthProvider` because a HARD update can trigger `useAuth().logout()`. Nothing below `CartProvider` needs to know any of this exists except through the `useX()` hooks each context exports (`useAuth`, `useCart`, `useActiveLocation`, `useAppConfig`, ...) — components never reach into a provider's internals directly.

## Where state actually lives

| State | Owner | Persisted? | Who reads it |
|---|---|---|---|
| JWT / logged-in user | `AuthContext` | `localStorage` (token + user) | `useAuth()` everywhere; `apiClient` request interceptor attaches the token to every live-mode call |
| Cart lines, coupon, delivery type, tip, notes | `CartContext` | `localStorage` | `CartPage`, `CheckoutPage`, `CartFloatingBar`, `OngoingOrderBar` (item count only) |
| Selected delivery address | `LocationContext` | `localStorage` | `CartPage` (delivery-charge basis), `CheckoutPage`, `OrderTrackingPage` (map destination) |
| App-config (update severity, Maps key, enabled payment methods) | `AppConfigContext` | in-memory only, refetched every load | `useGoogleMaps()`, `CheckoutPage`'s payment-method list |
| Everything else (restaurant details, orders, coupons available, ...) | **not centralized** — each page fetches its own copy via `useAsync`/`useOrderPolling` | not persisted | that page's own component tree only |

That last row is the one to know before "just read it from state somewhere else" comes up: there is no shared server-state cache (no React Query/SWR). Two components that both need, say, restaurant #4's details will independently call `restaurantService.get(4)` and independently hold the result. This is a deliberate simplicity trade-off for an app this size, not an oversight — if a future feature needs cross-component cache sharing, that's a real architectural addition (a query library), not a bug fix.

## Data fetching hooks

- **`useAsync(loader, deps)`** (`src/hooks/useAsync.ts`) — the default. Runs `loader` once on mount and whenever `deps` change, tracks `{data, isLoading, error}`, exposes `reload()`. This is what almost every page uses for one-shot fetches.
- **`useOrderPolling(loader, deps, intervalMs)`** (`src/hooks/useOrderPolling.ts`) — `useAsync`'s live-updating sibling, used only by `OrderTrackingPage`. Re-runs `loader` on an interval, pauses while the tab is hidden (Page Visibility API), and stops entirely once the loaded order reaches a terminal status (`DELIVERED`/`CANCELLED`/`SELF_PICKUP_COMPLETED`). `OngoingOrderBar` (home page) gets the same live-refresh behavior more cheaply: it just calls `reload()` on `useAsync`'s existing list fetch every 15s rather than re-fetching a single order.
- **`useCartValidation()`** (`src/hooks/useCartValidation.ts`) — see the walkthrough below; not a generic hook, purpose-built for `CartPage`.

Every `src/services/*` function branches on `IS_MOCK` (`src/config/env.ts`) internally — mock fixtures vs. a real `apiClient` call — so hooks and components never know or care which mode is active.

## Walkthrough: cart validation and address-change repricing

This is the flow behind "prices on the Cart page reflect the backend, and changing your address updates them without a manual refresh."

```
CartPage
  useCartValidation()
    reads: useCart() [lines, coupon, deliveryType]
           useAuth() [isAuthenticated, user]
           useActiveLocation() [activeAddress → id, lat, lng]
    effect deps: restaurantId, a derived key of (itemId:qty:addonIds) per line,
                 coupon.code, deliveryType, activeAddress.id/lat/lng
    → if authenticated & live mode: POST /cart/validate {restaurantId, items, addressId, couponCode, deliveryType}
      response: { restaurant.available, items[].available/reason, coupon.valid/reason, pricing, anyUnavailable }
    → if guest & live mode & delivery: GET /geo/ip-location, then GET /pricing/delivery-quote
    → if mock mode: no-op, `result`/`guestQuote` stay null
  CartPage merges the result into what it renders:
    - `validation.items[].available === false` → CartLineItem shows a greyed-out row + reason
      instead of the quantity stepper
    - `validation.restaurant.available === false` → a dismissable-looking banner at the top,
      and `anyUnavailable` disables "Proceed to pay"
    - `validation.coupon.valid === false` → CartPage clears cart.coupon itself (useEffect) and
      shows a one-line notice; this feeds back into useCartValidation's own deps (coupon.code
      changes to null), so the next validate call reflects the cleared coupon
    - `validation.pricing` (authenticated) or `guestQuote.deliveryCharge` (guest) replaces the
      purely client-side estimateOrderPricing() math for the bill card
```

Because `activeAddress.id`/`lat`/`lng` are in the effect's dependency list, saving a new/edited address on `AddressFormPage` and navigating back to `/cart` (see `AddressesPage`'s `from`/`returnTo` `location.state` — mirrors `RequireAuth`'s post-login-redirect pattern) causes `useCartValidation` to re-run with the new coordinates automatically; no explicit "refresh cart" call anywhere.

## Walkthrough: order tracking polling

```
OrderTrackingPage
  useOrderPolling(() => orderService.get(...), deps, 8000)
    on mount: fetch immediately, start an 8s interval
    each tick: if tab visible and status isn't terminal → refetch, otherwise skip
  → when the polled `order.status` changes, a *second* effect (plain useAsync for the
    timeline, keyed on order?.status) re-fetches the milestone timeline too — it only
    needs to run when status actually changes, not every poll tick
  → conditional UI blocks read straight off the polled `order`:
      order.status !== 'PLACED' → "Call restaurant" tel: link (order.restaurantContactNumber)
      order.deliveryPartner != null → rider card (photo/name/vehicle) + "Call rider" tel: link
      order.legalNextStatuses.includes('CANCELLED') → Cancel button → ConfirmDialog → orderService.cancel()

OngoingOrderBar (home page)
  useAsync(orderService.listMine) + its own setInterval(reload, 15000)
  finds the first order in an ACTIVE_STATUSES status, renders
  orderStatusLabel(status, deliveryGuyName) — personalizes RIDER_ASSIGNED/PICKED_UP
  ("<name> is heading to the restaurant" / "<name> picked up your order") once a rider's
  assigned, falls back to a generic label before that
```

Both of these poll independently — there's no shared "current order" store broadcasting updates between `OrderTrackingPage` and `OngoingOrderBar`. If you're on the tracking page and the home bar is also mounted somewhere (it isn't, normally, since they're different routes), they'd each maintain their own polling loop.

## App-config / force-update

`AppConfigProvider` fetches `GET /app-config?clientVersion=<package.json version>` once at boot. The response's `severity` drives two mutually exclusive overlays it renders (mounted at the very top of the tree, always present):
- `SOFT` — a dismissable bottom banner; tapping "Update" clears the Cache Storage API + unregisters the service worker, then reloads.
- `HARD` — a blocking full-screen modal (nothing else can be interacted with); "Update now" does the same cache-clear, plus `useAuth().logout()` if the backend config set `forceLogoutOnHardUpdate`, then reloads.

`useAppConfig()` also exposes `googleMapsApiKey` and `enabledPaymentMethods` for the rest of the app to read — both fall back to build-time env vars (`GOOGLE_MAPS_API_KEY`, "show every payment method") until the fetch resolves or if the admin hasn't configured them, so nothing breaks before the fetch lands.
