---
title: Task 29.2 - Update Game State with Round Logic and Distribution Algorithm
type: note
permalink: development-logs/task-29-2-update-game-state-with-round-logic-and-distribution-algorithm
---

## Task Development #29.2
**Date**: 2025-11-14_19:45:30
**Title**: Update Game State with Round Logic and Distribution Algorithm

### Summary
- Status: Completed
- Approach used: Extended game state to track rounds and created distribution algorithm
- Time spent: ~40 minutes

### Implementation
- Modified files:
  - `src/stores/gameStore.ts` - Added round state and distribution algorithm
  - `src/lib/gameSessionDB.ts` - Extended PersistedGameState interface
  - `src/components/CategorySelect.tsx` - Pass numberOfRounds to startGame
  - All test files - Updated mocks to include new state fields

### Changes Made
1. Extended GameState interface with:
   - `numberOfRounds: number` - Total rounds to play
   - `currentRound: number` - Current round (1-based)
   - `roundCategoryMap: string[]` - Category for each round

2. Created `generateRoundPlan()` function:
   - Single category: repeats category for all rounds
   - Multiple categories: uses round-robin distribution for even spread
   - Ensures minimal category repetition when rounds >> categories

3. Updated `startGame()` method:
   - Accepts optional `numberOfRounds` parameter (default: 1)
   - Extracts unique categories from selected profiles
   - Calls `generateRoundPlan()` to create round-category mapping
   - Initializes `currentRound` to 1

4. Updated `createGame()` to initialize new fields

5. Extended `PersistedGameState` interface in gameSessionDB

6. Updated `buildPersistedState()` to persist new fields

7. Updated CategorySelect to pass `numberOfRounds` to `startGame()`

8. Fixed all test mocks (5 test files) to include new required fields

### Distribution Algorithm Logic
- **Single Category**: Simple repetition
  - Example: 5 rounds, [Movies] → [Movies, Movies, Movies, Movies, Movies]
  
- **Multiple Categories**: Round-robin distribution
  - Example: 5 rounds, [Movies, Sports, History] → [Movies, Sports, History, Movies, Sports]
  - Distributes evenly, cycles through categories in order
  - Minimizes repeats when rounds > categories

### Observations
- All existing functionality preserved - numberOfRounds defaults to 1
- Distribution algorithm is simple and predictable
- State properly persisted to IndexedDB
- All 265 tests passing
- All QA checks clean (lint, typecheck, tests, build)

### Next Steps
- Subtask 3: Write unit tests for the distribution algorithm