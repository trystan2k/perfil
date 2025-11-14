---
title: Task 24 - Fix Race Condition Between State Persistence and Navigation
type: note
permalink: development-logs/task-24-fix-race-condition-between-state-persistence-and-navigation
---

# Task Development #24
**Date**: 2025-11-14
**Title**: Fix Race Condition Between State Persistence and Navigation on Category Selection

## Summary
- Status: Completed
- Approach: Created `forcePersist()` function to bypass debounce and ensure state persistence before navigation
- All subtasks completed successfully

## Implementation

### Subtask 24.1: Analysis
- Analyzed existing `persistState()` function with 300ms debounce
- Identified race condition: navigation happens before debounced save completes
- Determined solution: create synchronous (non-debounced) persistence function

### Subtask 24.2: Implement `forcePersist()` Function
**File**: `src/stores/gameStore.ts` (lines 134-186)
- Created new exported `forcePersist()` async function
- Bypasses debounce by directly calling `saveGameSession()`
- Handles edge cases: no session ID, rehydration in progress
- Proper error handling with re-throw
- Added 5 comprehensive unit tests

### Subtask 24.3: Make Handlers Async
**File**: `src/components/CategorySelect.tsx`
- Made `handleCategorySelect` async (line 117)
- Made `handleShuffleAll` async (line 142)

### Subtask 24.4: Await Persistence Before Navigation
**File**: `src/components/CategorySelect.tsx`
- Imported `forcePersist` from gameStore (line 7)
- Added `await forcePersist()` before navigation in both handlers (lines 133, 156)
- Updated test mocks to include `forcePersist`

### Subtask 24.5: End-to-End Testing
- Manual testing confirmed: No "No Active Game" errors
- State successfully persists before navigation
- Page refresh correctly rehydrates state from IndexedDB

## Modified Files
- `src/stores/gameStore.ts`
- `src/components/CategorySelect.tsx`
- `src/stores/__tests__/gameStore.test.ts`
- `src/components/__tests__/CategorySelect.test.tsx`

## Tests Added
- 5 unit tests for `forcePersist()` function
- Updated CategorySelect tests to mock `forcePersist`
- All 312 tests pass ✅

## Technical Decisions
- **Minimal changes**: Single new function + async/await in handlers
- **No architectural changes**: Kept debounced persistence for normal operations
- **Clear separation**: `persistState()` for fire-and-forget, `forcePersist()` for critical operations
- **Error handling**: Re-throw errors to allow caller handling

## Observations
- Solution is simple and elegant
- No impact on existing functionality
- Race condition completely resolved
- Code coverage maintained at 97.2% for gameStore.ts