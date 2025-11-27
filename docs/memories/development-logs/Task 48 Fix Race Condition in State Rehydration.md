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
- Clear lifecycle states: idle -> rehydrating -> hydrated -> persisting (optional) -> ready
- Exposed API to query state and queue persistence operations until the machine transitions to a safe state

This approach provides deterministic ordering between rehydration and persistence without introducing heavy dependencies or complex tooling.

## Implementation details
- Created src/lib/rehydrationMachine.ts — a small state tracker that exposes:
  - getState(), isRehydrating(), onStateChange(handler), waitForHydrated(), and queueWhenSafe(fn)
  - Internal queue for persistence actions requested during rehydration
  - Simple transition helpers to move from `rehydrating` -> `hydrated` -> `ready`

- Modified src/stores/gameStore.ts — integrated the rehydration machine:
  - On startup, gameStore sets machine to `rehydrating` while applying persisted state
  - After successful rehydration, machine transitions to `hydrated` and flushes queued persistence operations
  - Persistence triggers now consult the machine; if rehydration is ongoing they enqueue instead of executing immediately

- Enhanced src/services/GamePersistenceService.ts — added double protection:
  - Service checks the rehydration machine before executing writes
  - If rehydration is in progress, persistence requests are queued at the service level as a fallback
  - Once hydrated, queued writes are executed in order
  - Defensive checks were added to ensure idempotency and avoid duplicate writes

### Files created/modified (summary)
- Created: src/lib/rehydrationMachine.ts — lightweight state machine and queuing utilities
- Modified: src/stores/gameStore.ts — integrate machine and guard persistence triggers
- Modified: src/services/GamePersistenceService.ts — double protection and queuing fallback

Detailed change notes:
- src/lib/rehydrationMachine.ts
  - Implements a minimal finite-state tracker with: `idle`, `rehydrating`, `hydrated`, `ready`
  - Provides a promise-based waitForHydrated() to allow code to await hydration
  - Exposes queueWhenSafe(fn) so callers can register persistence functions safely

- src/stores/gameStore.ts
  - On initialization: set machine.transition('rehydrating'), perform restore, then transition to 'hydrated'
  - All persistence side-effects (auto-save, debounced writes) now call machine.queueWhenSafe(() =&gt; persistence())

- src/services/GamePersistenceService.ts
  - Before writing, service checks machine.isRehydrating(); if true, service enqueues the write
  - Added deduplication by sessionId/key where applicable
  - Ensured the service resolves promises after writes are completed so callers are properly notified

## Test strategy
- Unit tests
  - New unit tests for src/lib/rehydrationMachine.ts covering state transitions, queue flushing, waitForHydrated() behavior and edge cases (multiple waiters, rapid transitions)
  - Unit tests for GamePersistenceService that simulate writes requested during rehydration and verify ordering and deduplication
  - Unit tests for gameStore logic that assert persistence is gated until hydrated

- Integration tests
  - End-to-end style integration test that simulates startup with concurrent write triggers to reproduce the original race condition and validate that the new approach prevents data loss
  - Tests run under CI to ensure the change doesn't regress other behaviors

Test annotations include mocked timing and deterministic control of asynchronous flows to reliably reproduce race conditions.

## Test results
- Test run summary (final):
  - All tests: 649 passed
  - Statement coverage: 92.29%

(Reported after running full test suite locally/CI following implementation and fixes.)

## QA verification
- Lint: passed
- Typecheck: passed
- Build: passed
- Additional QA: pnpm run complete-check successfully executed — no remaining warnings or failures

## Key benefits
- Eliminates the observed race condition between rehydration and persistence
- Prevents data corruption and lost updates during app startup
- Keeps the solution simple and maintainable (no heavy dependency or complex state machine frameworks)
- Provides a clear, testable API for coordination around rehydration lifecycle

## Design decisions
- Chose a simplified custom state machine for clarity and minimal surface area rather than adopting XState or another heavyweight library
- Added double protection (store-level + persistence-service-level) to ensure safety even if future callers accidentally bypass the store-level guard
- Used promise-based waiters and a simple in-memory queue for operations requested during rehydration to preserve ordering

## Development log / timeline
- Analysis and repro: Identified race on startup where persistence could run before rehydration completed (reproduced via integration test)
- Design: Decided on small state machine and queuing approach, documented trade-offs
- Implementation: Added src/lib/rehydrationMachine.ts, integrated into gameStore and persistence service
- Tests: Added unit and integration tests to assert behavior and prevent regressions
- QA: Ran full test-suite and project QA scripts; all checks passed

---

If further details are needed (patch/diff references or commit hashes), I can provide the list of changed files and exact code excerpts on request. This entry captures the implementation approach, files affected, tests, and verification performed for Task 48.
