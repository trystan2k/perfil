---
title: Task 96 - PWA Cache Optimization and Offline Support
type: note
permalink: development-logs/task-96-pwa-cache-optimization
---

## Task 96 — PWA Cache Optimization and Offline Support

Optimized the Service Worker configuration for profile data to ensure better offline reliability and data freshness.

### 96.1 - NetworkFirst Strategy for Profile Data
- Updated `astro.config.mjs` runtime caching rule for `**/data.json` files.
- **Strategy**: `NetworkFirst`
- **Timeout**: Added `networkTimeoutSeconds: 10`. If the network request takes longer than 10 seconds, it falls back to the cache.
- **Expiration**: Reduced `maxAgeSeconds` to 7 days (was 30 days) to ensure data doesn't get too stale while allowing for weekly usage offline.
- **Capacity**: Increased `maxEntries` to 100 to accommodate more categories/languages.

### 96.2 - Versioned Cache and Migration
- Changed cache name from `category-profiles-cache` to `profile-data-v2`.
- Implemented a custom cleanup script `public/sw-cleanup.js` to delete the old `category-profiles-cache` during Service Worker activation.
- Configured `workbox.importScripts` to include the cleanup script.

### 96.3 - Offline Verification
- Added E2E test `e2e/tests/pwa-offline.e2e.ts` using Playwright.
- Validates that:
  - Service Worker registers and controls the page.
  - Profile data is cached after initial load.
  - Data can be fetched from cache when offline (simulated).
- Verified `complete-check` pipeline passes.

### Rationale
- **NetworkFirst with Timeout**: Ensures users get the latest data when online, but doesn't block the UI indefinitely if the connection is slow. 10s is a reasonable balance for data fetching.
- **7 Days Expiration**: Profile data changes infrequently, but 30 days might be too long for corrections. 7 days is a good middle ground.
- **Versioning**: Changing the cache name allows for immediate invalidation of old cached data structures if needed, and ensures we don't keep orphaned caches.

### QA Checks
- ✅ Lint/Typecheck passed.
- ✅ New E2E test `PWA Offline Data Caching` passed.
- ✅ Existing tests passed.
