# ADR-002: Domain-Driven Design Structure for Game Logic

## Status

Accepted

## Context

The gameStore (`src/stores/gameStore.ts`) had grown to ~828 lines, mixing:
- Business logic (scoring formulas, turn management, profile selection algorithms)
- State management (Zustand store operations)
- Persistence logic (IndexedDB integration)
- Helper functions (Fisher-Yates shuffle, profile grouping)

This violated the Single Responsibility Principle and made the code:
- Hard to test in isolation
- Difficult to understand and maintain
- Resistant to change (high coupling)
- Prone to bugs when modifying game rules

We needed a cleaner architecture that:
1. Separates business logic from state management
2. Makes game rules explicit and testable
3. Enables easier evolution of game mechanics
4. Improves code organization and discoverability

## Decision

We have adopted a Domain-Driven Design (DDD) structure for game logic, creating a new `src/domain/game/` layer with:

### Domain Structure

```
src/domain/game/
├── entities/          # Pure data structures with validation
│   ├── Game.ts       # Game aggregate root
│   ├── Player.ts     # Player entity with score management
│   ├── Profile.ts    # Profile entity with clue access
│   ├── Round.ts      # Round entity
│   └── Turn.ts       # Turn entity with clue tracking
├── services/         # Business logic
│   ├── ScoringService.ts           # Point calculation
│   ├── TurnManager.ts              # Turn progression & clue management
│   └── ProfileSelectionService.ts  # Profile selection & shuffling
└── value-objects/    # Immutable domain concepts
    ├── GameStatus.ts   # Game state enum with guards
    └── ClueHistory.ts  # Clue history management
```

### Key Principles

1. **Entities are Data + Validation**
   - Use Zod schemas for runtime validation
   - Include factory functions for creation
   - Provide helper functions for entity operations
   - Keep entities pure (no side effects)

2. **Services Contain Business Logic**
   - Pure functions that transform data
   - No direct state manipulation
   - Easy to test in isolation
   - Clear single responsibilities

3. **Store as Orchestration Layer**
   - Delegates to domain services
   - Manages Zustand state
   - Handles persistence
   - Maintains backward-compatible API

4. **Value Objects for Domain Concepts**
   - Immutable representations of concepts
   - Type-safe enumerations with guard functions
   - Encapsulate domain knowledge

### Example: Scoring

**Before (in gameStore):**
```typescript
const points = state.totalCluesPerProfile - (state.currentTurn.cluesRead - 1);
```

**After (using domain service):**
```typescript
const points = calculatePoints(state.currentTurn.cluesRead, state.totalCluesPerProfile);
```

### Example: Profile Selection

**Before (120 lines of complex logic in gameStore):**
- Fisher-Yates shuffle implementation
- Category grouping logic
- Even distribution algorithm
- Redistribution logic

**After (delegation to service):**
```typescript
const profilesToPlay = selectProfilesForGame(
  state.profiles,
  selectedCategories,
  numberOfRounds
);
```

## Consequences

### Positive

1. **Testability**: Domain services are pure functions, easily tested in isolation
2. **Maintainability**: Business rules are explicit and well-organized
3. **Discoverability**: Clear structure makes it easy to find game logic
4. **Extensibility**: Easy to add new game rules or modify existing ones
5. **Documentation**: Domain model serves as living documentation
6. **Reusability**: Services can be reused across different contexts
7. **Type Safety**: Zod validation provides runtime type checking

### Negative

1. **Bundle Size**: Increased from 51.14 kB to 103.89 kB due to domain layer
   - Acceptable trade-off for better architecture
   - Could be optimized later if needed
2. **Learning Curve**: Team must understand DDD concepts
3. **Initial Complexity**: More files and structure upfront
4. **Migration**: Required updating tests and fixing assertions

### Migration Impact

- **Removed**: ~120 lines of business logic from gameStore
- **Store Size**: Reduced from 828 to ~700 lines (14% reduction)
- **Test Changes**: 2 test assertions updated (clues in history + current)
- **API Stability**: All existing store methods remain unchanged
- **Performance**: No measurable impact on game performance

## Implementation Notes

### Scoring Formula

Points awarded based on when player guesses:
```typescript
points = TOTAL_CLUES - (cluesRead - 1)
```

- 1 clue read → 5 points
- 2 clues read → 4 points
- 3 clues read → 3 points
- 4 clues read → 2 points
- 5 clues read → 1 point

### Profile Selection Algorithm

1. Calculate base profiles per category: `floor(rounds / categories)`
2. Distribute remaining slots evenly across randomized categories
3. Handle categories with insufficient profiles via redistribution
4. Final shuffle to randomize play order

### Turn Progression

1. Advance clue counter using `advanceClue(turn)`
2. Get revealed clues history using `getRevealedClues(turn, profile)`
3. Track indices separately for language switching support

## Future Enhancements

1. **Domain Events**: Emit events for game state changes
2. **Aggregates**: Strengthen Game as aggregate root
3. **Repository Pattern**: Abstract persistence layer
4. **Command/Query Separation**: Separate read/write operations
5. **Invariant Enforcement**: Move validation to domain layer

## References

- Domain-Driven Design (Eric Evans)
- Clean Architecture (Robert C. Martin)
- Task #47: Implement Domain-Driven Design Structure for Game Logic

## Related ADRs

- ADR-005: Unified Linting and Formatting with Biome

---

*Date: 2025-12-09*
*Author: Development Team*
*Status: Implemented*
