# Task Development #18
**Date**: 2025-11-13_14:10:29
**Title**: Fix Navigation Flow Between Game Screens

## Summary
- Status: Completed
- Estimated time: 2 hours
- Time spent: ~1 hour
- Approach used: Enable Astro SSR for dynamic routes, update components to load sessions from URL parameters
- Subtasks completed: 18.1, 18.2, 18.3, 18.4, 18.5

## Implementation

### Subtask 18.1: Update GameSetup to Navigate to Dynamic Session URL
- **Status**: Already Implemented
- **Finding**: GameSetup component already had correct navigation logic (lines 46-54)
- **Details**: Creates game, gets session ID from store, navigates to `/game-setup/${sessionId}`
- **Note**: Required SSR enablement to function properly

### Subtask 18.2: Convert Astro Game Pages to SSR for Dynamic Routing
- **Status**: Implemented
- **Changes**:
  - Installed @astrojs/node adapter (v9.5.0)
  - Updated astro.config.mjs:
    - Set `output: 'server'` to enable SSR mode
    - Added `adapter: node({ mode: 'standalone' })` configuration
  - Removed `getStaticPaths()` from all dynamic route pages:
    - src/pages/game-setup/[sessionId].astro
    - src/pages/game/[sessionId].astro
    - src/pages/scoreboard/[sessionId].astro
  - Added `export const prerender = true` to static pages:
    - src/pages/index.astro
    - src/pages/game.astro
- **Technical Approach**: Hybrid SSR - server output with selective prerendering for static pages

### Subtask 18.3: Load Session from URL in CategorySelect Component
- **Status**: Implemented
- **Changes**:
  - Added `useEffect` to load session from IndexedDB on mount
  - Added `sessionLoading` and `sessionError` state variables
  - Implemented session error handling with UI feedback ("Return to Home" button)
  - Updated loading state to include session loading
- **Test Updates**:
  - Added `mockLoadFromStorage` to test mocks
  - Updated mock store implementation to include `loadFromStorage`

### Subtask 18.4: Implement Navigation from CategorySelect to Game Screen
- **Status**: Already Implemented
- **Finding**: Navigation was already in place (lines 107, 126 of CategorySelect.tsx)
- **Details**: Uses `window.location.href` to navigate to `/game/${sessionId}` after startGame()

### Subtask 18.5: Add Loading and Error States for Session Hydration
- **Status**: Mostly Complete - Enhanced
- **Finding**: GamePlay and Scoreboard already had loading/error states
- **Enhancements**:
  - Added "Return to Home" button to GamePlay error state
  - Added "Return to Home" button to Scoreboard error state
  - Improved error styling for consistency (destructive text colors)
  - Enhanced button layout (full width, proper spacing)

## Modified Files
- astro.config.mjs - Enabled SSR with Node adapter
- src/pages/index.astro - Added prerender flag
- src/pages/game.astro - Added prerender flag
- src/pages/game-setup/[sessionId].astro - Removed getStaticPaths, uses CategorySelectWithProvider
- src/pages/game/[sessionId].astro - Removed getStaticPaths
- src/pages/scoreboard/[sessionId].astro - Removed getStaticPaths, uses ScoreboardWithProvider
- src/components/CategorySelect.tsx - Added session loading from URL
- src/components/CategorySelectWithProvider.tsx - NEW: Wrapper with QueryProvider
- src/components/ScoreboardWithProvider.tsx - NEW: Wrapper with QueryProvider
- src/components/GameSetup.tsx - Made handleStartGame async with persistence delay
- src/components/GamePlay.tsx - Enhanced error state with Return Home button
- src/components/Scoreboard.tsx - Enhanced error state with Return Home button
- src/components/__tests__/CategorySelect.test.tsx - Updated mocks for loadFromStorage
- src/components/__tests__/GameSetup.test.tsx - Updated test for async navigation

## Tests Added
- No new test files
- Updated CategorySelect tests to include loadFromStorage mock
- All 274 existing tests passing

## Dependencies
- Added: @astrojs/node v9.5.0

## Observations
- GameSetup navigation was already correctly implemented, just needed SSR to work
- Most loading/error state handling was already in place
- The main blocker was the static build with hardcoded sample-session paths
- SSR with selective prerendering maintains PWA offline functionality
- Navigation flow now works correctly with dynamic session IDs throughout the app
- Deep linking and URL sharing now fully functional

## Issues Encountered and Resolved

### Issue #1: QueryClient Not Found Error
**Problem**: After enabling SSR, navigating to category selection showed "No QueryClient set" error

**Root Cause**: Nesting `client:only="react"` directives creates isolated islands - QueryProvider and CategorySelect were separate islands

**Solution**: Created wrapper components (CategorySelectWithProvider, ScoreboardWithProvider) that bundle QueryProvider with the component, using a single `client:only="react"` directive

### Issue #2: Session Not Found After Navigation  
**Problem**: CategorySelect loaded before session was persisted to IndexedDB

**Root Cause**: GameSetup navigated immediately after createGame, but gameStore uses 300ms debounced persistence

**Solution**: Made handleStartGame async with 400ms delay to ensure persistence completes before navigation

## QA Results
- ✅ All lint checks passed (biome)
- ✅ All type checks passed (tsc + astro check)
- ✅ All 274 tests passed
- ✅ Build successful with SSR configuration
- ✅ Coverage: 95.54% (maintained high coverage)

## Technical Decisions
1. **Chose server output over hybrid**: Enables full SSR for dynamic routes while prerendering static pages
2. **Used Node adapter**: Standard adapter for server environments, good for development and most hosting
3. **Maintained PWA functionality**: Selective prerendering ensures offline support for static pages
4. **Consistent error handling**: Added "Return to Home" buttons across all components for better UX
5. **Full page navigation**: Using `window.location.href` for simplicity, could be enhanced with client-side routing later

## Possible Future Improvements
- Implement client-side routing for smoother transitions
- Add loading skeleton states instead of simple loading text
- Implement proper error tracking/logging for production
- Consider adding session recovery for expired/invalid sessions
- Add analytics to track navigation patterns
