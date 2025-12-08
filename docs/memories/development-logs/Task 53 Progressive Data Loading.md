---
title: Task 53 Progressive Data Loading
type: note
permalink: development-logs/task-53-progressive-data-loading
---

# Task #53 — Progressive Data Loading

**Status:** ✅ Completed
**Date:** 2025-12-07
**Branch:** feature/PER-53-progressive-data-loading

## Overview

Task #53 implemented progressive data loading and several related improvements to the data and game-play pipelines. The goal was to reduce initial payload, support on-demand loading by category and locale, simplify manifest handling, improve profile randomness, and remove legacy cruft. Work included a data migration, new manifest design, several code refactors and helper utilities, UI/UX updates for language and rounds controls, and test/e2e updates.

## Summary of Changes

1. Category-First Data Structure Migration
   - Migrated directory layout from `/data/{locale}/{category}/...` to `/data/{category}/{locale}/...`.
   - Added a single global manifest at `/public/data/manifest.json` to provide canonical slugs and per-locale display names.
   - Canonical slugs use English keys; translations live in locale-specific display names within the manifest.
   - Created migration script `scripts/migrate-to-category-first.mjs` to automate reorganization and manifest generation.

2. Code Deduplication
   - Introduced shared `src/lib/manifest.ts` to centralize manifest reading/lookup operations and removal of duplicated logic (~186 lines removed).
   - Removed `usePrefetchProfiles.internal.ts` wrapper (internal-only helper no longer needed).
   - Removed unused `usePrefetchOnHover` hook and related wiring.

3. Profile Shuffling & Randomization
   - Added `fisherYatesShuffle()` helper to lib utilities for unbiased shuffling.
   - Implemented `selectAndShuffleProfiles()` which performs selection across categories with even distribution heuristics and then shuffles the final list.
   - Updated `startGame()` to always shuffle profiles for each game instance, guaranteeing no duplicates within a single game session.
   - Removed `generateRoundPlan()` and `roundCategoryMap` from global state—selection is now done up-front per game.

4. Dynamic Max Rounds UI
   - Max rounds input now bounds the maximum by the number of unique profiles available for the currently selected categories.
   - Initial value is set to min(5, maxAvailable).
   - UI shows a dynamic hint message explaining the effective limits.
   - Updated translations for en/es/pt-BR to reflect wording changes.

5. Language Change Warning
   - Added a confirmation dialog when attempting to change language during an active game.
   - If confirmed, the game session IndexedDB store is cleared and the user is redirected to home with the new locale applied.
   - LanguageSwitcher moved to TranslateProvider pattern to centralize side effects and avoid ad-hoc navigation logic.

6. Removed Legacy Code
   - Removed `fetchProfilesLegacy()` and legacy `profiles.json` cache rules from service worker config.
   - Updated tests to remove assertions depending on legacy behaviors.

## Files Created

- `src/lib/manifest.ts` — Shared manifest utilities (reading, validation, locale display lookups).
- `scripts/migrate-to-category-first.mjs` — Migration script to re-structure data and emit a unified manifest.
- `scripts/migrate-profiles-to-categories.mjs` (kept for backward compatibility with earlier migration runs).
- `scripts/validate-performance.mjs` — Performance validation script used during QA.
- `public/data/manifest.json` — Global manifest placed under public/data.
- `e2e/tests/profile-randomness-and-limits.e2e.ts` — End-to-end tests verifying randomness and rounds limits.

## Files Modified (high level)

- ~40 source and test files across `src/`, `e2e/`, and `tests/`.
- 3 translation files: `locales/en/translation.json`, `locales/es/translation.json`, `locales/pt-BR/translation.json`.
- 1 config file: `astro.config.mjs` (service worker caching rules updated).
- 18 data files restructured into category-first layout under `public/data/{category}/{locale}/...`.

## Implementation Details and Rationale

### Manifest design and category-first layout

Rationale
- The previous layout duplicated similar data structures per-locale and per-category, making prefetching and cache strategies awkward.
- A category-first layout allows requesting only the categories the user selects or that the UI prefetches.

Design
- A single global manifest (`public/data/manifest.json`) contains the canonical category slugs and for each category a mapping of locale => display name. Example:
  {
    "categories": [
      { "slug": "famous-people", "displayNames": {"en": "Famous People", "es": "Personas Famosas"} }
    ]
  }
- Data files are organized as `/public/data/{category}/{locale}/data.json` (or data-1.json when chunked). This makes request paths predictable and cache keys stable.

Migration
- `scripts/migrate-to-category-first.mjs` takes existing locale-first data and emits the category-first layout plus a merged `public/data/manifest.json`.
- Migration also validates that the unique profile count per category is preserved and reports missing or duplicated entries.

### Manifest module (src/lib/manifest.ts)

Responsibilities
- Read and validate manifest.json structure at runtime.
- Resolve localized display names, fallback to English when missing.
- Provide helpers that map category slugs to available locales and data paths.

Benefits
- Removed duplication across components and hooks that previously implemented manifest-like responsibilities (~186 lines removed).
- Centralized caching logic and fallbacks.

### Prefetching and service worker caching

Prefetching
- Prefetch config moved to `src/lib/prefetch-config.ts` with a list of popular categories to prefetch for each locale.
- `usePrefetchProfiles` is a simple background prefetch hook that uses the manifest to build requests and warms the browser cache.
- `usePrefetchOnHover` was removed because it created complex lifecycle edge cases and offered little benefit given the category-first approach.

Service worker
- Updated `astro.config.mjs` to reflect new caching strategy:
  - Category files: CacheFirst with 30-day TTL and a maxEntries value.
  - Manifest: StaleWhileRevalidate to keep UI snappy while updating metadata.
  - Legacy `profiles.json` (if present) is served NetworkFirst to preserve backward compatibility until fully removed.

### Profile selection and shuffling

Problem
- Previous implementation relied on stateful round maps and generated plans that occasionally produced duplicates or uneven category distribution.

Solution
- Implemented `selectAndShuffleProfiles(categories, locale, maxRounds)` which:
  - Computes available profiles per selected category.
  - Chooses profiles by round-robin across categories to achieve even distribution (or proportional when categories have different sizes).
  - Uses `fisherYatesShuffle()` on the final set to ensure randomness while preserving distribution constraints.
- `startGame()` now delegates to this function and stores a final shuffled list of profiles in the game session state.
- Removed `generateRoundPlan()` and `roundCategoryMap` from the store as they were no longer needed.

Edge cases handled
- If requested rounds > unique available profiles, max rounds are clamped and the UI communicates the limit.
- Guaranteed: no duplicate profiles in a single game session.

### UI changes: dynamic max rounds and language confirmation

Dynamic max rounds
- The rounds input uses the manifest and selected categories to compute `maxAvailable`.
- Input attributes set `min=1`, `max=maxAvailable`. Initial value computed as `min(5, maxAvailable)`.
- A small hint element displays "You can choose up to X rounds based on selected categories" with translation keys updated.

Language change flow
- If a user attempts to change language mid-game, LanguageSwitcher opens a confirmation dialog.
- On confirm:
  - IndexedDB game session store is cleared (via GamePersistenceService).
  - Navigation happens to home page with the new locale param.
- This avoids partial state mismatches where a game uses mixed-locale profiles/translations.

### Tests and QA

- Unit tests updated across hooks and store modules to reflect removal of legacy
functions and new manifest behavior.
- Updated 22 test files across unit and integration suites.
- Added end-to-end test `profile-randomness-and-limits.e2e.ts` to assert:
  - No duplicate profiles in a single game session.
  - Rounds input clamps and displays correct hints.
  - Language change dialog clears session and redirects.

## Challenges and Solutions

1. Migration safety and data verification
   - Challenge: Risk of data loss during reorganization and ensuring canonical 
slugs were correct.
   - Solution: Migration script runs sanity checks and produces a summary 
(counts per category/locale). Also implemented idempotent mode so it can be 
re-run safely.

2. Backwards compatibility with older service worker rules
   - Challenge: Existing users might have cached legacy `profiles.json` files 
and the SW rules had to remain safe during rollout.
   - Solution: Kept NetworkFirst fallback for legacy files and added a migration
plan to remove them in a follow-up release.

3. Ensuring even distribution without introducing bias
   - Challenge: Naive selection could bias small categories or introduce 
duplicates.
   - Solution: Implemented proportional round-robin selection followed by 
Fisher-Yates shuffle to ensure fairness and randomness.

4. Avoiding overfetch/prefetch churn
   - Challenge: Prefetching too many categories (or on hover) increased 
bandwidth without UX benefit.
   - Solution: Centralized prefetch config to a small set of popular categories 
per locale and removed hover-based prefetch.

## Hotfix: Language change confirmation dialog showing on home page

- Bug Fix: Language change confirmation dialog showing incorrectly on home page
- Root cause: `useGamePlayLogic` hook attempted to reload a deleted session during Astro view transitions, causing the confirmation dialog to trigger when not in an active game.
- Solution: Added a mismatch check between the sessionId in the URL and the `id` in the store to prevent loading the session during Astro view transitions. Also added an additional guard in the error detection useEffect to ignore errors that occur while a session id mismatch is present.
- Files modified:
  - `src/hooks/useGamePlayLogic.ts` — added id mismatch checks in the loading and error detection useEffects to avoid reloading/deleting during transitions
  - `src/components/LanguageSwitcher.tsx` — manual store reset with `id: ''`, `status: 'pending'` and explicit delete from IndexedDB when confirming language change
- Tests: All tests passing (102 tests)

## QA Results

- Lint: Clean
- Typecheck: Clean
- Unit Tests: 1080 / 1080 passing
- E2E Tests: 80 / 80 passing
- Build: Successful

Performance
- Average payload reduction: ~73.45% (target was 50%)
  - English: 72.86%
  - Spanish: 73.86%
  - Portuguese: 73.63%

## How to Test Locally

1. Run migration locally (dry-run first):
   node scripts/migrate-to-category-first.mjs --dry-run
2. Run full QA: pnpm run complete-check
3. Start dev server and simulate game flows verifying:
   - Category selection loads only the selected category data
   - Rounds input clamps and shows hint
   - Language switch prompts when a game is active
   - New manifest reads correctly in dev and production

## Rollout Notes

- Service worker cache TTLs are conservative—monitor post-deploy for missing 
manifests or data requests.
- Plan removal of legacy `profiles.json` and network rules in a follow-up 
release after sufficient adoption.

## Files touched (excerpts)

- Created: `src/lib/manifest.ts`, `scripts/migrate-to-category-first.mjs`, 
`scripts/validate-performance.mjs`, `public/data/manifest.json`, 
`e2e/tests/profile-randomness-and-limits.e2e.ts`
- Modified: ~40 files including hooks, components, translations, tests, and 
`astro.config.mjs`


Recorded by: basic-memory-specialist
PR: https://github.com/trystan2k/perfil/pull/62