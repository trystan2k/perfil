---
title: Task 28 - Remove Player Turn UI System
type: note
permalink: development-logs/task-28-remove-player-turn-ui-system
---

## Task 28 — Remove Player Turn UI System

Systematic removal of turn-based system to enable free-for-all scoring where MC can award points to any player at any time.

### 28.1 - Remove Turn-Based UI Elements from GamePlay Component
- Removed "Active Player Section" showing whose turn it is
- Removed "Pass" button from MC Controls
- Changed all player buttons to outline variant (no active player highlighting)
- Removed 9 turn-based tests
- All 52 tests passing after cleanup

### 28.2 - Eliminate Turn-Tracking State and Actions from Zustand Store
- Removed activePlayerId and passedPlayerIds from TurnState schema
- TurnState now only contains: profileId, cluesRead, revealed
- Removed passTurn action (~50 lines)
- Removed turn rotation logic from advanceToNextProfile
- Removed 17 turn-based tests
- All 256 tests passing

### 28.3 - Verify MC Player-Tapping Interaction is Always Active
- Verified player buttons always enabled (after first clue)
- No turn restrictions on tapping players
- Added test: "should allow MC to tap different players across multiple profiles"
- All buttons use outline variant equally

### 28.4 - Decouple awardPoints Action from Turn Logic
- Confirmed awardPoints is independent of turn sequencing
- No activePlayerId or passedPlayerIds references
- Only updates player score and advances to next profile
- 10 existing tests verify free-for-all scoring

### 28.5 - End-to-End Test of Free-for-All Scoring Flow
- Added 3 E2E tests:
  1. Complete full game with free-for-all scoring
  2. Award points to same player multiple times
  3. UI scores update in real-time
- All 260 tests passing

### Key Changes
- TurnState simplified from 5 properties to 3
- MC can tap ANY player at ANY time (after first clue)
- No turn constraints or rotation
- Player buttons always outline variant
- Free-for-all implementation complete

### QA Results
- ✅ Tests: 260 passing (4 new, 17 removed)
- ✅ Coverage: 93.76%
- ✅ Lint: Clean
- ✅ Typecheck: Clean (0 errors)
- ✅ Build: Successful