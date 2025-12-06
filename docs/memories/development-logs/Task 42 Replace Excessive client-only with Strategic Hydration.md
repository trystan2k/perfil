---
title: Task 42 Replace Excessive client:only with Strategic Hydration
type: note
permalink: docs/memories/development-logs/task-42-replace-excessive-client-only-with-strategic-hydration
---

# Task 42 — Replace Excessive client:only with Strategic Hydration

- Task ID: 42
- Title: Replace Excessive client:only with Strategic Hydration
- Status: Done
- Date: 2025-12-05

## Implementation Summary
Successfully eliminated all `client:only` instances and implemented strategic hydration across the application.

## Implementation Approach
1. Audited codebase - found 3 instances all in Layout.astro
2. Created comprehensive hydration strategy documentation
3. Replaced all client:only with strategic directives (client:load for critical, client:idle for non-critical)
4. Validated with 962 passing tests and successful build

## Files Changed/Created
- Created: docs/hydration-audit-inventory.md
- Created: docs/HYDRATION_STRATEGY.md
- Modified: src/layouts/Layout.astro (lines 43-69)

## Key Changes
- ThemeProvider: client:only → client:load (FOUC prevention)
- ErrorStateProviderWrapper: client:only → client:load (error handling)
- ThemeSwitcher: client:only → client:idle (user interaction)
- LanguageSwitcher: client:load → client:idle (optimized)
- PwaUpdater: client:load → client:idle (background task)

## Tests Added
- None - all existing 962 tests pass with new hydration strategy

## Results
- Zero client:only instances remaining
- Better progressive enhancement
- Improved TTI (Time to Interactive)
- No functional regressions

Recorded by: basic-memory-specialist