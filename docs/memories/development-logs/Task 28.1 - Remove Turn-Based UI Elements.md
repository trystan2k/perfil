---
title: Task 28.1 - Remove Turn-Based UI Elements
type: note
permalink: development-logs/task-28-1-remove-turn-based-ui-elements
---

# Task 28.1: Remove Turn-Based UI Elements from GamePlay Component

## Date
2025-11-14 17:48

## Status
In Progress - Implementation complete, tests need updating

## Changes Made

### GamePlay.tsx Component Changes

1. **Removed `passTurn` action reference** (line 34)
   - Removed from store selectors

2. **Removed Active Player Section** (lines 278-284)
   - Deleted the entire "Active Player Section" div showing whose turn it is
   - Removed `activePlayer` variable calculation (line 164)

3. **Removed Pass Button** (lines 322-324)
   - Deleted "Pass" button from MC Controls section

4. **Removed Active Player Highlighting** (line 343)
   - Changed button variant from conditional `player.id === currentTurn.activePlayerId ? 'default' : 'outline'` to always `'outline'`
   - All players now have the same visual appearance

## Test Failures (Expected)

Tests that need updating:
1. "should render game play UI when game is active" - expects "Current Player" text
2. "should display the active player name" - expects active player in text-3xl element
3. "should display Unknown Player when active player is not found" - expects this text
4. "should update displayed player when turn is passed" - turn-based test
5. "should render Pass button" - expects Pass button
6. "should call passTurn action when button is clicked" - expects passTurn
7. "should update displayed player after passing turn" - turn-based test
8. "should cycle through all players when passing turn multiple times" - turn-based test
9. "should auto-skip to next profile when all players pass" - turn-based test
10. "should not affect cluesRead when passing turn" - turn-based test

## Next Steps

1. Update GamePlay.test.tsx to remove turn-based test expectations
2. Verify all component tests pass
3. Mark subtask as done


## Tests Updated

Successfully updated all tests in GamePlay.test.tsx:

1. **Removed "Active Player Display" describe block** - 3 tests removed
   - "should display the active player name"
   - "should display Unknown Player when active player is not found" 
   - "should update displayed player when turn is passed"

2. **Removed "Pass Button" describe block** - 6 tests removed
   - "should render Pass button"
   - "should call passTurn action when button is clicked"
   - "should update displayed player after passing turn"
   - "should cycle through all players when passing turn multiple times"
   - "should auto-skip to next profile when all players pass"
   - "should not affect cluesRead when passing turn"

3. **Updated player highlighting tests**
   - Changed "should highlight active player button with default variant" to "should display all players with outline variant (no turn highlighting)"
   - Removed "should display non-active players with outline variant" (redundant)

4. **Removed "Current Player" text expectations**
   - Updated "should render game play UI when game is active" test

## Quality Check Results

✅ All tests passing (52 tests in GamePlay.test.tsx)
✅ Lint: No issues
✅ Type check: No errors
✅ Test coverage: Passing
✅ Build: Successful

## Status
Complete - Ready for review