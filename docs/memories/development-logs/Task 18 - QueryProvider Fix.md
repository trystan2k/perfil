---
title: Task 18 - QueryProvider Fix
type: note
permalink: development-logs/task-18-query-provider-fix
---

# Task 18 - QueryProvider Fix

## Issue Found
**Date**: 2025-11-13
**Reporter**: User testing

## Problem
When navigating from GameSetup to the game-setup/[sessionId] page, the application showed a black screen with console error:
```
Uncaught Error: No QueryClient set, use QueryClientProvider to set one
```

## Root Cause
After enabling SSR, the dynamic route pages (game-setup/[sessionId] and scoreboard/[sessionId]) were not wrapping their React components with QueryClientProvider. 

Components using React Query hooks (useProfiles via CategorySelect, useGameSession via Scoreboard) require QueryClientProvider in their component tree.

## Solution
Added QueryProvider wrapper to:
1. `src/pages/game-setup/[sessionId].astro` - Wraps CategorySelect
2. `src/pages/scoreboard/[sessionId].astro` - Wraps Scoreboard

## Changes Made
```astro
// Before
<CategorySelect client:only="react" sessionId={sessionId} />

// After
<QueryProvider client:only="react">
  <CategorySelect client:only="react" sessionId={sessionId} />
</QueryProvider>
```

## QA Results
- ✅ All lint checks passed
- ✅ All type checks passed
- ✅ All 274 tests passed
- ✅ Build successful
- ✅ Coverage maintained at 95.54%

## Note
This issue only appeared after SSR was enabled because the static build handled the QueryClient differently. The fix ensures proper React Query context is available in all server-rendered pages.


## Additional Fix - Wrapper Components
The initial fix didn't work because using `client:only="react"` on nested components creates isolated islands.

### Final Solution
Created wrapper components that bundle QueryProvider with the component:
1. `CategorySelectWithProvider.tsx` - Wraps CategorySelect with QueryProvider
2. `ScoreboardWithProvider.tsx` - Wraps Scoreboard with QueryProvider

Updated pages to use wrapper components with single `client:only="react"` directive.

### Additional Fix - Async Navigation Delay
Added 400ms delay in GameSetup's handleStartGame to ensure session is persisted to IndexedDB before navigation (gameStore uses 300ms debounce).

```typescript
const handleStartGame = async () => {
  createGame(playerNames);
  const newGameId = useGameStore.getState().id;
  
  // Wait for persistence to complete
  await new Promise((resolve) => setTimeout(resolve, 400));
  
  window.location.href = `/game-setup/${newGameId}`;
};
```

### Test Updates
Updated GameSetup test to handle async navigation with 500ms wait.

## Testing Results
Verified complete navigation flow works:
✅ Game setup page loads
✅ Can add players
✅ Clicking "Start Game" navigates to category selection
✅ Category selection page loads with proper data
✅ No QueryClient errors
✅ No console errors