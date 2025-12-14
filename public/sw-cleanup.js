/**
 * Service Worker Cleanup Script
 * 
 * This script is imported by the generated service worker.
 * It handles the cleanup of old caches during the activation phase.
 */

self.addEventListener('activate', (event) => {
  const OLD_CACHE_NAMES = [
    'category-profiles-cache', // Legacy cache name
  ];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remove old cache versions
          if (OLD_CACHE_NAMES.includes(cacheName)) {
            console.log(`[SW] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
});

/**
 * Message handler for cache management
 * Allows the app to request cache clearing if needed
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    const cacheNames = event.data.caches || [];
    Promise.all(
      cacheNames.map((cacheName) => {
        console.log(`[SW] Clearing cache: ${cacheName}`);
        return caches.delete(cacheName);
      })
    ).then(() => {
      event.ports[0].postMessage({ success: true });
    }).catch((error) => {
      console.error('[SW] Cache clear error:', error);
      event.ports[0].postMessage({ success: false, error });
    });
  }
});
