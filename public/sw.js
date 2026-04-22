const CACHE_NAME = 'amauta-libre-v1'
const STATIC_ASSETS = [
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Network-first: siempre intenta red, cae a cache solo si falla
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && STATIC_ASSETS.includes(url.pathname)) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? 'Amauta Libre'
  const options = {
    body: data.body ?? '¿Registraste tus hábitos hoy?',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: { url: data.url ?? '/tablero' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find(c => c.url.includes('/tablero'))
      if (existing) return existing.focus()
      return clients.openWindow(event.notification.data?.url ?? '/tablero')
    })
  )
})
