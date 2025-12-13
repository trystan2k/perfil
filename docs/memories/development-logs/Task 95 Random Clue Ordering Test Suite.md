---
title: Task 95 Random Clue Ordering Test Suite
type: note
permalink: development-logs/task-95-random-clue-ordering-test-suite
---

# Task 95: Implement Random Clue Ordering in Gameplay — Development Log

- Date: 2025-12-13
- Author: basic-memory-specialist
- Recorded by: basic-memory-specialist

## Task
- ID: 95
- Title: Implement Random Clue Ordering in Gameplay

## Implementation Approach
- What was implemented in the codebase:
  - Fisher–Yates shuffle utility implemented in src/lib/clueShuffling.ts.
  - Integration points added in src/stores/gameStore.ts (startGame, advanceToNextProfile) and TurnManager (src/domain/game/services/TurnManager.ts).
  - Per-profile shuffle state persisted to IndexedDB for page reload resilience and backward compatibility handling.
- Testing strategy:
  - Comprehensive coverage across unit, integration and E2E layers.
  - Deterministic shuffle tests using seeded Fisher–Yates to assert repeatability.
  - Integration tests validate persistence, per-profile independence and game logic invariants.
  - E2E scenarios validate full user flows in Playwright-ready scripts for CI/CD.

## Files Changed / Created
- src/stores/__tests__/gameStore.shuffling.test.ts (1,052 lines)
- src/domain/game/services/__tests__/TurnManager.shuffling.test.ts (728 lines)
- e2e/tests/random-clue-ordering.e2e.ts (604 lines)

## Tests Added
- 28 integration tests for gameStore shuffle management and persistence
- 37 tests for TurnManager shuffle-aware clue methods
- 10 E2E test scenarios for full user workflows
- Total: 65 unit/integration tests + 10 E2E scenarios

## Test Results
- Unit / Integration: All 65 tests passing
- Code coverage: >90% for shuffle-related code
- Test duration: ~1.6 seconds (unit/integration suite)
- E2E: 10 scenarios implemented and ready for Playwright execution in CI/CD

## Key Technical Details
- In-memory representation: Map<string, number[]> for O(1) lookups of per-profile shuffle sequences.
- Serialized storage: Record<string, number[]> for JSON/IndexedDB persistence.
- Per-profile independent randomization ensures each profile sees its own randomized order.
- Backward compatibility: games missing shuffle data are handled by deterministic regeneration with default seed behavior.
- Persistence: Shuffle ordering persisted to IndexedDB and restored on page reload to preserve in-progress games.

## Implementation Summary
- Verified Fisher–Yates shuffle utility correctness and deterministic behavior with seeds.
- Applied shuffle at game/round start while preserving original clue objects immutably.
- Ensured scoring, previous-clue tracking, round transitions and other game logic remained unchanged.
- Confirmed persistence and restoration via IndexedDB; shuffle survives reloads and is backward compatible.

---

Recorded by basic-memory-specialist and exported to docs/memories/development-logs as requested.