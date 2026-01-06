---
title: Task 101 Add skip profile button to game screen
type: note
permalink: development-logs/task-101-add-skip-profile-button-to-game-screen
tags:
- development-log
- task-101
---

# Task 101 — Add skip profile button to game screen

## Task Overview
- **Task ID**: 101
- **Title**: Add skip profile button to game screen
- **Status**: Done
- **Implementation Date**: 2026-01-06

## Implementation Approach
Implemented an unconditional "Skip profile" button in the GamePlayClueSection UI and wired it to the game logic via the existing `useGamePlayLogic` hook. The handler (`handleSkipProfile`) advances the active profile without awarding points and updates game state accordingly. The approach followed existing repository patterns for hooks, i18n, and component props to minimize scope and keep changes localized.

Why this approach:
- Minimal impact to existing game flow and state management.
- Reused existing hook (`useGamePlayLogic`) to centralize business logic.
- Kept UI changes confined to `GamePlay` and `GamePlayClueSection` for easy review and rollback if needed.

## Files Changed / Created
- `src/hooks/useGamePlayLogic.ts` (MODIFIED)
  - Added `skipProfileDialogOpen` state and `setSkipProfileDialogOpen` setter.
  - Implemented `handleSkipProfile` handler that advances to next profile without awarding points and performs necessary state updates.
  - Added guard to prevent double-skip race conditions and ensure idempotency.

- `src/components/GamePlay/GamePlayClueSection.tsx` (MODIFIED)
  - Added unconditional Skip button rendering.
  - Exposed props: `skipProfileButtonText?: string` and `onSkipProfile?: () => void`.
  - Ensured accessibility attributes (`aria-label`) and i18n usage for button text.

- `src/components/GamePlay.tsx` (MODIFIED)
  - Wired `handleSkipProfile` and localized text down to `GamePlayClueSection`.
  - Removed unused `SkipProfileDialog` import and references.

- `src/components/SkipProfileDialog.tsx` (CREATED - UNUSED)
  - Initial dialog component created during exploration but later unused. Marked for deletion in follow-up.

- `src/components/GamePlay/__tests__/GamePlayClueSection.test.tsx` (MODIFIED)
  - Added unit tests validating skip button presence, accessibility, click handling, and that the handler results in the expected state transitions (using a mocked hook/store where appropriate).

- `e2e/tests/skip-profile.e2e.ts` (CREATED)
  - End-to-end coverage for full skip flow from Game screen to next profile without awarding points. Includes edge cases such as skipping the last profile in a round.

## Tests Added
- Unit tests
  - `src/components/GamePlay/__tests__/GamePlayClueSection.test.tsx` — added tests covering:
    - Skip button renders unconditionally
    - Button contains correct localized label
    - Clicking the button calls the provided `onSkipProfile` handler
    - Accessibility: has an appropriate `aria-label` and is focusable
    - Handler behavior: ensures points are not awarded and the active profile index increments (using a mocked game hook/store)

- E2E tests
  - `e2e/tests/skip-profile.e2e.ts` — covers:
    - Full user flow: player presses Skip and the UI advances to the next profile
    - Validation that no points are awarded for skipped profiles
    - Edge case: skipping on the last profile of a round advances flow correctly (round end behavior)

Test results summary: local test suites passed after changes. At time of logging the project's full test suite reported: 146 passing tests (includes 4 new unit tests and the new E2E scenarios).

## Key Features Implemented
- Unconditional "Skip profile" button visible on the game screen.
- Centralized skip logic inside `useGamePlayLogic` via `handleSkipProfile` for consistency.
- i18n-compliant button label and accessibility attributes added.
- Unit and E2E tests covering UI and full flow.
- Guarding against double-skip and race conditions in the handler.

## Code Review Findings & Fixes Applied
During internal review the following items were raised and addressed:

1. Accessibility (a11y)
   - Finding: Initial button lacked an explicit `aria-label` for screen readers.
   - Fix: Added `aria-label` using the same i18n string as the visible label and ensured keyboard focus works as expected.

2. Unused component
   - Finding: `SkipProfileDialog.tsx` was created during prototyping but never used.
   - Fix: Removed import usage from `GamePlay` and flagged the component for deletion. Kept the file in the branch temporarily to avoid accidental data loss; recommend follow-up deletion if not needed.

3. Race condition / double-skip
   - Finding: Clicking Skip multiple times quickly could trigger the handler twice and cause incorrect profile advancement.
   - Fix: Added a local guard/disabled state during the async transition inside `handleSkipProfile` to make it idempotent.

4. Test flakiness
   - Finding: Early E2E iterations showed flakiness due to timing on store updates.
   - Fix: Stabilized tests by waiting on the same state transition promises used in production code and by mocking timers where appropriate. Replaced arbitrary timeouts with deterministic waits for state changes.

5. i18n key usage
   - Finding: Button label initially used a literal string in one place.
   - Fix: Replaced with existing i18n key and ensured translations are present in the test environment.

All fixes were applied and corresponding tests were updated to cover the scenarios discovered during review.

## Notes / Known Limitations
- `src/components/SkipProfileDialog.tsx` exists in the branch but is unused; plan to remove it in a follow-up change.
- The skip action is immediate (no confirmation). This matches current product requirements; if a confirmation is later requested the dialog component can be repurposed.
- No change was made to persistent storage of game history; if future requirements require audit logging of skips, additional work will be needed.

## Pull Request
- PR: <TO BE ADDED - placeholder>

## Next Steps
- Delete unused `src/components/SkipProfileDialog.tsx` if not required.
- Merge branch after final review and CI verification.
- Update the PR link in this development log once the PR is created.