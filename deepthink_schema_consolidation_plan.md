# DEEPTHINK PLAN: Schema Consolidation
## Task: Consolidate duplicate Profile schemas from models.ts and Profile.ts

---

## TASK ANALYSIS

### Main Objective
Consolidate duplicate Profile-related schemas and validation logic from two files into a single canonical source while preserving all functionality and minimizing breaking changes.

### Current State Summary
- **Duplicate Schemas**: Profile, ProfileMetadata, and ProfilesData schemas exist in both models.ts and Profile.ts
- **Helper Functions**: 7 critical and utility functions exist ONLY in Profile.ts
- **Validation Approach**: Profile.ts has detailed error messages; models.ts has none
- **Architecture**: models.ts is type layer; Profile.ts is domain entity layer
- **Usage Pattern**: Both files are imported; models.ts schemas used for validation in hooks/lib, Profile.ts functions used in services

### Identified Dependencies
1. **Direct schema validation users**: useProfiles.ts, profileDataQuery.ts, manifest.ts (use models.ts)
2. **Helper function users**: TurnManager.ts, ProfileSelectionService.ts (use Profile.ts)
3. **Type users**: Widespread across codebase (use both, but models.ts primary)
4. **Test coverage**: 661 lines (models.ts), 600 lines (Profile.ts)

### System Impact Assessment
- **Critical**: getClue() function (game logic), filterProfilesByCategory() (game logic)
- **Important**: Validation functions (tests, data integrity)
- **Low**: Utility functions (category operations)
- **Risk Level**: LOW - no circular dependencies, clean separation of concerns

---

## CHOSEN APPROACH: Smart Consolidation Strategy

### Solution Philosophy
**Simplicity + Pragmatism**: Consolidate to models.ts as canonical source while preserving Profile.ts as a convenience export layer for domain-specific functions.

### Why This Approach
1. **Full merge into Profile.ts**: Would contaminate domain layer with generic game schemas
2. **Full merge into models.ts**: Works but loses semantic grouping
3. **Two-layer export (CHOSEN)**: models.ts is source of truth, Profile.ts re-exports domain helpers
4. **New file**: Unnecessary complexity

### Key Decisions
1. **Canonical Source**: src/types/models.ts (already contains GameSession, Player, TurnState)
2. **Metadata schema**: Use `.catchall(z.unknown())` for flexibility (more permissive)
3. **Error messages**: Add comprehensive messages for better UX
4. **Constants**: Use DEFAULT_CLUES_PER_PROFILE throughout
5. **Metadata fields**: Include author, tags, description (needed by some data)
6. **Helper functions**: Add all 7 functions to models.ts, re-export from Profile.ts
7. **Validation functions**: Move to models.ts, re-export from Profile.ts

---

## IMPLEMENTATION STEPS

### Step 1: Enhance src/types/models.ts

**Update profileMetadataSchema**:
- Change from `.strict()` to `.catchall(z.unknown()).optional()`
- Keep all 6 fields: language, difficulty, source, author, tags, description
- Add error messages

**Update profileSchema**:
- Add error messages to each field
- Keep clues max at 100 (enough for data + flexibility)
- Add error message to clues validation

**Update profilesDataSchema**:
- Add error message to profiles array

**Add import**:
```typescript
import { DEFAULT_CLUES_PER_PROFILE } from '../lib/constants';
```

**Add 7 helper functions** from Profile.ts:
- validateProfile()
- validateProfilesData()
- getClue()
- getClueCount()
- filterProfilesByCategory()
- groupProfilesByCategory()
- getUniqueCategories()

### Step 2: Update Profile.ts to be re-export layer

**Import from models.ts**:
```typescript
import {
  profileSchema,
  profileMetadataSchema,
  profilesDataSchema,
  validateProfile,
  validateProfilesData,
  getClue,
  getClueCount,
  filterProfilesByCategory,
  groupProfilesByCategory,
  getUniqueCategories,
  type Profile,
  type ProfileMetadata,
  type ProfilesData,
} from '../../types/models';
```

**Add PascalCase re-exports for backward compatibility**:
```typescript
export const ProfileSchema = profileSchema;
export const ProfileMetadataSchema = profileMetadataSchema;
export const ProfilesDataSchema = profilesDataSchema;
export type { Profile, ProfileMetadata, ProfilesData };
```

**Re-export functions**:
```typescript
export {
  validateProfile,
  validateProfilesData,
  getClue,
  getClueCount,
  filterProfilesByCategory,
  groupProfilesByCategory,
  getUniqueCategories,
};
```

### Step 3: Update Tests

**Add to models.test.ts**:
- Helper function tests (getClue, filterProfilesByCategory, groupProfilesByCategory, getUniqueCategories)
- Validation function tests (validateProfile, validateProfilesData)

**Keep in Profile.test.ts**:
- Helper function tests (integrated with other profile tests)
- Remove duplicate schema validation tests (only test via models.test.ts)

### Step 4: Verify Imports

**No changes needed to**:
- TurnManager.ts (uses Profile.ts re-exports - still works)
- ProfileSelectionService.ts (uses Profile.ts re-exports - still works)
- useProfiles.ts, profileDataQuery.ts, manifest.ts (already use models.ts)

**Outcome**: Complete backward compatibility

---

## VALIDATION CHECKPOINTS

1. **Schema Enhancement**: All functions added, imports correct, tests pass
2. **Profile.ts Re-exports**: All re-exports working, no import errors
3. **Type Safety**: No TypeScript errors, type inference correct
4. **Runtime Validation**: Schemas validate correctly, helpers work
5. **Test Coverage**: All tests pass, coverage maintained
6. **Integration**: TurnManager, ProfileSelectionService work, game flow works

---

## SUCCESS CRITERIA

1. **No Duplication**: Same schema defined in exactly one place (models.ts)
2. **Backward Compatibility**: All current imports work without changes
3. **Improved Quality**: Error messages, constants used, comprehensive validation
4. **Type Safety**: No new TypeScript errors
5. **Test Coverage**: All original tests pass + new tests
6. **Zero Breakage**: Game functionality unchanged, all imports still work
7. **Clean Architecture**: models.ts is canonical, Profile.ts is convenience layer

---

## RISK ASSESSMENT

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Breaking Profile.ts imports | HIGH | LOW | Keep re-export layer |
| Metadata schema changes | MEDIUM | LOW | Use catchall (permissive) |
| Test failures | MEDIUM | MEDIUM | Run tests after each step |
| Clue limit issues | LOW | LOW | Keep 100 max in schema |

---

## IMPLEMENTATION ORDER (MANDATORY)

1. Backup current state
2. Enhance models.ts (add functions, update schemas)
3. Update models.test.ts (add helper tests)
4. Run `pnpm test` - verify all pass
5. Consolidate Profile.ts (add re-exports)
6. Run `pnpm test` - verify all pass
7. Run complete integration test suite
8. Verify all imports work
9. Manual smoke test of game

---

## ROLLBACK PLAN

If issues occur:
1. Revert Profile.ts to original
2. Revert models.ts changes
3. Run `pnpm test` to confirm
4. Assess issues, retry specific checkpoint

---

## DELIVERABLES

1. Enhanced models.ts with all schemas, types, and functions
2. Updated Profile.ts as re-export layer
3. Consolidated tests in models.test.ts + Profile.test.ts
4. Zero breaking changes (backward compatible)
5. Comprehensive error messages and validation
6. Clean, maintainable architecture
