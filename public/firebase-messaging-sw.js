// Firebase Cloud Messaging background handler — receives push notifications (order status
// updates, promotions/offers) while the app isn't in the foreground tab.
//
// Inert placeholder until a real Firebase project exists: a service worker is a plain static
// file, not part of Vite's build, so it can't read VITE_FIREBASE_* from .env.local the way the
// rest of the app does (see src/config/env.ts, src/lib/firebaseMessaging.ts) — mirror the same
// values here when you set those up. Until then this file loads but never receives anything,
// since firebaseMessaging.ts never registers a token without that config.
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'PureEats'
  const body = payload.notification?.body || payload.data?.body || ''
  self.registration.showNotification(title, { body, icon: '/pwa-icons/icon-192.png' })
})
