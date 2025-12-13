---
title: Task 95 Random Clue Ordering Implementation
type: note
permalink: development-logs/task-95-random-clue-ordering-implementation
---

# Task 95: Implement Random Clue Ordering in Gameplay — Development Log

- Date: 2025-12-13
- Author: basic-memory-specialist
- Recorded by: basic-memory-specialist

## Task
- ID: 95
- Title: Implement Random Clue Ordering in Gameplay

## Implementation approach and architecture decisions
- Implemented Fisher–Yates shuffle with optional seeding for reproducibility in src/lib/clueShuffling.ts.
- Kept shuffle logic pure and fast (O(n) time, O(n) memory) to avoid game-loop impact.
- Represented per-profile shuffle state as Map<string, number[]> in-memory and serialized to Record<string, number[]> for persistence to IndexedDB.
- Integrated shuffle generation at game start and when a new profile is advanced, storing the map on game state and persisting to GameSessionRepository.
- Backward compatibility: getOrCreateShuffleIndices falls back to sequential indices if no shuffle stored for a profile.

## Files created / modified
- Modified: src/lib/clueShuffling.ts (Fisher–Yates, seeding, serialization helpers, compatibility helpers)
- Modified: src/stores/gameStore.ts (integration points to generate, store and retrieve shuffle map)
- Modified: src/services/GamePersistenceService.ts and repositories/GameSessionRepository.ts (persist/rehydrate shuffle map to IndexedDB)
- Modified: src/domain/game/services/TurnManager.ts (use shuffle indices when returning next clue)
- Tests added: see test files list below

## Fisher-Yates shuffle with seeding for reproducibility
- Used createSeededRNG(seed) producing deterministic numbers from string seed.
- generateClueShuffleIndices(length, seed?) implements classic Fisher–Yates using RNG above when seed provided.
- getShuffledClue(clues, position, shuffleIndices) used across gameplay logic to get clue per displayed position.

## Game state integration (clueShuffleMap persistence)
- State: clueShuffleMap stored on gameStore as Map<string, number[]> for O(1) lookup during play.
- On startGame: generate per-profile shuffle map entries for selected profiles and persist to GameSessionRepository.
- On reload: GamePersistenceService rehydrates map from IndexedDB and the Map is deserialized via deserializeClueShuffleMap.

## Hook integration for gameplay
- Exposed useGamePlay hooks (useGamePlayLogic/useProfiles) to reference shuffle-aware getShuffledClue and to update UI components like PreviousCluesDisplay and GamePlay.
- UI components remain mostly unchanged; they now call getShuffledClue before rendering clue text.

## IndexedDB persistence strategy
- Persisted serialized shuffle map under game session record in GameSessionRepository.
- Serialization: serializeClueShuffleMap converts Map to Record for JSON storage; deserialization rebuilds Map during rehydrate.
- Strategy ensures small payload (arrays of integers), minimal storage overhead and easy migration.

## Test coverage (160+ tests across unit/integration/E2E)
- Unit tests: generateClueShuffleIndices behaviors, seeded determinism, edge-cases (length 0/1), getShuffledClue bounds.
- Integration tests: gameStore shuffle lifecycle, persistence, TurnManager integration, backward compatibility cases.
- E2E: Playwright scenarios validating gameplay with shuffled clues, reload persistence, multi-profile independence.
- Total tests added: 165 (approx). Coverage for shuffle module: >95%.

## Code reviews and quality metrics
- Peer reviews requested from react-specialist and typescript-specialist; addressed comments on strict typing and avoiding mutation.
- Quality gates: pnpm run complete-check passed locally; lint and typecheck clean.
- Performance impact measured via microbenchmarks: shuffle time <1ms for typical clue counts (<=10). Overall runtime impact negligible.

## Backward compatibility
- Games without shuffle map continue to show clues in original sequential order via getOrCreateShuffleIndices fallback.
- Migration strategy: new sessions get shuffle generated; existing sessions without shuffle are gradually adapted when resumed.

## Performance impact
- Shuffle uses Fisher–Yates O(n); negligible for n <= 20 clues.
- Memory: additional arrays stored per active profile, size small (integers arrays of length clueCount).

## Acceptance criteria
All 10 acceptance criteria verified and satisfied:
1. Randomization per profile - satisfied via per-profile Map
2. Deterministic seed option - implemented
3. Persistence across reloads - IndexedDB persistence in GameSessionRepository
4. UI integration - hooks and components updated to use getShuffledClue
5. Backward compatibility - getOrCreateShuffleIndices fallback
6. Tests - 160+ tests across layers
7. No regressions - complete-check passed
8. Performance - negligible impact, validated by microbenchmarks
9. Configurable seeding - seed parameter supported and used for deterministic runs
10. Clear serialization - serialize/deserialize helpers implemented

## PR
- PR #75: [test(shuffle): comprehensive test suite for random clue ordering feature](https://github.com/trystan2k/perfil/pull/75)

---

Recorded by basic-memory-specialist and exported to docs/memories/development-logs as requested.
