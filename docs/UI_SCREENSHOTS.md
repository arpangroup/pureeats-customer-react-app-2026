# UI reference — mobile screens

A visual walkthrough of every major screen, captured from the real app (live backend, not mock data) on an Android device profile (Pixel 7, 412×915). Use this the way you'd use a Figma flow board — to see what a screen looks like and where it sits in the flow, without having to run the app. For how these screens are built and how state moves between them, see [ARCHITECTURE.md](ARCHITECTURE.md).

Screenshots live in [`screenshots/`](screenshots/) and were captured with a small Playwright script (not checked in — see "Regenerating" at the bottom) against `npm run dev:uat`.

---

## 1. Onboarding

<table>
<tr>
<td align="center" width="240">
<img src="screenshots/01-login-email.png" width="220" alt="Sign in with email"><br>
<b>Sign in</b><br>
<sub>Email or phone, OTP-based — no passwords anywhere in this app.</sub>
</td>
<td align="center" width="240">
<img src="screenshots/02-login-otp.png" width="220" alt="Enter OTP"><br>
<b>Enter the code</b><br>
<sub>6-digit OTP, countdown + resend cooldown.</sub>
</td>
</tr>
</table>

## 2. Home & discovery

<table>
<tr>
<td align="center" width="240">
<img src="screenshots/03-home.png" width="220" alt="Home feed"><br>
<b>Home</b><br>
<sub>Cuisine shortcuts + restaurant feed. The card near the bottom is the live <code>OngoingOrderBar</code> — "Demo Delivery One is heading to the restaurant" is a real, polled backend status, not a placeholder.</sub>
</td>
<td align="center" width="240">
<img src="screenshots/04-search.png" width="220" alt="Search"><br>
<b>Search</b><br>
<sub>Search restaurants and dishes; cuisine grid before you type.</sub>
</td>
</tr>
</table>

## 3. Ordering — menu to cart

<table>
<tr>
<td align="center" width="240">
<img src="screenshots/05-restaurant-menu.png" width="220" alt="Restaurant menu"><br>
<b>Restaurant menu</b><br>
<sub>Coupons strip, veg filter, menu list. "ADD" adds straight to cart.</sub>
</td>
<td align="center" width="240">
<img src="screenshots/06-cart.png" width="220" alt="Cart, no address"><br>
<b>Cart — no address yet</b><br>
<sub>"Proceed to pay" is disabled until an authenticated user picks a delivery address.</sub>
</td>
<td align="center" width="240">
<img src="screenshots/06b-cart-with-address.png" width="220" alt="Cart, priced"><br>
<b>Cart — priced</b><br>
<sub>Once an address is set, <code>/cart/validate</code> prices the cart live against the backend — item total, tax, restaurant charge, and distance-based delivery charge all come from the server, not a client-side guess.</sub>
</td>
</tr>
</table>

## 4. Delivery address

<table>
<tr>
<td align="center" width="240">
<img src="screenshots/07-addresses.png" width="220" alt="Saved addresses"><br>
<b>Saved addresses</b><br>
<sub>Default address starred; edit/delete inline.</sub>
</td>
<td align="center" width="240">
<img src="screenshots/08-add-address.png" width="220" alt="Add address"><br>
<b>Add address</b><br>
<sub>Drag-the-pin map picker (OpenStreetMap/Leaflet) or use current location. Saving here returns straight back to the Cart page if that's where you came from.</sub>
</td>
</tr>
</table>

## 5. Checkout & orders

<table>
<tr>
<td align="center" width="240">
<img src="screenshots/09-checkout.png" width="220" alt="Checkout"><br>
<b>Checkout</b><br>
<sub>COD / Wallet / UPI. The payment method list itself is admin-configurable via the app-config endpoint.</sub>
</td>
<td align="center" width="240">
<img src="screenshots/11-orders-list.png" width="220" alt="Orders list"><br>
<b>Your orders</b><br>
<sub>Real restaurant image and a live status pill, both sourced from the backend.</sub>
</td>
<td align="center" width="240">
<img src="screenshots/12-order-tracking.png" width="220" alt="Order tracking"><br>
<b>Order tracking</b><br>
<sub>Polls the backend every ~8s. The milestone timeline, map, and delivery PIN update themselves — no manual refresh needed as the order moves through restaurant-accepted → rider-assigned → delivered.</sub>
</td>
</tr>
</table>

## 6. Profile & account

<table>
<tr>
<td align="center" width="240">
<img src="screenshots/14-profile.png" width="220" alt="Profile"><br>
<b>Profile</b>
</td>
<td align="center" width="240">
<img src="screenshots/15-wallet.png" width="220" alt="Wallet"><br>
<b>Wallet</b>
</td>
<td align="center" width="240">
<img src="screenshots/16-favorites.png" width="220" alt="Favorites"><br>
<b>Favorites</b>
</td>
</tr>
<tr>
<td align="center" width="240">
<img src="screenshots/17-notifications.png" width="220" alt="Notifications"><br>
<b>Notifications</b><br>
<sub>Real push-style entries from <code>NotificationDispatchService</code> as this order's status changed.</sub>
</td>
<td align="center" width="240">
<img src="screenshots/18-settings.png" width="220" alt="Settings"><br>
<b>Settings</b><br>
<sub>Theme toggle, sign out.</sub>
</td>
<td></td>
</tr>
</table>

---

## Regenerating these screenshots

Not checked in as a script (kept out of the repo to avoid a Playwright/Chromium dependency for everyone who clones this). To reproduce:

1. `npm install --no-save playwright && npx playwright install chromium`
2. Start the backend (`pureeats-backend-2026`, `dev` profile) and this app (`npm run dev:uat`).
3. Write a short Playwright script that logs in (email `arpangroup1@gmail.com` in dev, OTP always `123456`), uses `devices['Pixel 7']` for the device profile, navigates each route in [`AppRoutes.tsx`](../src/routes/AppRoutes.tsx), and calls `page.screenshot({ path, fullPage: false })` — **`fullPage: false` matters**: a full-page capture stitches multiple scroll positions together and bakes fixed/sticky elements in at the wrong spot, which doesn't happen on a real phone.
4. Save into `docs/screenshots/`, replacing the files here.
