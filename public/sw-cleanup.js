/**
 * Service Worker Cleanup Script
 * 
 * This script is imported by the generated service worker.
 * It handles the cleanup of old caches during the activation phase.
 */

self.addEventListener('activate', (event) => {
  const OLD_CACHE_NAME = 'category-profiles-cache';
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName === OLD_CACHE_NAME) {
            console.log(`[SW] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
});
