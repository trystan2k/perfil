---
title: Task 48 Fix Race Condition in State Rehydration
type: note
permalink: development-logs/task-48-fix-race-condition-in-state-rehydration
---

# Task 48 — Fix Race Condition in State Rehydration

## Task title and objective
- Title: Fix Race Condition in State Rehydration
- Objective: Eliminate a race condition between the app's state rehydration process and persistence operations to prevent data corruption and lost state during startup and concurrent updates.

## Problem statement
There was a race condition where persistence operations (writes) could occur concurrently with the initial rehydration (read/restore) of the store. This led to:
- Overwriting freshly rehydrated state with stale or partial data
- Lost updates when persistence triggers fired early
- Sporadic data corruption seen in integration tests and end-to-end flows

Root cause: No explicit coordination between the rehydration lifecycle and persistence calls — persistence could start before rehydration completed.

## Solution approach
Adopted a lightweight rehydration state machine pattern to explicitly track the lifecycle of store rehydration and gate persistence operations until it is safe to run them. Key characteristics:
- Minimal, custom state machine (keeps complexity low — intentionally not using XState)
- Clear lifecycle states: `idle` -> `rehydrating` -> `active`
- Exposed API to check rehydration state and prevent persistence operations during rehydration

This approach provides deterministic ordering between rehydration and persistence without introducing heavy dependencies or complex tooling.

## Implementation details
- Created src/lib/rehydrationMachine.ts — a small state tracker that exposes:
  - `startRehydration(sessionId)` - marks session as rehydrating
  - `completeRehydration(sessionId)` - transitions session to active state
  - `failRehydration(sessionId, error)` - handles rehydration errors gracefully
  - `isRehydrating(sessionId)` - checks current rehydration state
  - `resetRehydrationState(sessionId)` - resets state for a session
  - `cleanupAllMachines()` - cleanup for app shutdown or test teardown
  - `getActiveMachineCount()` - debugging utility

- Modified src/stores/gameStore.ts — integrated the rehydration machine:
  - On startup, calls `startRehydration()` before loading state from storage
  - After successful load, calls `completeRehydration()` to allow persistence
  - On failure, calls `failRehydration()` with error details
  - Persistence triggers check `isRehydrating()` before saving
  - Calls `resetRehydrationState()` when game ends

- Enhanced src/services/GamePersistenceService.ts — added double protection:
  - Service checks `isRehydrating()` before executing writes
  - Both `debouncedSave()` and `forceSave()` skip persistence if rehydration is in progress
  - Provides an additional safety layer independent of store logic

### Files created/modified (summary)
- Created: src/lib/rehydrationMachine.ts — lightweight state machine implementation
- Created: src/lib/__tests__/rehydrationMachine.test.ts — comprehensive unit tests
- Created: src/stores/__tests__/gameStore.rehydration.test.ts — integration tests for race conditions
- Modified: src/stores/gameStore.ts — integrate machine and guard persistence triggers
- Modified: src/services/GamePersistenceService.ts — double protection awareness

Detailed change notes:
- src/lib/rehydrationMachine.ts
  - Implements a minimal finite-state tracker with: `idle`, `rehydrating`, `active`
  - Per-session state management in a global Map
  - Error storage for debugging failed rehydration attempts

- src/stores/gameStore.ts
  - On initialization: call `startRehydration(sessionId)` before loading state
  - After successful load: call `completeRehydration(sessionId)` to resume persistence
  - On error: call `failRehydration(sessionId, error)` for graceful error handling
  - All persistence calls check `isRehydrating()` before executing
  - All persistence calls use `resetRehydrationState()` when games end

- src/services/GamePersistenceService.ts
  - Before writing, service checks `isRehydrating(sessionId)`; if true, write is skipped
  - Applied to both `debouncedSave()` and `forceSave()` for comprehensive protection

## Test strategy
- Unit tests (src/lib/__tests__/rehydrationMachine.test.ts)
  - State transitions: idle -> rehydrating -> active -> idle
  - Edge cases: empty strings, special characters, very long session IDs
  - Cleanup and memory management
  - Multiple concurrent sessions with independent states
  - Rapid start/complete/reset cycles
  - Error handling with graceful transitions

- Integration tests (src/stores/__tests__/gameStore.rehydration.test.ts)
  - Block persistence during rehydration
  - Allow persistence after rehydration completes
  - Concurrent load and persist operations on same session
  - Multiple sessions operating independently
  - Stress tests with rapid operations
  - Memory cleanup verification

## Test results
- Test run summary (final):
  - All tests: 649 passed
  - Test files: 32 passed
  - Statement coverage: 92.29%
  - Branch coverage: 86.42%

## Files changed
- src/lib/rehydrationMachine.ts - NEW
- src/lib/__tests__/rehydrationMachine.test.ts - NEW
- src/stores/__tests__/gameStore.rehydration.test.ts - NEW
- src/stores/gameStore.ts - MODIFIED
- src/services/GamePersistenceService.ts - MODIFIED
- .taskmaster/tasks/tasks.json - MODIFIED (task status update)

## QA Status
- ✅ Lint: Clean
- ✅ Type checking: No errors
- ✅ Tests: 649 tests passed
- ✅ Build: Production build successful

## Key Benefits

1. **Eliminates Race Condition**: Impossible for persistence to run during rehydration
2. **Data Integrity**: Multiple layers of protection ensure no data loss
3. **Maintainability**: Clear state machine pattern, easy to understand
4. **Testability**: Comprehensive test coverage for concurrent scenarios and edge cases
5. **Performance**: Lightweight implementation with minimal overhead
6. **Memory Safe**: Proper cleanup prevents memory leaks in long-running applications

## Technical Decisions

- **Why not XState?** The simplified custom implementation is sufficient for this use case and eliminates an external dependency while remaining crystal-clear and maintainable.
- **State naming**: Simplified to three states (idle/rehydrating/active) instead of four, as the distinction between "hydrated" and "ready" was not necessary for the implementation.
- **Session-specific tracking**: Each game session maintains its own rehydration state, allowing multiple concurrent games to operate independently without interference.
