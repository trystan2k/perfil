Task 85 — Extend game support to up to 16 players

Summary
- Task: Extend the current game architecture to support more players, up to a maximum of 16 participants instead of the previous lower limit.
- Status: Done
- PR: https://github.com/trystan2k/perfil/pull/46

Implementation approach
- Simplicity-first: centralize the player limit in a single constant and reference it across the codebase.
- Keep UI and layout changes minimal: prefer to reuse existing responsive grid and layout logic where it already supports larger player counts.

Files changed/created
- Modified: src/lib/constants.ts (set MAX_PLAYERS = 16)
- Modified: src/stores/gameStore.ts (validation against MAX_PLAYERS)
- Modified: src/components/GameSetup.tsx (removed or documented 3 hardcoded locations)
- Reviewed: src/components/Scoreboard.tsx (no code changes required)
- Tests added/updated:
  - src/stores/__tests__/gameStore.16players.test.ts (new)
  - src/components/__tests__/Scoreboard.16players.test.ts (new)
  - src/components/__tests__/GameSetup.test.tsx (updated - 36 tests adapted)

Test coverage achieved
- Added 5 new tests specifically targeting 16-player scenarios.
- Updated 36 existing GameSetup tests to align with MAX_PLAYERS=16 behavior.
- All affected tests pass locally and in CI.

Notes
- MAX_PLAYERS centralized in src/lib/constants.ts; prefer importing from there for any future changes.
- No UI changes needed for Scoreboard or GameSetup beyond ensuring references use MAX_PLAYERS.

Date: 2025-11-22
Author: Task Master Automation
