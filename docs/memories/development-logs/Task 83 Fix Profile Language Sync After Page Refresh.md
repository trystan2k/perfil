---
title: 'Task 83: Fix Profile Language Sync After Page Refresh'
type: note
permalink: docs/memories/development-logs/task-83-fix-profile-language-sync-after-page-refresh
tags:
- task-83
- development-log
---

# Task 83: Fix Profile Language Sync After Page Refresh

Date: 2025-11-24

## Summary
After a page refresh the app displayed the next clue in English regardless of the selected language and previous clues were not translated when the user changed language. This change ensures clues are rebuilt in the active language after loading persisted game state and makes previous clues translatable by storing indices instead of raw text.

---

## Problem
- After page refresh, the next clue displayed in English regardless of the selected language.
- Previous clues (revealed clues) weren't translated when the language changed.

## Root Cause
1. loadFromStorage restored currentProfile with clues persisted as text in their original language (from IndexedDB).
2. Language change detection only ran on language switch events, not after loading a persisted game state.
3. revealedClueHistory was persisted as text strings, so the app had no way to regenerate the clue text in a different language.

## Implementation Approach
Added clue index tracking so clue text can be regenerated for any language and synced after state load.

### Key changes
1. Store schema changes (src/stores/gameStore.ts)
   - Added revealedClueIndices: number[] to the store to keep track of the positions (indices) of revealed clues.
   - nextClue() now appends both the revealed text to revealedClueHistory and the clue index to revealedClueIndices.
   - advanceToNextProfile() clears both revealedClueHistory and revealedClueIndices when moving to the next profile.
   - Persistence logic updated so revealedClueIndices is saved/loaded alongside other persisted state.

2. Profile sync after load (src/components/GamePlay.tsx)
   - Added a useEffect triggered when a game/profile is loaded (session id change) and when profilesData becomes available.
   - When a loaded profile is detected, checks whether localization needs to be reapplied (e.g. persisted clues were stored in a different language).
   - Rebuilds revealedClueHistory from revealedClueIndices using the current language (by looking up clues in profilesData/currentProfile) so clues display in the correct language.
   - Introduced hasSyncedRef to prevent infinite loops: it tracks whether the sync already ran for the current session+language and avoids re-running unnecessarily.

3. Database schema (src/lib/gameSessionDB.ts)
   - Made revealedClueIndices optional in the PersistedGameState type to maintain backward compatibility with older persisted records.

4. Tests
   - Updated src/stores/__tests__/gameStore.test.ts to include assertions for revealedClueIndices and the updated store behavior.

## Files changed
- src/stores/gameStore.ts
- src/components/GamePlay.tsx
- src/lib/gameSessionDB.ts
- src/stores/__tests__/gameStore.test.ts

## Testing
- ✅ Lint and type checks: passed
- ✅ Unit tests: all 418 unit tests pass
- ✅ E2E tests: all 31 E2E tests pass
- ✅ Build: successful

Manual verification
- After page refresh, clues display in the currently selected language.
- Previous clues are translated correctly when the language is changed.
- Game state (scores, rounds, current turn/profile position) preserved across refresh.

## Notes on implementation details and rationale
- Using indices keeps persisted state language-agnostic and allows regeneration of UI strings from canonical profile data (profilesData). This avoids storing duplicate text for every supported language and keeps DB records forward-compatible.
- The hasSyncedRef prevents repeated sync cycles by marking that the loaded state has already been localized for the current language/session. The check is intentionally lightweight and scoped to the session to avoid cross-session leakage.
- Making revealedClueIndices optional in the DB schema keeps older persisted sessions readable; when indices are absent we continue to fall back to legacy revealedClueHistory strings.
