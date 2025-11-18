# Task 35 Fix Last Round Scoring Bug

Date: 2025-11-18

Summary
- Title: Task 35 Fix Last Round Scoring Bug
- Purpose: Ensure points awarded on the final round are reliably persisted before navigation to the scoreboard so they are not lost due to a race condition between state updates and IndexedDB persistence.

1) Problem
- Points awarded on the final round weren't persisted. This occurred because the app navigated to the scoreboard before the async persistence to IndexedDB completed, resulting in the last-round points being lost.

2) Root cause
- persistState() is debounced and fires asynchronously. When awardPoints() finishes and sets the game status to `completed`, a useEffect detected the status change and triggered navigation to the scoreboard before persistence finished. This race caused the final point updates not to be saved.

3) Solution implemented
- Modified `awardPoints()` to return a Promise that resolves when persistence completes. This ensures callers can await the persistence lifecycle.
- Updated `GameState` interface/types to reflect that `awardPoints` now returns `Promise<void>` (signature change documented in store types).
- Modified `handleContinueToNextProfile` in `GamePlay` to `await awardPoints()` before allowing any further state changes or navigation when the status becomes `completed`.
- Added a 100ms delay to the auto-navigation useEffect as a safety net to allow persistence to complete even if there are timing variations.
- Added an E2E test that reproduces the race condition by simulating awarding points on the final round and verifying that the scoreboard shows the persisted final points. The test asserts the bug is fixed.

4) Files modified
- src/stores/gameStore.ts
  - Changed awardPoints() implementation to return a Promise that resolves after persistState completes.
  - Updated GameState types to reflect the new signature.
- src/components/GamePlay.tsx
  - Updated handleContinueToNextProfile to await awardPoints() and only proceed with navigation after persistence is confirmed.
- e2e/tests/game.e2e.ts
  - Added an end-to-end test that reproduces the race and asserts final round points persist and display on the scoreboard.

5) QA results
- All tests passing: 310 tests total
- Lint: clean
- Typecheck: clean
- Build: successful

6) Implementation approach
- Goal: make persistence explicit/awaitable and prevent navigation from racing ahead of persistence.
- Strategy: have awardPoints return a Promise resolved after the store persistence completes; callers awaiting that promise guarantees state is persisted before triggering side effects (navigation).
- Rationale: minimal, clear change surface focused on synchronization rather than refactoring persistence system or removing debouncing.

Development log / steps taken
- 2025-11-18 09:15 — Reproduced bug locally and wrote failing E2E test to capture the race condition.
- 2025-11-18 10:00 — Investigated store persistence and located persistState() debounce behavior.
- 2025-11-18 10:30 — Implemented awardPoints to return a Promise that resolves after persistence completes; updated types.
- 2025-11-18 11:00 — Updated GamePlay handleContinueToNextProfile to await awardPoints before allowing navigation.
- 2025-11-18 11:30 — Ran full test suite; initially fixed failing E2E, then iterated small fixes to avoid TypeScript errors and ensure proper typing.
- 2025-11-18 12:20 — Final QA: ran pnpm run complete-check (lint, typecheck, tests, build) — all checks clean; total tests: 310.

Notes / Follow-ups
- Consider documenting the persistence contract in the store README or comments so future contributors know persistence may be asynchronous and which APIs should be awaited.
- If persistence remains debounced for performance reasons, prefer exposing an explicit awaitable hook for critical flows (end-of-game, profile switching) rather than changing debounce behavior globally.

Recorded by: basic-memory specialist
