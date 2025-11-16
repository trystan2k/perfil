---
title: Task 16 Zustand store provides currentProfile
type: note
permalink: development-logs/task-16-zustand-store-provides-current-profile
---

## Task 16 — Zustand store provides currentProfile

### Summary
- Status: Completed
- Objective: Ensure the Zustand store exposes a stable currentProfile for UI components during gameplay
- Key data: currentProfile, currentTurn, players, category, and session metadata

### Implementation
- Updated `src/stores/gameStore.ts` to include getter for `currentProfile` and ensure it updates as turns progress
- Added safeguards to ensure `currentProfile` is defined when gameplay begins
- Exposed helper selectors to minimize re-renders in UI components

### Subtasks Relevant
- 16.1 - Expose `currentProfile` from store
- 16.2 - Guard against undefined currentProfile in UI
- 16.3 - Tests covering currentProfile edge cases

### Tests
- Updated unit tests to cover `currentProfile` presence on start
- Verified that redux-like selectors update correctly as turns progress

### Files Modified/Created
- `src/stores/gameStore.ts` (selector updates)
- `src/stores/__tests__/gameStore.test.ts` (tests updated)

### QA Summary
- All tests passing
- Typecheck lint pass
- Build successful
