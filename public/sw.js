// Service Worker v1.0
// Unico proposito: satisfacer el requisito de instalabilidad PWA.
// CRITICO: NO agregar un handler de "fetch" - rompe iOS Safari en modo PWA.

const CACHE_NAME = 'one-app-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  )
})
