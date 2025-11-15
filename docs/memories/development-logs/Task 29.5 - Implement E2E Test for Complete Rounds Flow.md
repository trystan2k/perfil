---
title: Task 29.5 - Implement E2E Test for Complete Rounds Flow
type: note
permalink: development-logs/task-29-5-implement-e2-e-test-for-complete-rounds-flow
---

## Task Development #29.5
**Date**: 2025-11-14_20:07:45
**Title**: Implement End-to-End Test for the Complete Rounds Flow

### Summary
- Status: Completed
- Approach used: Created comprehensive E2E tests using Playwright to validate entire rounds flow
- Time spent: ~20 minutes

### Implementation
- Modified files:
  - `e2e/tests/game.e2e.ts` - Added 3 new E2E tests and updated 1 existing test
  - `e2e/tests/more.e2e.ts` - Updated 3 existing tests to include rounds selection step

### Tests Added/Updated

#### New E2E Tests (3):
1. **Complete N rounds with proper tracking**
   - Creates game with 3 players
   - Selects category and sets 3 rounds
   - Plays all 3 rounds, verifying round counter displays correctly
   - Validates game ends after exactly 3 rounds
   - Verifies all players appear in final scoreboard

2. **Back navigation from rounds selection**
   - Tests the Back button functionality
   - Verifies user can return from rounds screen to category selection
   - Ensures state is properly reset

3. **Shuffle All with multiple rounds**
   - Tests shuffle all flow with rounds selection
   - Sets 2 rounds and plays them
   - Validates round counter with shuffle all mode

#### Updated Existing Tests (4):
1. Updated "create game, select category, play round and finish" to include rounds selection
2. Updated "shuffle all flow" to include rounds selection step
3. Updated "skip profile and all-pass handling" to include rounds selection with 2 rounds
4. Updated "i18n switching" test to include Spanish rounds selection ("Número de Rondas")

### Test Scenarios Covered
- ✅ Full flow: players → category → rounds → gameplay → scoreboard
- ✅ Round counter display ("Round 1 of 3", "Round 2 of 3", etc.)
- ✅ Game ends after exactly N rounds
- ✅ Back navigation from rounds screen
- ✅ Shuffle All with rounds
- ✅ Multiple rounds with different players scoring
- ✅ Localized rounds selection (Spanish test)

### Observations
- All E2E tests validate the complete user journey
- Tests confirm rounds selection is mandatory (no way to bypass)
- Round counter displays correctly in UI
- Game respects round limits and ends appropriately
- All tests pass with new rounds functionality
- All QA checks clean (lint, typecheck, unit tests, build)

### Next Steps
- Task 29 complete: All 5 subtasks done
- Ready for final review and commit