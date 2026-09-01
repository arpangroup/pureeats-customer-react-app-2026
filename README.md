# PureEats — customer app

Customer-facing food-ordering React app (Vite + TypeScript + Tailwind), styled to feel like a native app on mobile (bottom tab bar, bottom sheets, installable PWA) and a full web layout on desktop.

Runs entirely on organized mock data by default — no backend needed. It talks to the same Spring Boot backend as the admin panel (`pureeats-react-ui`), using the same auth contract (OTP login, JWT claims, roles), so switching to live data later is a one-line env change.

## Scripts

```bash
npm install
npm run dev       # mock data, http://localhost:5273
npm run dev:uat   # live backend at http://localhost:8081/api/v1 (run pureeats-backend-2026 first)
npm run build
npm run lint
```

## Data source

See `src/config/env.ts`. `VITE_DATA_SOURCE=mock` (default, `.env.development`) uses `src/mocks/fixtures/*`; `VITE_DATA_SOURCE=live` (`.env.uat`) calls the real API via `src/lib/apiClient.ts`. Every `src/services/*` function branches on this once — components never see the difference.

## Structure

- `src/context` — Auth, Theme, Cart, Location (active delivery address), Favorites, AppConfig
- `src/services` — one file per domain, mock/live dual-mode
- `src/mocks/fixtures` — demo dataset
- `src/types/entities.ts` — canonical app-level types every component consumes
- `src/components/layout` — `AppShell` (bottom tabs on mobile, top nav on desktop), `Sheet` (bottom sheet on mobile / modal on desktop)
- `src/pages` — one file per route, see `src/routes/AppRoutes.tsx`

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the provider tree, where each piece of state actually lives, and how the cart-validation and order-tracking-polling flows work end to end. See [docs/UI_SCREENSHOTS.md](docs/UI_SCREENSHOTS.md) for a screenshot-by-screenshot tour of every screen, Figma-board style.
