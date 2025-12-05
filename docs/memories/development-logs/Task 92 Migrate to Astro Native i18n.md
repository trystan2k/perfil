---
title: 'Task 92: Migrate to Astro Native i18n'
type: note
permalink: development-logs/task-92-migrate-to-astro-native-i18n
tags:
- task-92,i18n,astro,migration,completed
---

# Task 92: Migrate to Astro Native i18n

**Date:** 2025-12-03
**Task ID:** #92
**Status:** ✅ Complete

## Overview
Successfully migrated the Perfil app from client-side i18next to Astro's native 
server-side i18n routing system.

## Objectives
- Eliminate FOUC (Flash of Unstyled Content) caused by client-side i18n
- Improve performance with server-side translation loading
- Better SEO through URL-based locale routing
- Simplify architecture by removing client-side i18n complexity

## Implementation Approach

### 1. Astro i18n Configuration
- Configured `astro.config.mjs` with native i18n support
- Set up locale routing: `/en/`, `/es/`, `/pt-BR/`
- Enabled `prefixDefaultLocale: true` for consistent URL structure

### 2. Translation System
- Created `src/i18n/utils.ts` with server-side translation utilities
- Created `src/hooks/useTranslations.ts` for client-side React components
- Implemented lazy state initialization to avoid race conditions

### 3. Component Updates
Refactored 11 components to use new translation system:
- GameSetup, ErrorStateProvider, CategorySelect
- Scoreboard, ProfileProgress, ClueProgress
- NoGamePrompt, PreviousCluesDisplay, RoundSummary
- RemovePointsDialog, LanguageSwitcher

### 4. LanguageSwitcher Fix
- Changed from client-side hook to server-side props
- Eliminated SSR console warnings
- Props: `ariaLabel` and `switchToLabel` passed from Layout

### 5. Navigation Updates
- Created `navigateWithLocale()` helper for locale-aware navigation
- Updated all `window.location.href` calls to preserve locale
- 12 instances updated across components and hooks

### 6. Test Updates
- Rewrote 15 E2E tests for URL-based locale validation
- Updated unit tests to expect localized paths (`/en/`, not `/`)
- All 952 unit tests + 31 E2E tests passing

## Files Changed

**Created (5):**
- `src/i18n/utils.ts` - Server-side translation utilities
- `src/hooks/useTranslations.ts` - Client-side translation hook
- `src/pages//index.astro` - Localized home page
- `src/pages//game.astro` - Localized game page
- Pages reorganized to `/` structure

**Deleted (6):**
- `src/i18n/config.ts` - Old i18next config
- `src/components/I18nProvider.tsx` - Client-side provider
- `src/components/NoGamePromptWithProvider.tsx` - Redundant wrapper
- `src/stores/i18nStore.ts` - Client-side i18n store
- `src/stores/__tests__/i18nStore.test.ts`
- `src/lib/localeDetection.ts` - No longer needed

**Modified (28):**
- All components using translations
- All navigation logic
- E2E and unit tests
- Layout and styles

## Test Results
- ✅ **Unit Tests:** 952/952 passing (100%)
- ✅ **E2E Tests:** 31/31 passing (100%)
- ✅ **Lint:** 118 files clean
- ✅ **Typecheck:** 111 files, 0 errors
- ✅ **Build:** Production-ready

## Key Learnings
1. **Lazy State Initialization:** Use `useState(() => window.__TRANSLATIONS__)` 
to avoid race conditions during hydration
2. **Server Props > Client Hooks:** Pass translation strings as props to avoid 
SSR warnings
3. **E2E Test Migration:** URL-based locales require complete E2E test rewrites
4. **Window Object is OK:** Using `window.__TRANSLATIONS__` is a common, 
acceptable pattern for Astro + React

## Benefits Achieved
- ✅ No FOUC - translations load server-side
- ✅ Better performance - no client-side i18n bundle
- ✅ Better SEO - locale in URL path
- ✅ Simpler architecture - fewer dependencies
- ✅ Type-safe - full TypeScript support
- ✅ No console errors - clean server and client logs

## Related Documentation
- Lesson learned added: "NEVER RUN COMPLETE-CHECK MULTIPLE TIMES UNNECESSARILY"
- Updated dev workflow understanding

