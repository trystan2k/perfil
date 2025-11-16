---
title: Task 3 Game Session State Management with Zustand
type: note
permalink: development-logs/task-3-game-session-state-management-with-zustand-1
---

## Task 3 — Game Session State Management with Zustand

### 3.1 - Initialize Zustand Store and Define State Shape
- Created `src/stores/gameStore.ts` with initial Zustand store structure
- Defined `GameState` interface extending `GameSession` from `types/models.ts`
- Added `GameStatus` type: 'pending' | 'active' | 'completed'
- Set up initial state with default empty values
- Created test file `src/stores/__tests__/gameStore.test.ts` with 2 initial tests
- Verified store initialization and default state values

### 3.2 - Implement `createGame` and `startGame` Actions
- Implemented `createGame(playerNames: string[])`:
  - Generates unique player IDs using timestamp-based approach: `player-${Date.now()}-${index}`
  - Initializes all players with score 0
  - Resets game state to 'pending'
  - Creates unique game ID: `game-${Date.now()}`
- Implemented `startGame(category: string)`:
  - Validates that players exist before starting
  - Sets status to 'active' and assigns category
  - Randomly selects starting player using `Math.floor(Math.random() * players.length)`
  - Initializes first turn with: profileId (empty), activePlayerId, cluesRead: 0, revealed: false
- Added 10 comprehensive tests covering both actions and edge cases

### 3.3 - Implement `nextClue` and `passTurn` Actions
- Implemented `nextClue()`:
  - Increments `cluesRead` counter for current turn
  - Validates active turn exists (throws error if not)
  - Enforces maximum 20 clues limit per profile
  - Throws error when max clues reached
- Implemented `passTurn()`:
  - Finds current player index in players array
  - Advances to next player using modulo wraparound: `(currentIndex + 1) % players.length`
  - Handles cycle from last player back to first player
  - Maintains clue count and other turn state
  - Validates active turn and player list
- Added 13 comprehensive tests covering normal flow, wraparound, and error conditions

### 3.4 - Implement `awardPoints` Action
- Implemented `awardPoints(playerId: string)`:
  - Uses scoring formula: `points = totalCluesPerProfile - (cluesRead - 1)`
  - For default 20 total clues: points = 20 - (cluesRead - 1)
  - Example: 1 clue read = 20 points, 2 clues = 19 points, 20 clues = 1 point
  - Finds player by ID and updates score immutably
  - Resets turn state for next profile (cluesRead: 0, revealed: false)
  - Advances to next player for new turn
  - Validates: active turn exists, at least 1 clue read, player exists
- Added 11 comprehensive tests covering scoring calculations, edge cases, and error handling

### 3.5 - Implement `endGame` Action
- Implemented `endGame()`:
  - Sets status to 'completed'
  - Clears current turn (sets to null)
  - Validates game state:
    - Cannot end if already completed (throws error)
    - Cannot end if never started (status 'pending')
  - Preserves all player data, scores, game ID, and category
- Added 10 comprehensive tests covering normal flow, validation, and state preservation

### Modified/Created Files
- `src/stores/gameStore.ts` (181 lines) - Complete Zustand store implementation
  - GameState interface with 6 action methods
  - Full state management for game sessions
  - Error handling and validation throughout
- `src/stores/__tests__/gameStore.test.ts` (644 lines) - Comprehensive test suite
  - 46 tests total covering all 5 subtasks
  - Tests for all actions, edge cases, error conditions
  - Full coverage of game flow scenarios

### Tests Added
- Yes - 46 comprehensive unit tests using Vitest
- Test coverage breakdown:
  - Subtask 3.1: 2 tests (initialization)
  - Subtask 3.2: 10 tests (createGame, startGame)
  - Subtask 3.3: 13 tests (nextClue, passTurn)
  - Subtask 3.4: 11 tests (awardPoints)
  - Subtask 3.5: 10 tests (endGame)
- Tests verify both happy paths and error conditions
- Total project tests: 54 passing (46 new + 8 existing)

### Dependencies
- Task #1 (Project Setup and Tooling Configuration) - ✅ Complete
- Dependencies used:
  - zustand (already installed in Task #1)
  - @testing-library/react (already installed in Task #1)
  - vitest (already installed in Task #1)
- No new dependencies required

### Commits Made
- `8e85ea4` - "feat(store): implement Zustand game session state management"
  - Create gameStore.ts with complete state management for Profile Game
  - Add GameState interface extending GameSession with action methods
  - Implement createGame action to initialize players and game session
  - Implement startGame action to activate game with category selection
  - Implement nextClue action to advance clue counter with 20-clue limit
  - Implement passTurn action to cycle through players with wraparound
  - Implement awardPoints action with scoring formula 20 - (cluesRead - 1)
  - Implement endGame action to mark game as completed
  - Add comprehensive test suite with 46 tests covering all actions
  - Add validation for game state transitions and error conditions
  - Include edge case testing for player management and turn cycling

### Observations

#### Important Points for Future Reference
- Zustand store is now the single source of truth for game session state
- Player IDs are generated using timestamps for uniqueness
- Scoring formula rewards players for guessing with fewer clues
- Turn cycling uses modulo arithmetic for seamless wraparound
- All state mutations are immutable (using spread operators)
- Error handling validates all critical operations

#### Technical Decisions Made
1. **Timestamp-based IDs**: Simple and sufficient for local game sessions without backend
2. **Scoring formula**: `20 - (cluesRead - 1)` provides 1-20 point range based on clues used
3. **GameStatus enum**: Three clear states (pending/active/completed) for game lifecycle
4. **Error validation**: Throw errors for invalid operations rather than silent failures
5. **Immutable updates**: All state changes use spread operators to maintain React compatibility
6. **Turn state reset**: After points awarded, reset for next profile but advance to next player
7. **Random starting player**: Uses Math.random() for fair game start

#### Possible Future Improvements
1. Add persistence using IndexedDB (via idb library already installed)
2. Implement undo/redo functionality for game actions
3. Add game history tracking for review/replay
4. Implement time tracking per turn
5. Add profile queue management (remainingProfiles array population)
6. Consider adding middleware for logging/debugging in dev mode
7. Add optimistic updates for better UX
8. Implement game session serialization for save/load

#### Code Quality Notes
- All code follows Biome formatting rules (2-space indentation, semicolons, double quotes)
- TypeScript strict mode enabled and passing with full type safety
- Zero linting warnings or errors
- All 54 tests passing (46 new + 8 existing)
- Build successful with no warnings
- Complete-check script passing: lint → typecheck → test → build
- Git pre-commit hooks executed successfully

#### Game Flow Design
The implemented store supports this game flow:
1. **Setup**: `createGame(['Alice', 'Bob', 'Charlie'])` - Initialize players
2. **Start**: `startGame('Movies')` - Begin game with category, random starting player
3. **Gameplay loop**:
   - `nextClue()` - Advance to next clue (up to 20)
   - `passTurn()` - Player passes, next player gets turn
   - `awardPoints(playerId)` - Player guesses correctly, gets points based on clues used
   - Repeat for each profile
4. **End**: `endGame()` - Mark game complete, preserve final scores

#### Integration Notes for Future Tasks
- React components should use `useGameStore()` hook to access state and actions
- Components should destructure only needed state to prevent unnecessary re-renders
- Use `useGameStore.getState()` for imperative reads outside components
- Store is ready for integration with profile data from Task #2
- Category selection UI will need to call `startGame(category)`
- Gameplay UI will need to call `nextClue()`, `passTurn()`, and `awardPoints()`
- Leaderboard UI can read `players` array sorted by `score`
