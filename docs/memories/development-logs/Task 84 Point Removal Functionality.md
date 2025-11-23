---
title: Task 84 Point Removal Functionality
type: note
permalink: development-logs/task-84-point-removal-functionality
---

# Task 84 — Implement point removal functionality for MC

**Task ID:** 84
**Title:** Implement point removal functionality for MC

## Summary
Allow the Master of Ceremonies (MC) to remove points from a specific player when points were awarded to the wrong player by mistake. The feature introduces a confirmation dialog, input validation, i18n support, persisted state changes, and full test coverage across unit, component, integration and E2E layers.

## Implementation Details / Development Log
- Date: 2025-11-22
- Author: automation/basic-memory-specialist

### Files Created / Modified
1. src/stores/gameStore.ts
   - Added removePoints(playerId: string, amount: number) action.
   - Validation: amount must be positive, non-zero, and cannot exceed the player's current score.
   - Floor score at zero: subtracting is clamped to not go below 0.
   - Persistence: action updates persisted state (IndexedDB) using existing persistence layer.
   - Emits appropriate error messages for invalid attempts.

2. src/components/RemovePointsDialog.tsx
   - New confirmation dialog component built reusing existing Dialog and Button components from shadcn/ui.
   - Includes amount input, real-time validation, accessible labels, and ARIA attributes for screen readers.
   - Exposes onConfirm(amount) and onCancel handlers.

3. src/components/Scoreboard.tsx
   - Added "Remove points" button per player row/icon.
   - Button opens RemovePointsDialog; dialog integration with store action dispatch.
   - Button disabled when player has 0 points.
   - Confirmation flow updates the store and closes dialog on success; shows inline error feedback on failure.

4. public/locales/en/translation.json
   - Added English translations for dialog title, labels, validation messages, button text, and success/error messages.

5. public/locales/es/translation.json
   - Added Spanish translations for the same keys.

6. public/locales/pt-BR/translation.json
   - Added Portuguese (Brazil) translations for the same keys.

7. src/stores/__tests__/gameStore.test.ts
   - Unit tests for removePoints action covering validation, error handling, clamping, and persistence interactions.

8. src/components/__tests__/RemovePointsDialog.test.tsx
   - Component tests for dialog rendering, validation UI, accessibility attributes, and confirm/cancel flows.

9. src/components/__tests__/Scoreboard.test.tsx
   - Integration tests for UI: remove button visibility, disabled state when score=0, dialog open/close, and store interaction.

10. e2e/tests/remove-points.e2e.ts
    - Playwright end-to-end test covering full flow from game creation, awarding points, removing points (with validation), and verifying persistence across navigation and reload.

### Implementation Approach
- Reused existing Dialog and Button components from shadcn/ui for consistent UI and accessibility.
- Leveraged the existing Zustand store pattern; added action with validation and persistence to IndexedDB using the same mechanisms already in place.
- Followed project's test patterns: Vitest for unit/component tests, Testing Library + user-event for interactions, and Playwright for E2E.
- Implemented i18n support for EN, ES, and PT-BR using the existing translation files.
- No explicit role management introduced — MC is implicit (device user).
- Score floor enforced at zero; attempts to remove more than current score are rejected with appropriate error messaging.

### Tests Added
- Unit tests: removePoints validation, error handling, and persistence behavior.
- Component tests: RemovePointsDialog validation and behavior, including accessibility checks.
- Integration tests: Scoreboard dialog flow and store integration.
- E2E tests: Full workflow from game creation to score removal and ensuring persistence.
- QA: All tests passing locally (see QA status below).

### Features Implemented
- Remove points button visible on scoreboard for each player.
- Button disabled when player has 0 points.
- Confirmation dialog with amount input.
- Real-time validation: amount must be positive, non-zero, and cannot exceed player's current score.
- Helpful error messages and inline validation feedback.
- Score persists to IndexedDB via existing persistence layer.
- Accessibility: keyboard navigation, focus management, and screen reader labels.
- Multilingual support (English, Spanish, Portuguese-BR).

### QA Status
- Lint: Passed
- TypeCheck: Passed
- Tests: All 406 tests passing
- Build: Succeeded
- Complete-check: Passed

### Notes and Future Considerations
- Role management remains implicit; if explicit MC roles are needed later, an authorization gating layer should be added around the UI controls.
- Consider an audit log for score changes if traceability is required.

---

This development log documents the full implementation and verification for Task 84.
