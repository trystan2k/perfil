---
title: Task 6 - Turn Management and Clue Display
type: note
permalink: development-logs/task-6-turn-management-and-clue-display
---

## Task 6 — Turn Management and Clue Display

Successfully completed Task #6 with all subtasks implemented. Created the GamePlay component that handles the main game loop, displaying the active player, showing clues progressively, and handling turn advancement through "Show Next Clue" and "Pass" buttons.

### 6.1 - Create GamePlay Component and Connect to Zustand Store
- Created `src/components/GamePlay.tsx`
- Connected to Zustand store with subscriptions to: currentTurn, players, status, category, totalCluesPerProfile
- Implemented early return for non-active games
- 5 tests, 100% coverage

### 6.2 - Display Active Player and Turn Information
- Displays active player name using `currentTurn.activePlayerId`
- Shows "Unknown Player" fallback for edge cases
- Renders prominently with h2 tag and "Current Player" label
- 3 tests including turn passing verification

### 6.3 - Render Current Clue Number and Text
- Displays clue progress: "Clue X of 20"
- Shows placeholder message when no clues revealed (cluesRead = 0)
- Uses mock clue text (real profile data comes later)
- 4 tests covering all scenarios

### 6.4 - Implement 'Show Next Clue' Button
- Added Button component calling `nextClue` store action
- Disables when `cluesRead >= totalCluesPerProfile`
- 5 tests for button behavior and disabled states

### Test Coverage
- Statements: 100%
- Branches: 98.21%
- Functions: 100%
- Lines: 100%
- Total: 23 tests in GamePlay.test.tsx

### QA Checks
All checks passing:
- ✅ Lint (Biome)
- ✅ Typecheck (TypeScript + Astro)
- ✅ Tests (23/23 passed)
- ✅ Build (Astro static build)