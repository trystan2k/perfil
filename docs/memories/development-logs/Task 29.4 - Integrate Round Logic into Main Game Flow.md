---
title: Task 29.4 - Integrate Round Logic into Main Game Flow
type: note
permalink: development-logs/task-29-4-integrate-round-logic-into-main-game-flow
---

## Task Development #29.4
**Date**: 2025-11-14_20:04:15
**Title**: Integrate Round Logic into the Main Game Flow

### Summary
- Status: Completed
- Approach used: Updated advanceToNextProfile and GamePlay component to respect rounds
- Time spent: ~30 minutes

### Implementation
- Modified files:
  - `src/stores/gameStore.ts` - Updated advanceToNextProfile to check rounds and increment currentRound
  - `src/components/GamePlay.tsx` - Added round display in UI
  - `public/locales/en/translation.json` - Added roundInfo translation
  - `public/locales/pt-BR/translation.json` - Added roundInfo translation (Portuguese)
  - `public/locales/es/translation.json` - Added roundInfo translation (Spanish)
  - `src/stores/__tests__/gameStore.test.ts` - Fixed tests to specify numberOfRounds
  - `src/components/__tests__/GamePlay.test.tsx` - Fixed tests to specify numberOfRounds

### Changes Made
1. Updated `advanceToNextProfile()` function:
   - Added check for `currentRound >= numberOfRounds` to end game
   - Increments `currentRound` when advancing to next profile
   - Maintains backward compatibility with profile count check

2. Updated GamePlay UI:
   - Added `numberOfRounds` and `currentRound` state selectors
   - Display round info in CardDescription (e.g., "Round 2 of 5")
   - Only shows round info when `numberOfRounds > 1` (clean UI for single-round games)

3. Added translations for round display:
   - English: "Round {{current}} of {{total}}"
   - Portuguese: "Rodada {{current}} de {{total}}"
   - Spanish: "Ronda {{current}} of {{total}}"

4. Fixed all test files:
   - Updated `startGame()` calls to specify number of rounds
   - Tests with 2 profiles now call `startGame(['1', '2'], 2)`
   - Tests with 3 profiles now call `startGame(['1', '2', '3'], 3)`
   - Ensures tests complete all rounds they start

### Round Logic Behavior
- Each profile played = 1 round completed
- Game ends when `currentRound >= numberOfRounds` OR no more profiles
- Round counter increments after each profile (via awardPoints or skipProfile)
- Backward compatible: defaults to 1 round if not specified

### Observations
- All 273 tests passing
- Round display is conditional and doesn't clutter single-round UI
- Logic properly enforces round limits
- All QA checks clean (lint, typecheck, tests, build)

### Next Steps
- Subtask 5: Implement E2E test for complete rounds flow