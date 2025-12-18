---
title: Task 99 Consolidate Zod Schema Definitions - Eliminate Duplication
type: note
permalink: development-logs/task-99-consolidate-zod-schema-definitions-eliminate-duplication
tags:
- development-log
- task-99
---

# Task 99 Consolidate Zod Schema Definitions - Eliminate Duplication

## Task Overview
Brief: Consolidate duplicated Zod schema definitions and associated helpers so there is a single canonical source of truth and remove legacy duplication layers.

- Task ID: 99
- Status: Done
- Implementation Date: 2025-12-17

## Objective
Main goal: Eliminate duplication of Profile-related Zod schemas and associated helper functions by consolidating them into a single canonical module and removing legacy compatibility layers.

What was accomplished:
- Consolidated duplicate schema definitions into src/types/models.ts as the single and only source of truth.
- Moved and consolidated all helper functions used across the codebase into the canonical module.
- Removed the legacy compatibility file `src/domain/game/entities/Profile.ts` and its tests; all consumers now import directly from `src/types/models`.
- Updated service imports (TurnManager, ProfileSelectionService) and their tests to use `src/types/models` directly.

## Implementation Approach
Single-layer consolidation (final implementation state):

- Canonical Source: `src/types/models.ts` is now the ONLY source for schemas, types, constants, and helpers used by the codebase.
  - All Zod schemas (profileSchema, profileMetadataSchema, profilesDataSchema) live here.
  - All 7 helper functions are consolidated alongside the schemas in this file.
  - Constants required for validation (including MAX_CLUES_PER_PROFILE derived from DEFAULT_CLUES_PER_PROFILE) are defined in this module for clarity and single-responsibility.
- Removal of legacy layer: `src/domain/game/entities/Profile.ts` was deleted entirely; there is no re-export or backward-compatibility layer — imports were migrated to the canonical module.
- Migration: Updated all consumers and tests to import schemas, helpers, and constants from `src/types/models` directly. No runtime shims or aliasing remain.

Rationale: a single canonical file reduces duplication and maintenance burden and makes the validation surface explicit and discoverable across the codebase.

## Files Changed
- `src/types/models.ts` — Now the single canonical module. Includes enhanced canonical Zod schemas, all 7 helper functions, clearer validation messages, and the new exported constant `MAX_CLUES_PER_PROFILE` (derived from `DEFAULT_CLUES_PER_PROFILE`).

- `src/domain/game/entities/Profile.ts` — DELETED. Legacy compatibility re-export was removed as part of the migration.

- `src/domain/game/entities/__tests__/Profile.test.ts` — DELETED. Tests that targeted the removed compatibility layer were removed and replaced where necessary by coverage in the unit/E2E suites that import `src/types/models` directly.

- `src/services/TurnManager.ts` and `src/services/ProfileSelectionService.ts` — Updated imports: now import schemas, helpers, and constants from `src/types/models` directly (implementation files updated accordingly).

- Tests updated to import from `src/types/models`: service unit tests and related test fixtures were changed to reference the canonical module instead of the deleted compatibility file.

- E2E tests: Removed the backward compatibility test section that asserted re-export behavior; E2E coverage focuses on canonical usage and runtime behavior.

Notes: The change set reflects a clean migration to a single canonical source and explicit deletion of obsolete compatibility artifacts.

## Tests Added / Changed
- Removed E2E backward compatibility tests that validated the (now-removed) re-export layer.
- Unit and integration tests updated to import from `src/types/models` and to assert the same behavior previously covered by compatibility tests.
- Existing test coverage preserved; tests were refactored rather than introducing duplicate checks for removed layers.

## Technical Details
- Consolidation model: Single-layer consolidation (NOT two-layer). Duplication was removed cleanly by migrating definitions and helpers to `src/types/models.ts` and deleting legacy files.
- No backward compatibility concerns remain: there is no compatibility re-export layer; all code now uses the canonical source directly.
- Helpers: All 7 helper functions are consolidated in `src/types/models.ts` alongside the Zod schemas for locality and discoverability.
- Constants: `MAX_CLUES_PER_PROFILE` was added to `src/types/models.ts` and derived from the existing `DEFAULT_CLUES_PER_PROFILE` to make validation limits explicit next to the schemas.
- Imports: Updated across services and tests — TurnManager, ProfileSelectionService, and their tests now import directly from `src/types/models`.
- Dependency graph: Verified no circular dependencies introduced by the consolidation.

## QA Results
- Lint: pnpm lint — passed
- Typecheck: pnpm typecheck — passed (no new TS errors)
- Unit tests: pnpm test — passed
- End-to-end tests: Playwright E2E suite (backward-compat tests removed) — passed
- Full QA gate: pnpm run complete-check — passed (includes lint, typecheck, test, build)

All checks executed as part of the local validation before creating this development log. (PR-level CI will re-run these checks after push/PR creation.)

## PR Link
- PR: [To be added after push]

---

Notes / Future considerations:
- With the compatibility layer removed, update any documentation references that previously pointed to the domain-layer re-export.
- Continue to monitor for any runtime differences and keep helper functions co-located with schemas unless a strong separation-of-concerns case emerges.