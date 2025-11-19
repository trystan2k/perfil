# Task 25 — Implement Global Error States for Game Flow

Date: 2025-11-20
Author: basic-memory-specialist (automated log)

## Summary
Implemented a centralized/global error state and UI overlay to handle critical game flow errors across the app. Post-review we refined the error shape and recovery behavior: the error payload changed from { message, recoveryPath? } to { message, informative? } where the informative flag indicates whether the error is informational (user can dismiss with Back) or critical (requires navigation to home). ErrorStateProvider was updated to use this flag and to render contextual button text and recovery behavior. Dialog handling was hardened to avoid Radix UI edge cases. All components were migrated to the global error approach and local error state removed where appropriate. Tests were updated to reflect the new behavior (325 tests passing).

## Implementation Details
- Changed global error state shape in the store from { message: string; recoveryPath?: string } | null to { message: string; informative?: boolean } | null
- `informative` flag semantics:
  - informative: true  => informational error (user can dismiss; "Back" button) — clears global error without navigation
  - informative: false or undefined => critical error ("Go Home" button) — clears error and navigates to home on recovery
- Updated src/stores/gameStore.ts: error state type, setError(), clearError() APIs reflect new shape
- Updated ErrorStateProvider to read informative flag and to:
  - render button text: "Back" for informative errors, "Go Home" for critical errors
  - on recovery: either clear error (informative) or clear + navigate to home (critical)
- Removed local error state completely from GameSetup component (and ensured duplicate name validation now uses global error with informative: true)
- Updated CategorySelect and GamePlay to rely exclusively on the global error state for error UI
- Dialog hardening:
  - Added prevention handlers for onEscapeKeyDown and onPointerDownOutside to avoid unintentional dialog closure
  - Added onOpenChange handler to Dialog to work around Radix UI open/close edge cases
- Simplified translation handling in components and provider using t(key, { defaultValue }) so the store can continue holding i18n keys while the UI resolves to localized text flexibly
- Updated tests across unit, integration and e2e to reflect new error payload and recovery behavior

## Files Modified / Added
- src/stores/gameStore.ts (error state shape + actions updated)
- src/components/ErrorStateProvider.tsx (UPDATED) — uses informative flag for UI and recovery
- src/components/ErrorStateProviderWrapper.tsx (UPDATED)
- src/components/ui/dialog.tsx (ADDED handlers: onEscapeKeyDown/onPointerDownOutside/onOpenChange prevention)
- src/layouts/Layout.astro (integrated updated ErrorStateProvider)
- src/components/GameSetup.tsx (removed local error state, duplicate-name validation now uses global error with informative: true)
- src/components/CategorySelect.tsx (global error integration adjustments)
- src/components/GamePlay.tsx (global error integration adjustments)
- src/components/PreviousCluesDisplay.tsx (i18n tweaks)
- public/locales/en/translation.json (updated/added keys and default values)
- public/locales/es/translation.json (updated)
- public/locales/pt-BR/translation.json (updated)
- e2e/tests/error-handling.e2e.ts (UPDATED)
- Unit & integration tests updated across the codebase to match new behavior

## Translation Keys / Message Handling
- Error messages remain stored as i18n keys in the store (e.g. 'errorHandler.sessionNotFound') so the store is language-agnostic
- UI resolves messages using t(key, { defaultValue }) which provides flexible fallback and simplified translation logic
- Button labels are translated via keys: common.back (for informative errors), common.goHome (for critical recovery)

## Test and QA Results
- Unit & integration tests: 325 tests passing
- Coverage: unchanged (previously 92.46% unless a CI run updates it)
- QA checks: lint, typecheck, test:coverage, build — all passed locally after updates
- E2E updated to match the new error flow and Dialog behavior; tests stabilized after adjusting timing and preventing dialog closure events

## Key Design Decisions
- Keep store-level errors as i18n keys to keep the store language-agnostic and ensure deterministic tests
- Use `informative?: boolean` instead of `recoveryPath` to simplify recovery semantics: either dismiss or navigate home. This reduces coupling between store and routing concerns.
- Dialog event prevention (onEscapeKeyDown/onPointerDownOutside) avoids accidental overlay closures and Radix UI issues encountered during review
- onOpenChange handler added to Dialog to ensure the component remains controlled and to prevent toggling glitches
- Translation simplified with t(key, { defaultValue }) to reduce duplication of fallback logic across components

## Development Log (step-by-step)
1. Reviewed original Task 25 implementation and the post-review feedback notes.
2. Planned the post-review changes focusing on: error payload shape change, recovery semantics, Dialog hardening, translation simplification, and test updates.
3. Updated src/stores/gameStore.ts to change the error type to { message: string; informative?: boolean } | null and adjusted setError/clearError signatures and usages.
4. Updated ErrorStateProvider to:
   - Use informative flag to determine button text and recovery handler
   - Implement recovery handler: if informative -> clearError(); else -> clearError() + navigate to home
   - Resolve i18n keys using t(key, { defaultValue })
   - Add prevention for onEscapeKeyDown and onPointerDownOutside and an onOpenChange handler for robust dialog behavior
5. Removed local error state from GameSetup and changed duplicate-name validation to call setError({ message: 'profiles.duplicateName', informative: true })
6. Removed any remaining recoveryPath usage and updated code paths that previously supplied recoveryPath to instead set informative appropriately
7. Updated src/components/ui/dialog.tsx to expose prevention hooks and onOpenChange to callers. Ensured the Dialog remains accessible while preventing accidental closures in the error overlay case.
8. Updated Layout.astro to mount the updated ErrorStateProvider globally
9. Simplified translation calls across affected components to use t(key, { defaultValue }) and validated message fallbacks
10. Ran and updated unit and integration tests to reflect the new error shape and behaviors. Adjusted expectations around recovery navigation and button labels.
11. Updated E2E error-handling tests to account for Dialog prevention handlers and the new recovery behavior; stabilized timing/wait usage.
12. Ran the full QA pipeline (lint, typecheck, test, coverage, build) and iterated on minor test fixes until clean.
13. Final verification: tests passing (325), translations resolving with defaults, Dialog behaving robustly in error scenarios.

## Notes and Follow-ups
- The informative flag simplifies recovery semantics but removes the ability for fine-grained navigation recovery paths; if future tasks require per-error recovery destinations, we can reintroduce a structured metadata field in the store (e.g., recoveryAction) while keeping the current simplified default behavior.
- Keep an eye on any future Radix UI upgrades which might make some of the Dialog workarounds unnecessary.

---

This memory entry documents the full development log and post-review changes for Task 25 (Implement Global Error States for Game Flow).
