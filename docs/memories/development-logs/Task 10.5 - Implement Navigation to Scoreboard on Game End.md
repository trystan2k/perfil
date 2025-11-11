# Task 10.5 - Implement Navigation to Scoreboard on Game End

**Date:** 2025-11-11
**Status:** Completed ✅

## Objective
Implement automatic navigation from the game view to the scoreboard when the MC clicks "Finish Game".

## Implementation Details

### 1. Modified GamePlay Component
- **File:** `src/components/GamePlay.tsx` (line 136-143)
- Created `handleFinishGame` function to wrap game end logic
- Function flow:
  1. Call `endGame()` from store (sets status to 'completed')
  2. Navigate to scoreboard using `window.location.href`
  3. Pass current session ID in URL

```typescript
const handleFinishGame = () => {
  endGame();
  if (id) {
    window.location.href = `/scoreboard/${id}`;
  }
};
```

### 2. Updated Button Handler
- Changed "Finish Game" button from `onClick={endGame}` to `onClick={handleFinishGame}`
- Maintains destructive variant styling
- Navigation happens immediately after game state update

### 3. Navigation Pattern
- **Method:** `window.location.href` assignment
- **Route:** `/scoreboard/${sessionId}`
- **Why not React Router?** This is an Astro app with multi-page architecture
- Full page navigation ensures clean state reset

### 4. Test Implementation
- **File:** `src/components/__tests__/GamePlay.test.tsx` (line 1084-1112)
- Challenge: `window.location` is read-only in test environment
- Solution: Delete and reassign entire `window.location` object
- Used TypeScript `@ts-expect-error` for intentional test mocking
- Verified navigation URL matches expected pattern

```typescript
// Mock strategy
const originalLocation = window.location;
const mockLocation = { ...originalLocation, href: '' };
delete window.location;
window.location = mockLocation;

// Test navigation
await user.click(finishButton);
expect(mockLocation.href).toBe(`/scoreboard/${sessionId}`);

// Cleanup
window.location = originalLocation;
```

## Technical Decisions

1. **Navigation Timing:** Immediate navigation after `endGame()` call
   - Ensures game state is persisted to IndexedDB before navigation
   - No delay needed since IndexedDB operations complete quickly

2. **Navigation Method:** `window.location.href` over router
   - Full page reload ensures clean slate
   - Works well with Astro's multi-page architecture
   - No need for React Router in this context

3. **Error Handling:** Check `if (id)` before navigation
   - Defensive programming to avoid navigation to undefined
   - Should never be false in practice (game must have ID when active)

4. **Test Mocking:** Full `window.location` replacement
   - Only viable approach in JSDOM environment
   - Properly restore original after test
   - Clean, isolated test without side effects

## Testing
- 1 new test added: "should navigate to scoreboard page when Finish Game is clicked"
- Total tests: 224 (all passing)
- Verified:
  - Navigation occurs on button click
  - Correct sessionId passed in URL
  - Game state updated before navigation
  - Original window.location restored after test

## Quality Metrics
- ✅ 224 tests passing (1 new test)
- ✅ 97.14% overall coverage
- ✅ 100% coverage for navigation logic
- ✅ All linting and type checks passing
- ✅ Build successful

## User Flow
1. MC plays game, manages turns and scoring
2. MC clicks "Finish Game" button
3. Game status set to 'completed' in store
4. Game state persisted to IndexedDB
5. Browser navigates to `/scoreboard/{sessionId}`
6. Scoreboard loads game data from IndexedDB
7. Players displayed ranked by score with medals

## Files Modified
- `src/components/GamePlay.tsx` - Added handleFinishGame function
- `src/components/__tests__/GamePlay.test.tsx` - Added navigation test

## Edge Cases Handled
1. **Missing Session ID:** Checked with `if (id)` guard
2. **Test Environment:** Properly mocked window.location
3. **State Persistence:** endGame() called before navigation

## Next Steps
Task #10 is now complete! All subtasks delivered:
- ✅ 10.1 - endGame action (pre-existing)
- ✅ 10.2 - Finish Game button
- ✅ 10.3 - Scoreboard page structure
- ✅ 10.4 - Data fetching and rendering
- ✅ 10.5 - Navigation on game end

Ready to move to next task in the project roadmap.
