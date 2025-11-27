---
title: Task 46 Refactor State Persistence to Repository Pattern
type: note
permalink: docs/memories/development-logs/task-46-refactor-state-persistence-to-repository-pattern
---

# Task 46 — Refactor State Persistence to Repository Pattern

- Task ID: 46
- Title: Refactor State Persistence to Repository Pattern (Phase 1 of Epic #87)
- Status: Complete
- Epic: #87 - Persistence & Domain Refactor
- Date: 2025-11-25
- Author: basic-memory-specialist

## Summary

Refactored the state persistence approach by introducing a repository pattern and a persistence service, decoupling direct IndexedDB access from the Zustand store. This change improves separation of concerns, testability, and provides a foundation for subsequent phases addressing memory leaks and domain layer refactor.

## Implementation

1. GameSessionRepository (src/repositories/GameSessionRepository.ts)
   - Added an `IGameSessionRepository` interface defining `save(sessionId, payload)` and `load(sessionId)` (and `delete`/`clear` as appropriate).
   - Implemented `IndexedDBGameSessionRepository` which wraps the existing `gameSessionDB` implementation, delegating IndexedDB operations behind the repository interface.
   - Ensured dependency injection capability so higher layers can accept any repository implementing the interface.
   - Tests: 32 unit tests added, achieving 100% coverage for repository code.

2. GamePersistenceService (src/services/GamePersistenceService.ts)
   - New service orchestrates persistence operations with a 300ms debounce to reduce write frequency.
   - Exposed methods: `debouncedSave(sessionId, payload)`, `forceSave(sessionId, payload)`, and `clearTimers(sessionId?)` to prevent timer leaks.
   - Handles lifecycle concerns: cancellation of pending timers on session end, safe-force save on unload, and error propagation to callers.
   - Implemented internal timer tracking map to avoid leaks and to support explicit clearing.
   - Tests: 46 unit tests added, achieving 100% coverage for service code.

3. Store Integration (src/stores/gameStore.ts)
   - Refactored store persistence logic to use `GamePersistenceService` instead of inline IndexedDB or gameSessionDB calls.
   - Kept backward-compatible exports: `forcePersist()` and `cancelPendingPersistence()` so external callers/tests remain functional.
   - Updated store unit tests (78 tests) to account for the new architecture and mocked persistence service.

## Files Created

- src/repositories/GameSessionRepository.ts
- src/repositories/__tests__/GameSessionRepository.test.ts
- src/services/GamePersistenceService.ts
- src/services/__tests__/GamePersistenceService.test.ts

## Files Modified

- src/stores/gameStore.ts
- src/stores/__tests__/gameStore.test.ts (updated test suite — 78 tests adjusted)

## Test Results & Quality

- All test suites: 496 tests passing
- Coverage: 100% coverage for the repository and service code
- Lint: clean
- Typecheck: passing
- Build: successful

## Development Log / Implementation Details

- Motivation: The previous approach coupled the store directly to `gameSessionDB` (IndexedDB). This made unit testing harder and mixed persistence concerns within state management.

- Design choices:
  - Use a repository interface (IGameSessionRepository) to abstract the persistence backend.
  - Implement an IndexedDB-backed repository that delegates to the existing `gameSessionDB` module, minimizing behavior changes while enabling future backends.
  - Introduce a persistence service responsible for throttling/debouncing and lifecycle management (timers), keeping the store focused on state only.

- Debounce behavior:
  - Chosen debounce window: 300ms (trade-off between UX responsiveness and write rate).
  - `debouncedSave` queues the last payload and schedules a single save per sessionId. Multiple quick updates collapse into one write.
  - `forceSave` bypasses debounce and immediately persists the latest payload.

- Timer and lifecycle handling:
  - Used a Map keyed by sessionId to track pending timers and latest payloads.
  - `clearTimers(sessionId?)` clears timers for a specific session or for all sessions when invoked without params. This prevents leaking timers across multiple game sessions.
  - Ensured `forceSave` clears pending timers for the session after completion to avoid duplicate writes.

- Testing approach:
  - Repository tests mock/spy on the underlying `gameSessionDB` and validate interface behavior and error propagation.
  - Service tests simulate rapid successive saves to assert debounce collapsing, ensure `forceSave` triggers immediate persistence, and validate `clearTimers` cleans scheduled tasks.
  - gameStore tests were updated to inject a mocked `GamePersistenceService` (or spy on service methods) to assert the store triggers persistence at expected times while remaining agnostic of storage details.

- Challenges and resolutions:
  - Race conditions between store initialization and persistence service availability were addressed by ensuring the store imports/instantiates the service lazily and that the service exposes safe no-op behaviour if repository isn't configured.
  - Ensured no change in public API expected by other modules — preserved `forcePersist()` and `cancelPendingPersistence()` exports from the store.

## Architecture Benefits

- Clear separation of concerns: store ↔ service ↔ repository ↔ IndexedDB backend
- Improved testability through dependency injection and easier mocks
- Eliminated direct coupling between the store and gameSessionDB
- Reduced risk of timer leaks and duplicate writes via centralized timer management
- Sets up a solid foundation for Phase 2 (memory leak fixes) and Phase 3 (domain layer extraction)

## Next Steps / Phase 2 Considerations

- Audit live timer usage across the app and replace any direct timer logic with the service APIs.
- Add telemetry around persistence write frequency and failures.
- Implement memory leak fixes across other services that keep stale references.
- Expand repository implementations for alternative storage backends if needed (e.g., remote persistence).
