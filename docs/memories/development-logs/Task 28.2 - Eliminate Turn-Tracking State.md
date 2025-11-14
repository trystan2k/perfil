---
title: Task 28.2 - Eliminate Turn-Tracking State
type: note
permalink: development-logs/task-28-2-eliminate-turn-tracking-state
---

# Task 28.2: Eliminate Turn-Tracking State and Actions from Zustand Store

## Date
2025-11-14 18:16

## Status
In Progress - Analysis complete

## Analysis

### Current Turn Structure (TurnState)
```typescript
{
  profileId: string,          // Keep - identifies current profile
  activePlayerId: string,     // REMOVE - tracks whose turn it is
  cluesRead: number,          // Keep - tracks game progression
  revealed: boolean,          // Keep - tracks if answer was revealed
  passedPlayerIds: string[]   // REMOVE - tracks who passed their turn
}
```

### Items to Remove

1. **From TurnState schema** (models.ts line 32-38):
   - `activePlayerId: z.string()`
   - `passedPlayerIds: z.array(z.string()).default([])`

2. **From GameState interface** (gameStore.ts line 18):
   - `passTurn: () => void` action

3. **From initialState exclusion list** (gameStore.ts line 31):
   - `| 'passTurn'`

4. **passTurn action implementation** (gameStore.ts ~line 335):
   - Entire function body

5. **References to activePlayerId and passedPlayerIds throughout store**:
   - Line 221: Finding active player in skipProfile
   - Line 236: Setting activePlayerId in skipProfile
   - Line 303: Setting activePlayerId in startGame
   - Line 306: Initializing passedPlayerIds in startGame
   - Line 347: Finding active player in passTurn
   - Line 355-359: Managing passedPlayerIds in passTurn
   - Line 376-379: Setting activePlayerId and passedPlayerIds in passTurn

## Implementation Plan

1. Update TurnState schema in models.ts
2. Remove passTurn from GameState interface
3. Remove passTurn action implementation
4. Remove activePlayerId logic from startGame
5. Remove activePlayerId logic from skipProfile
6. Update store tests to reflect changes
7. Verify no other components reference turn-related state


## Implementation Complete

### Changes Made

1. **models.ts - TurnState schema** (line 32-38)
   - Removed `activePlayerId: z.string()`
   - Removed `passedPlayerIds: z.array(z.string()).default([])`

2. **gameStore.ts - GameState interface** (line 18)
   - Removed `passTurn: () => void`

3. **gameStore.ts - initialState exclusion**  (line 31)
   - Removed `| 'passTurn'` from exclusion list

4. **gameStore.ts - startGame** (lines 272-291)
   - Removed random player selection logic
   - Removed `activePlayerId` from currentTurn initialization
   - Removed `passedPlayerIds` initialization

5. **gameStore.ts - advanceToNextProfile helper** (lines 217-239)
   - Removed next player calculation logic
   - Removed `activePlayerId` from currentTurn
   - Removed `passedPlayerIds` reset

6. **gameStore.ts - passTurn action** (lines 319-365)
   - Removed entire function implementation

## Test Failures

39 test failures related to:
1. Tests expecting `passTurn` method to exist
2. Tests expecting `activePlayerId` property
3. Tests expecting `passedPlayerIds` property
4. Tests trying to award points to `activePlayerId` (which doesn't exist)

## Next Steps

Update gameStore.test.ts to:
1. Remove all `passTurn` related tests
2. Remove all `passedPlayerIds` tracking tests
3. Remove all `activePlayerId` expectations
4. Update `awardPoints` tests to use actual player IDs instead of activePlayerId


## Current Status

### Store Implementation: ✅ Complete
All turn-related code has been successfully removed from:
- models.ts (TurnState schema)
- gameStore.ts (interface, initial state, startGame, advanceToNextProfile, passTurn action)

### Test File Updates: 🔄 In Progress
The test file has 91 type errors that need to be fixed:
1. **Remove entire describe blocks**:
   - `describe('passTurn', ...)` (~130 lines, 8 tests)
   - `describe('Pass Tracking and Auto-Skip', ...)` (~140 lines, 9 tests)

2. **Update tests that reference activePlayerId**:
   - startGame tests (2 tests)
   - awardPoints tests (10+ tests) - need to use first player ID instead of activePlayerId
   - skipProfile tests (1 test)
   - Profile management tests (multiple)
   - endGame tests

3. **Remove passedPlayerIds expectations**:
   - Multiple tests check for passedPlayerIds array
   - These need to be removed

This is a large refactoring that requires systematic updates to ~50 test cases.