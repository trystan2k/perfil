# Task Title
Migrate from vite-plugin-pwa to @vite-pwa/astro

# Implementation Approach
Replaced the vite-plugin-pwa implementation with the official Astro PWA integration (@vite-pwa/astro). This was a configuration-only change with no breaking changes to components or functionality.

# Subtasks Completed
- 94.1: Installed @vite-pwa/astro@1.2.0 package
- 94.2: Removed vite-plugin-pwa dependency
- 94.3: Updated astro.config.mjs to use @vite-pwa/astro integration

# Files Changed/Created
- astro.config.mjs - Updated import and moved PWA configuration from vite.plugins to integrations array
- package.json - Added @vite-pwa/astro dependency, removed vite-plugin-pwa
- pnpm-lock.yaml - Updated package lock file

# Key Implementation Details
- Changed import from `import { VitePWA } from 'vite-plugin-pwa'` to `import AstroPWA from '@vite-pwa/astro'`
- Moved PWA configuration from `vite.plugins` array to `integrations` array
- Preserved all existing PWA configurations (manifest, workbox, caching strategies, runtime caching)
- PwaUpdater component continues to work without modifications (uses virtual:pwa-register/react)
- Service worker and manifest generation working correctly

# Tests Added
No new tests required - existing tests continue to pass with the new integration

# QA Results
- Typecheck: PASSED (0 errors, 0 warnings, 0 hints)
- Lint: PASSED
- Build: PASSED
- Service Worker: Generated successfully (dist/sw.js)
- Manifest: Generated successfully (dist/manifest.webmanifest)
- Precaching: 55 entries (2033.07 KiB)
- Dev server: Works correctly

# Notes
- Subtasks 94.4-94.7 require manual browser testing and staging deployment, which should be performed as follow-up verification
- The @vite-pwa/astro integration is the official Astro integration and provides the same functionality as vite-plugin-pwa
- All virtual modules (virtual:pwa-register/react) are compatible between the two packages
