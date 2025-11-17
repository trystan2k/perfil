# Task 27 — Persist Language Across Game and Keep Language Selector Visible on All Screens

Date: 2025-11-17
Status: Done

## Summary
Implemented centralized i18n state with persistence and ensured the language selector (LanguageSwitcher) is visible on all pages via the global layout. This change guarantees the selected locale is persisted across navigation and page refreshes, and that translation data and localized JSON assets are loaded according to the persisted locale.

## Implementation Details / Development Log
- Created a persistent i18n store using Zustand (`src/stores/i18nStore.ts`) with the `persist` middleware. The store:
  - Persists only the `locale` field to localStorage under the key `perfil-i18n` (using `partialize` to keep stored payload minimal and clean).
  - Defaults to FALLBACK_LOCALE (`en`) when nothing is persisted.
  - Provides API to set the locale from UI or programmatic flows.

- Integrated the store with the UI:
  - Updated `src/components/LanguageSwitcher.tsx` to use `i18nStore` instead of local component state.
  - LanguageSwitcher now calls the store's `setLocale()` and `i18n.changeLanguage()` to ensure immediate UI updates and centralized state.
  - Removed duplicate LanguageSwitcher from `src/pages/index.astro` and placed a single instance in the global `src/layouts/Layout.astro` header (sticky) so it is visible across all pages.

- Implemented bidirectional synchronization between Zustand store and i18next:
  - `src/components/I18nProvider.tsx` was updated to perform initial sync (rehydrate from storeLocale or fallback to provided locale prop).
  - Added listeners to i18next's `languageChanged` event to update the store when language changes originate from i18next.
  - Subscribed to store locale changes to call `i18n.changeLanguage()` when the store is updated by other parts of the app.
  - This prevents divergence and keeps both i18next and the persisted store in sync.

- Data loading and caching:
  - `src/hooks/useProfiles.ts` already reads `i18n.language` dynamically; no changes required.
  - Query keys in TanStack Query include `locale` to scope caches to the selected language.
  - Profile data continues to be fetched from `/data/{locale}/profiles.json` and now respects the persisted locale on load.

## Files Created / Modified
- NEW: src/stores/i18nStore.ts
- NEW: src/stores/__tests__/i18nStore.test.ts (14 unit tests)
- NEW: e2e/tests/language-persistence.e2e.ts (7 e2e tests)
- MODIFIED: src/components/LanguageSwitcher.tsx
- MODIFIED: src/components/I18nProvider.tsx
- MODIFIED: src/layouts/Layout.astro (LanguageSwitcher placed in sticky header)
- MODIFIED: src/pages/index.astro (duplicate LanguageSwitcher removed)

## Tests
- Unit tests (i18nStore): 14 tests covering:
  - Initialization behavior
  - setLocale API
  - Persistence to localStorage
  - Rehydration and fallback logic

- E2E tests: 7 tests covering:
  - Default language behavior
  - Explicit language change flows
  - Persistence across navigation and refresh
  - Correct data fetching for the selected locale
  - Visibility of LanguageSwitcher on all pages

## Technical Decisions
- Used Zustand `persist` middleware to align with existing `gameStore` patterns and keep persistence approach consistent across stores.
- Implemented bidirectional sync between Zustand and i18next to avoid race conditions and ensure a single source of truth for locale.
- Placed the LanguageSwitcher in a sticky header within the global layout to meet the acceptance criterion of being visible across all pages.
- Used `partialize` in persist middleware to only store `locale` (keeps localStorage clean and future-proof).

## Challenges & Resolutions
- Duplicate LanguageSwitcher on home page:
  - Root cause: LanguageSwitcher instance remained in `index.astro` while also being added to `Layout.astro`.
  - Fix: Removed the instance from `index.astro`, leaving only the global instance in `Layout.astro`.

- Keeping i18next and Zustand store synchronized:
  - Root cause: Two independent sources of truth could diverge on language changes.
  - Fix: Implemented event listeners in `I18nProvider` for `languageChanged` and for store updates to call `i18n.changeLanguage()` accordingly, enabling bidirectional sync.

## Acceptance Criteria (met)
- LanguageSwitcher renders in the global Layout and is visible across all pages. ✅
- Selected locale is stored centrally in a persisted store and rehydrated on load. ✅
- React islands (components) load translations and localized JSON data using the persisted locale. ✅
- Changing language updates the UI immediately and persists across navigation/refresh. ✅
- Unit and E2E tests cover the persistence and visibility requirements. ✅

## QA Results
- Lint: ✅ Pass
- Typecheck: ✅ Pass
- Unit Tests: ✅ All (295 tests in suite passed; includes the 14 new i18n store tests)
- Build: ✅ Successful
- Commit: 63ec685

## Notes / Follow-ups
- The persisted localStorage key is `perfil-i18n`. If future stores are added to the same persist middleware, ensure keys and partialize rules remain clear to avoid accidental shared payloads.
- No changes required to `useProfiles.ts` due to already dynamic i18n usage, but monitor data cache behavior if more locales are added.

---

Development log generated and saved to basic-memory and exported to project dev logs.
