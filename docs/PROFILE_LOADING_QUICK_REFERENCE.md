# Profile Loading Optimization - Quick Reference Guide

## Key Concepts

### Profile ID Pattern
All profiles follow the pattern: `profile-{category}-{number}`
- Example: `profile-animals-001`, `profile-animals-042`, `profile-countries-015`
- The `{number}` part is zero-padded to 3 digits (001-999)
- Max count per category stored in manifest as `profileAmount`

### Manifest Structure Enhancement
```json
{
  "categories": [
    {
      "slug": "animals",
      "locales": {
        "en": {
          "name": "Animals",
          "files": ["data-1.json"],
          "profileAmount": 100  // ← NEW FIELD
        }
      }
    }
  ]
}
```

## New Services and Utilities

### 1. ManifestProfileSelectionService (`src/lib/manifestProfileSelection.ts`)

```typescript
export function selectProfileIdsByManifest(
  categories: string[],
  numberOfRounds: number,
  manifest: Manifest
): string[] {
  // Input: ["animals", "countries"], 30, manifest
  // Output: ["profile-animals-001", "profile-animals-042", ..., mixed and shuffled]
  
  // Algorithm:
  // 1. Get max profile counts for each category from manifest
  // 2. Distribute rounds evenly across categories
  // 3. For each category, randomly select from 001 to max count
  // 4. Avoid duplicates
  // 5. Return shuffled array
}
```

Key features:
- Balanced distribution (similar to current ProfileSelectionService)
- Works with profile ID patterns
- No actual profile data needed
- Returns array of profile IDs ready to load

### 2. Profile Loading by IDs (`src/lib/profileLoading.ts`)

```typescript
export async function loadProfilesByIds(
  profileIds: string[],
  locale: string,
  manifest: Manifest
): Promise<Profile[]> {
  // Input: ["profile-animals-001", "profile-animals-042", ...], "en", manifest
  // Output: [Profile{id: "profile-animals-001", ...}, ...]
  
  // Algorithm:
  // 1. Parse profileIds to extract categories
  // 2. For each category, determine which data file to fetch
  // 3. Fetch necessary files
  // 4. Extract only the requested profiles
  // 5. Return merged array
}
```

Key features:
- Fetches only necessary data files
- Extracts only requested profiles
- Handles multi-file categories gracefully
- Maintains profile order for consistency

### 3. Categories from Manifest Hook (`src/hooks/useCategoriesFromManifest.ts`)

```typescript
export function useCategoriesFromManifest() {
  // Returns: {
  //   categories: [
  //     { slug: "animals", name: "Animals", maxProfiles: 100 },
  //     { slug: "countries", name: "Countries", maxProfiles: 150 }
  //   ],
  //   isLoading: boolean,
  //   error: Error | null
  // }
  
  // Uses:
  // - fetchManifest() from src/lib/manifest.ts
  // - Extracts categories for current locale
  // - Returns with metadata (not profile data)
}
```

Key features:
- Loads only manifest (very small JSON)
- Returns localized category names
- Provides profile counts for validation
- Replaces useProfiles() for category selection

## Integration Points

### 1. CategorySelect Component Changes

**Before**:
```typescript
const { data: profilesData, isLoading } = useProfiles(); // Loads ALL profiles
const categories = Array.from(new Set(profiles.map(p => p.category))); // Extract unique
```

**After**:
```typescript
const { categories, isLoading } = useCategoriesFromManifest(); // Loads manifest only
// categories already has: slug, name, maxProfiles
```

**Benefits**:
- No profile loading needed
- Instant category list display
- Can get max rounds from `categories[i].maxProfiles`

### 2. Game Start Flow Changes

**Before**:
```typescript
startGame(categories, numberOfRounds) {
  // categories: ["Animals", "Countries"]
  // numberOfRounds: 30
  const selectedProfiles = selectProfilesForGame(
    profiles, // Already loaded in memory
    categories,
    numberOfRounds
  );
  // Game starts with profiles
}
```

**After**:
```typescript
async startGame(categories, numberOfRounds) {
  // categories: ["animals", "countries"]
  // numberOfRounds: 30
  const manifest = await fetchManifest();
  const profileIds = selectProfileIdsByManifest(
    categories,
    numberOfRounds,
    manifest
  );
  const profiles = await loadProfilesByIds(
    profileIds,
    currentLocale,
    manifest
  );
  // Game starts with lazy-loaded profiles
}
```

### 3. Game Store Updates

In `src/stores/gameStore.ts`, the `startGame()` method needs to:

```typescript
startGame: async (selectedCategories: string[], numberOfRounds?: number) => {
  const manifest = await fetchManifest();
  
  // Use new service
  const profileIds = selectProfileIdsByManifest(
    selectedCategories,
    numberOfRounds || 5,
    manifest
  );
  
  // Load only selected profiles
  const profiles = await loadProfilesByIds(
    profileIds,
    currentLocale,
    manifest
  );
  
  // Proceed with existing logic
  loadProfiles(profiles);
  // ... rest of startGame logic unchanged
}
```

## Testing Checklist

### Unit Tests

- [ ] `ManifestProfileSelectionService`
  - [ ] Balanced distribution across categories
  - [ ] Handles uneven distributions (e.g., 30 rounds, 4 categories = 8+8+7+7)
  - [ ] Random selection without duplicates
  - [ ] Shuffled output

- [ ] `loadProfilesByIds()`
  - [ ] Fetches correct data files
  - [ ] Extracts correct profiles by ID
  - [ ] Handles missing profiles gracefully
  - [ ] Maintains locale consistency

- [ ] `useCategoriesFromManifest()`
  - [ ] Loads manifest successfully
  - [ ] Extracts correct locale categories
  - [ ] Handles missing locale gracefully
  - [ ] Returns profile counts correctly

### Integration Tests

- [ ] CategorySelect displays categories from manifest
- [ ] Category selection works with new data structure
- [ ] Max rounds calculation correct from manifest
- [ ] Game start with manifest-based profile selection

### E2E Tests

- [ ] Full flow: Site load → Category selection → Game start → Game play
- [ ] Verify correct profiles loaded
- [ ] Game plays with lazy-loaded profiles
- [ ] No console errors or warnings

## Common Pitfalls

⚠️ **Don't forget to**:
1. Update manifest.json with `profileAmount` for ALL categories and locales
2. Test with locale switching (make sure profiles fetch for correct locale)
3. Handle edge cases: 1 category with 30 rounds, 6 categories with 1 round each
4. Remove all prefetch-related code (hooks, config, imports)
5. Update any existing tests that depend on `useProfiles()`

⚠️ **Profile ID validation**:
- Ensure profile IDs follow pattern: `profile-{category}-{3-digit-number}`
- Zero-pad numbers: `profile-animals-001` not `profile-animals-1`
- Category slug matches manifest slug (lowercase, hyphenated)

⚠️ **Locale handling**:
- Use `getCurrentLocale()` in hooks
- Pass locale through to profile loading
- Test with multiple locales

## Migration Checklist

- [ ] Phase 1: Manifest metadata added
- [ ] Phase 2: New services created and unit tested
- [ ] Phase 3: CategorySelect component updated
- [ ] Phase 4: Game store startGame() updated
- [ ] Phase 5: Cleanup completed
  - [ ] usePrefetchProfiles.ts removed
  - [ ] prefetch-config.ts cleaned up
  - [ ] All prefetch imports removed
  - [ ] Tests updated
- [ ] QA: `pnpm run complete-check` passes
- [ ] E2E: Full game flow works
- [ ] Performance: Verify improvements

## Code Examples

### Example: selectProfileIdsByManifest

```typescript
const selectedIds = selectProfileIdsByManifest(
  ["animals", "countries"],  // user selected categories
  30,                         // user wants 30 rounds
  manifest                    // from fetchManifest()
);
// Returns: [
//   "profile-animals-015",
//   "profile-countries-042",
//   "profile-animals-088",
//   ...
// ]
```

### Example: loadProfilesByIds

```typescript
const profiles = await loadProfilesByIds(
  ["profile-animals-015", "profile-countries-042"],
  "en",
  manifest
);
// Returns: [
//   Profile{ id: "profile-animals-015", name: "Elephant", ... },
//   Profile{ id: "profile-countries-042", name: "Brazil", ... }
// ]
```

### Example: useCategoriesFromManifest

```typescript
const { categories, isLoading, error } = useCategoriesFromManifest();
// Returns:
// categories = [
//   { slug: "animals", name: "Animals", maxProfiles: 100 },
//   { slug: "countries", name: "Countries", maxProfiles: 150 }
// ]
```

## Performance Metrics to Track

**Before Optimization**:
- CategorySelect load time: ~2 seconds (all profiles loading)
- Memory usage: ~5MB (all profiles in memory)
- Network: 6+ profile files fetched

**After Optimization**:
- CategorySelect load time: ~200ms (manifest only)
- Memory usage: ~100KB (manifest only, profiles loaded later)
- Network: 1 manifest + selected profile files

**Expected Improvement**: 90% faster, 98% less memory
