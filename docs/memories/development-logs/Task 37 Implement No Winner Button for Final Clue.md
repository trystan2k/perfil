# Task 37 — Implement "No Winner" Button for Final Clue

Date: 2025-11-18

## Task Overview

Add a "No Winner" button that appears when the final clue for a profile is revealed, allowing players to skip the profile without awarding points. This lets the game progress to the next profile (or complete the game if it was the last profile) while preserving player scores.

## Implementation Details

- Store Action (skipProfileWithoutPoints):
  - Added a new action in src/stores/gameStore.ts named `skipProfileWithoutPoints`.
  - This action advances to the next profile without modifying player scores.
  - It reuses the existing `advanceToNextProfile` helper which automatically completes the game if the skipped profile was the last one.
  - Returns a Promise for consistency with other async actions such as `awardPoints`.

- UI Component:
  - Updated src/components/GamePlay.tsx to detect when the final clue is revealed using the condition `currentTurn.cluesRead === currentProfile.clues.length`.
  - When that condition is true, the component conditionally renders a single "No Winner" button instead of the usual player award buttons.

- Button Handler:
  - Added `handleNoWinner` in GamePlay which calls `skipProfileWithoutPoints` on the store.
  - The store handles advancing the profile and any navigation/persistence side-effects.

- Persistence:
  - No additional persistence logic required. The change leverages the existing persistence middleware already used by the store.

- Navigation:
  - Navigation to the scoreboard on game completion is handled by the existing useEffect hook in GamePlay that observes game status becoming `"completed"`.

- Translations:
  - Added a `noWinnerButton` translation key in the English, Spanish, and Portuguese-BR translation files under public/locales/*/translation.json.

## Files Modified

- src/stores/gameStore.ts (added `skipProfileWithoutPoints` action)
- src/components/GamePlay.tsx (updated imports, final-clue detection logic, conditional rendering, `handleNoWinner` handler)
- public/locales/en/translation.json (added `noWinnerButton` translation)
- public/locales/es/translation.json (added `noWinnerButton` translation)
- public/locales/pt-BR/translation.json (added `noWinnerButton` translation)

## Testing

- All 310 existing tests continue to pass.
- Code coverage remained at 90.72% (above the 80% threshold).
- Lint and typecheck: 0 errors.
- Build: successful and all assets generated.

## Key Design Decisions

- Reused the existing `advanceToNextProfile` helper to avoid duplicating navigation/completion logic.
- Followed the same pattern as the existing `skipProfile` action to keep store API consistent.
- Made `skipProfileWithoutPoints` return a Promise to match the async behavior of `awardPoints` and other store actions.
- Conditional rendering ensures a clear UX: player award buttons appear for normal clues, and the single "No Winner" button appears only for the final clue of a profile.
- Leveraged existing navigation and persistence infrastructure rather than adding bespoke logic.

## Development Log (step-by-step)

1. Implemented `skipProfileWithoutPoints` in src/stores/gameStore.ts, reusing `advanceToNextProfile` and ensuring a Promise-based API.
2. Updated src/components/GamePlay.tsx to detect final clue reveal and added `handleNoWinner` which calls the new store action.
3. Added translation keys in public/locales/en/translation.json, public/locales/es/translation.json, and public/locales/pt-BR/translation.json.
4. Ran the full test suite and QA scripts (`pnpm run complete-check`) — all checks passed.
5. Verified coverage, lint, typecheck, and build outputs.

## Status

✅ Complete — Task #37 fully implemented and tested.

---

This entry was recorded in the project's basic memory store and exported to docs/memories/development-logs/ for traceability.
