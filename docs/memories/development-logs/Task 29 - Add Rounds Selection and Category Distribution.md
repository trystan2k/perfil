## Task Development #29
**Date**: 2025-11-14_20:08:00
**Title**: Add rounds selection after category selection and implement round-category distribution

### Summary
- Status: Completed
- Subtasks completed: 5/5 (100%)
- Total time spent: ~2.5 hours
- Approach: Incremental implementation with comprehensive testing at each step

### Overview
Implemented a complete rounds selection system allowing the MC to specify how many rounds to play after selecting a category. The game now plays exactly N rounds and distributes categories evenly when multiple categories are selected.

### All Subtasks Completed

#### Subtask 29.1: Create UI Component for Round Selection
- Modified CategorySelect to add two-step flow (category → rounds → start)
- Added rounds input with validation (1-50 range)
- Added Back button for navigation
- Translations in 3 languages (EN, PT-BR, ES)
- 5 new tests added

#### Subtask 29.2: Update Game State with Round Logic and Distribution Algorithm
- Extended GameState with numberOfRounds, currentRound, roundCategoryMap
- Created generateRoundPlan() distribution algorithm
- Updated startGame() to accept numberOfRounds parameter
- Extended PersistedGameState for IndexedDB storage
- Updated all test mocks (5 files)

#### Subtask 29.3: Write Unit Tests for Distribution Algorithm
- Added 8 comprehensive unit tests
- Covered single/multiple categories
- Tested edge cases (1 round, 100 rounds, etc.)
- Verified even distribution with round-robin

#### Subtask 29.4: Integrate Round Logic into Main Game Flow
- Updated advanceToNextProfile() to respect round limits
- Added round counter increment logic
- Updated GamePlay UI to display "Round X of Y"
- Fixed all existing tests to specify numberOfRounds
- Translations for round display

#### Subtask 29.5: Implement E2E Test for Complete Rounds Flow
- Added 3 new E2E tests
- Updated 4 existing E2E tests
- Validated complete user journey
- Tested round limits, navigation, and localization

### Files Modified (Summary)

**Core Implementation:**
- src/components/CategorySelect.tsx
- src/stores/gameStore.ts
- src/lib/gameSessionDB.ts
- src/components/GamePlay.tsx

**Translations (3 languages):**
- public/locales/en/translation.json
- public/locales/pt-BR/translation.json
- public/locales/es/translation.json

**Tests:**
- src/components/__tests__/CategorySelect.test.tsx
- src/stores/__tests__/gameStore.test.ts
- src/components/__tests__/GamePlay.test.tsx
- src/lib/__tests__/gameSessionDB.test.ts
- src/components/__tests__/Scoreboard.test.tsx
- src/hooks/__tests__/useGameSession.test.tsx
- e2e/tests/game.e2e.ts
- e2e/tests/more.e2e.ts

### Key Features Implemented

1. **Two-Step Category Selection Flow:**
   - Step 1: Select category or Shuffle All
   - Step 2: Choose number of rounds (1-50)
   - Back button to change selection

2. **Round Distribution Algorithm:**
   - Single category: Repeats category for all rounds
   - Multiple categories: Round-robin distribution
   - Example: 8 rounds, 3 cats → [A, B, C, A, B, C, A, B]

3. **Round Tracking:**
   - Displays "Round X of Y" in gameplay
   - Increments after each profile completion
   - Game ends when rounds complete

4. **Game End Condition:**
   - Ends when currentRound >= numberOfRounds
   - Also ends if profiles exhausted (backward compatible)

### Technical Decisions

1. **Component Integration**: Modified existing CategorySelect rather than creating new component (simpler, fewer moving parts)

2. **Distribution Strategy**: Round-robin for predictability and even spread

3. **Default Behavior**: numberOfRounds defaults to 1 for backward compatibility

4. **UI Display**: Only shows round info when numberOfRounds > 1 (clean UI)

### Test Coverage Summary
- **Unit Tests**: 273/273 passing (13 new tests added)
- **E2E Tests**: 7 total (3 new, 4 updated)
- **Distribution Tests**: 8 dedicated tests covering all scenarios
- **Coverage**: All code paths tested

### Commits Made
- All changes in single feature branch: feature/PER-29-add-rounds-selection
- Ready for commit after review

### Observations
- Implementation is clean, simple, and maintainable
- All acceptance criteria met:
  ✅ CategorySelect prompts for rounds count
  ✅ Rounds stored in game state
  ✅ Game plays exactly N rounds
  ✅ Distribution respects single/multiple categories
  ✅ Unit tests for distribution algorithm
  ✅ Integration tests for complete flow
- All QA checks passing (lint, typecheck, tests, build)
- No breaking changes to existing functionality
- Fully internationalized (3 languages)

### Future Enhancements
- Could add preset round options (Quick: 3, Normal: 5, Long: 10)
- Could show category distribution preview before starting
- Could allow changing rounds mid-game (stretch goal)
