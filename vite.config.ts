import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-icons/icon.svg', 'pwa-icons/apple-touch-icon.png'],
      manifest: {
        name: 'PureEats',
        short_name: 'PureEats',
        description: 'Order food from your favorite restaurants, delivered fast.',
        theme_color: '#f2612c',
        background_color: '#fff7ed',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/pwa-icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        // App-shell only — API responses are never cached so mock/live data always stays fresh.
        globPatterns: ['**/*.{js,css,html,svg,ico}'],
      },
    }),
  ],
  resolve: {
    alias: {
      // Must mirror the "@/*" path in tsconfig.app.json — that file only
      // affects type-checking, this is what actually resolves the import
      // at build/dev time.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5273,
  },
})
