# Hydration Audit Inventory - client:only Usage

**Date:** 2025-12-05  
**Task:** #42.1 - Audit and Inventory All `client:only` Usages

## Executive Summary

- **Total `client:only` instances found:** 3
- **Files affected:** 1 (Layout.astro)
- **Pages with >3 instances:** None (all usage is in the global Layout)
- **High-priority refactor candidates:** Layout.astro global components

## Detailed Inventory

| # | File | Line | Component | Purpose/Interactivity | Current Directive | Suggested Replacement | Priority | Rationale |
|---|------|------|-----------|----------------------|-------------------|----------------------|----------|-----------|
| 1 | `src/layouts/Layout.astro` | 43 | `ThemeProvider` | Wrapper that applies theme to DOM, listens to system preference changes, manages theme state | `client:only="react"` | `client:load` | High | **Critical for FOUC prevention** - Must hydrate immediately to apply correct theme before first paint. Without early hydration, users see wrong theme briefly. This provider wraps the entire app and needs to run before content renders. |
| 2 | `src/layouts/Layout.astro` | 45 | `ErrorStateProviderWrapper` | Global error state provider that displays error overlays from gameStore | `client:only="react"` | `client:load` | High | **Critical error handling** - Must be ready to catch and display errors from any part of the app immediately. Provides error recovery UI. Since errors can happen anytime, this needs early hydration. |
| 3 | `src/layouts/Layout.astro` | 49 | `ThemeSwitcher` | Interactive button group to switch between light/dark/system themes | `client:only="react"` | `client:idle` | Medium | **User-initiated interaction** - Not critical for initial render. User must click to interact. Can wait until browser is idle. This is a perfect candidate for `client:idle` since it's a non-critical interactive control in the header. |

## Analysis by Component Type

### Provider Components (Wrap entire app)

1. **ThemeProvider** (Line 43)
   - **Current:** `client:only="react"`
   - **Analysis:** Provides theme context to all children. Runs effect to apply theme class to `document.documentElement`. Listens to system theme changes via `matchMedia`.
   - **Interactivity Level:** Background/System - runs on mount, not user-initiated
   - **Recommendation:** `client:load` - Must hydrate early to prevent FOUC (Flash of Unstyled Content)
   - **Impact:** Wraps entire `<body>` content

2. **ErrorStateProviderWrapper** (Line 45)
   - **Current:** `client:only="react"`
   - **Analysis:** Subscribes to gameStore error state, displays modal Dialog when errors occur, handles recovery navigation
   - **Interactivity Level:** Critical system component - error boundaries must be ready immediately
   - **Recommendation:** `client:load` - Critical for app stability and user experience
   - **Impact:** Wraps all page content (slot)

### Interactive UI Components

3. **ThemeSwitcher** (Line 49)
   - **Current:** `client:only="react"`
   - **Analysis:** Renders 3 buttons (Light/Dark/System) with click handlers to change theme
   - **Interactivity Level:** User-initiated, non-critical
   - **Recommendation:** `client:idle` - Can wait until main thread is idle. User must actively click to use this feature.
   - **Impact:** Small UI component in header

## Components Already Using Strategic Hydration

The following components in Layout.astro already use appropriate directives:

| Component | Line | Directive | Justification |
|-----------|------|-----------|---------------|
| `TranslationInitializer` | 44 | `client:load` | ✅ Correct - Must initialize i18n immediately for translations to work |
| `LanguageSwitcher` | 50-56 | `client:load` | ⚠️ Could be `client:idle` - Similar to ThemeSwitcher, user-initiated interaction |
| `PwaUpdater` | 64 | `client:load` | ⚠️ Could be `client:idle` or `client:visible` - Background service worker check, not critical for initial render |

## Pages by client:only Count

| Page/File | client:only Count | Status |
|-----------|-------------------|--------|
| `src/layouts/Layout.astro` | 3 | ⚠️ All can be optimized to strategic directives |

**Note:** All `client:only` usage is centralized in Layout.astro. No individual pages use `client:only` directly.

## High-Priority Refactor Candidates

### 1. Layout.astro (3 instances)
- **File:** `src/layouts/Layout.astro`
- **Reason:** Global layout affects all pages
- **Instances:** 3
- **Recommended Actions:**
  1. Change `ThemeProvider` from `client:only` → `client:load` (critical for FOUC prevention)
  2. Change `ErrorStateProviderWrapper` from `client:only` → `client:load` (critical for error handling)
  3. Change `ThemeSwitcher` from `client:only` → `client:idle` (non-critical user interaction)

### Additional Optimization Opportunities
While reviewing components already using strategic hydration, consider:
- `LanguageSwitcher` (line 50): `client:load` → `client:idle` (user-initiated, non-critical)
- `PwaUpdater` (line 64): `client:load` → `client:idle` (background task, not user-facing)

## Justification for Replacements

### Why NOT client:only?

`client:only` tells Astro to:
- Skip server-side rendering entirely
- Only render on the client
- Hydrate immediately on page load

**Problems:**
- Forces full client-side rendering (no SSR benefits)
- All client:only components hydrate eagerly on load
- Increases initial JS bundle size and TTI
- No progressive enhancement

### Recommended Directive Strategy

1. **client:load** - Use for critical components that must hydrate ASAP
   - Theme providers (FOUC prevention)
   - Error boundaries
   - Critical app state providers
   - Components needed for first meaningful paint

2. **client:idle** - Use for non-critical interactive components
   - Theme switchers, language switchers
   - User preference controls
   - Background services (PWA updates)
   - Components that respond to user actions only

3. **client:visible** - Use for below-the-fold components
   - Lazy-loaded content
   - Offscreen widgets
   - Secondary features

4. **client:only** - Reserve for extreme cases only (max 2-3 per page)
   - Components that absolutely cannot SSR
   - Libraries with browser-only dependencies
   - Cases where SSR causes hydration mismatches

## Next Steps

1. ✅ Document hydration strategy (Subtask 42.2)
2. Refactor Layout.astro components per recommendations (Subtask 42.3)
3. Measure performance impact (Subtask 42.5)
4. Monitor for regressions in theme switching and error handling

## Notes

- The project is already in good shape - only 3 `client:only` instances found
- All usage is centralized in Layout.astro (good for maintainability)
- Some components using `client:load` could be further optimized to `client:idle`
- No pages exceed the 2-3 `client:only` limit (currently all pages have 0 direct usage)
