# Profile Loading Optimization Plan

## Overview

This plan describes a significant optimization to how categories and profiles are loaded in the application. The goal is to eliminate the need to load all profiles upfront and instead use lazy loading based on manifest data.

## Current State

### Problems with Current Implementation

1. **Category Discovery**: Categories are extracted by loading ALL profiles across all categories and then extracting unique category values
   - Requires fetching entire profile datasets just to display category options
   - `useProfiles()` in CategorySelect loads all profiles immediately
   - `usePrefetchProfiles()` prefetches popular categories hardcoded in config

2. **Profile Selection**: 
   - ProfileSelectionService receives all loaded profiles
   - Selects profiles to play based on available data
   - Works fine but relies on having all data in memory

3. **Game Start Flow**:
   - User selects categories and rounds
   - All profiles from those categories are already loaded
   - Game starts with pre-loaded data

## Proposed Solution

### Part 1: Category Discovery from Manifest

**Goal**: Get all available categories and localized names WITHOUT loading any profile data

**Implementation**:
1. Enhance `manifest.json` structure to include profile count metadata:
   ```json
   {
     "version": "1",
     "generatedAt": "2025-12-14T16:40:57.994Z",
     "categories": [
       {
         "slug": "famous-people",
         "locales": {
           "en": {
             "name": "Famous People",
             "files": ["data-1.json"],
             "profileAmount": 100  // NEW: Total profiles in this category
           },
           "es": {
             "name": "Personas Famosas",
             "files": ["data-1.json"],
             "profileAmount": 100
           },
           ...
         }
       },
       ...
     ]
   }
   ```

2. Create new hook: `useCategoriesFromManifest()`
   - Fetches only manifest.json
   - Extracts categories with localized names
   - Returns category list for current locale
   - No profile loading required

3. Create utility: `getCategoriesFromManifest(locale)`
   - Parses manifest and returns available categories
   - Used by CategorySelect component

4. Update CategorySelect component:
   - Replace `useProfiles()` with `useCategoriesFromManifest()`
   - Get max available profiles per category from manifest data
   - Remove `usePrefetchProfiles()` hook (no longer needed)
   - Calculate max rounds from selected categories' manifest counts

**Benefits**:
- Single small JSON file load instead of multiple large profile files
- Instant category display
- No need to load profiles until game actually starts
- Smaller initial bundle and faster page load

### Part 2: Lazy Profile Selection and Loading

**Goal**: Select and load profiles only when game starts, based on manifest-informed selection

**Implementation**:

1. Create new service: `ManifestProfileSelectionService`
   - **Input**: Selected categories, number of rounds, manifest data
   - **Logic**:
     - Use category.slug pattern: `profile-{category}-{number}`
     - For each selected category, randomly select N profile IDs
     - Balance selection across categories (same as current ProfileSelectionService)
      - Return array of profile IDs to load (e.g., `["profile-animals-001", "profile-animals-042", "profile-geography-015", ...]`)
   - **Output**: Array of profile IDs in random order, ready to load

   ```typescript
   export function selectProfileIdsByManifest(
     categories: string[],
     numberOfRounds: number,
     manifest: Manifest
   ): string[] {
     // For each category, get max profile count from manifest
     // Randomly select profileIds until we have numberOfRounds
     // Distribute evenly across categories
     // Return shuffled array of profile IDs
   }
   ```

2. Create utility: `loadProfilesByIds(profileIds, locale)`
   - Takes array of profile IDs
   - Determines which data files contain these profiles
   - Fetches minimal necessary files
   - Returns only requested profiles
   - Optimization: Use manifest to know which file contains which ID range

   ```typescript
   export async function loadProfilesByIds(
     profileIds: string[],
     locale: string,
     manifest: Manifest
   ): Promise<Profile[]> {
     // Parse profileIds to extract categories
     // For each category, fetch necessary data files
     // Extract only the requested profiles from the files
     // Return merged array
   }
   ```

3. Update game flow in `startGame()` action:
   - Old: `loadProfiles(allLoadedProfiles)` 
   - New: 
     ```typescript
     const selectedProfileIds = selectProfileIdsByManifest(
       categories,
       numberOfRounds,
       manifest
     );
     const selectedProfiles = await loadProfilesByIds(
       selectedProfileIds,
       locale,
       manifest
     );
     loadProfiles(selectedProfiles);
     ```

4. Update game store's `startGame()` method:
   - Accept selected categories and round count (already has these)
   - Call ManifestProfileSelectionService
   - Load only required profiles
   - Proceed with game initialization

**Benefits**:
- Profiles are loaded only when needed (lazy loading)
- Only necessary data files are fetched
- Reduced network bandwidth
- Better memory usage
- No change to game logic or UI flow

### Part 3: Manifest Data Files Discovery

**Goal**: Optimize file loading to know which profiles are in which files

- Extend manifest to include profile ID ranges per file:
  ```json
  {
    "slug": "animals",
    "locales": {
      "en": {
        "name": "Animals",
        "files": [
          {
            "filename": "data-1.json",
            "profileRange": { "min": 1, "max": 100 }
          }
        ],
        "profileAmount": 100
      }
    }
  }
  ```

## Files to Modify/Create

### New Files
1. `src/lib/manifestProfileSelection.ts` - ManifestProfileSelectionService
2. `src/lib/profileLoading.ts` - Profile ID-based loading utilities
3. `src/hooks/useCategoriesFromManifest.ts` - Category loading hook

### Modified Files
1. `src/components/CategorySelect.tsx` - Use new hooks/services
2. `src/stores/gameStore.ts` - Update startGame() method
3. `public/data/manifest.json` - Add profileAmount field to all categories
4. `src/lib/manifest.ts` - Update types if needed

### Files to Consider Removing
1. `src/lib/prefetch-config.ts` - No longer needed (no prefetch strategy)
2. `src/hooks/usePrefetchProfiles.ts` - No longer needed
3. References to prefetch throughout codebase

## Implementation Phases

### Phase 1: Add Metadata to Manifest
1. Update `public/data/manifest.json` to include `profileAmount` for each category/locale
2. Update TypeScript types in `src/lib/manifest.ts`

### Phase 2: Create New Services and Hooks
1. Create `ManifestProfileSelectionService`
2. Create `loadProfilesByIds()` utility
3. Create `useCategoriesFromManifest()` hook

### Phase 3: Update CategorySelect Component
1. Replace `useProfiles()` with `useCategoriesFromManifest()`
2. Remove `usePrefetchProfiles()` hook
3. Update category list display
4. Update rounds calculation from manifest metadata

### Phase 4: Update Game Start Flow
1. Integrate manifest-based profile selection in `startGame()` action
2. Fetch only required profile IDs
3. Load only necessary data files

### Phase 5: Cleanup
1. Remove `usePrefetchProfiles.ts`
2. Clean up `prefetch-config.ts` if no longer needed
3. Remove prefetch-related code from components
4. Update tests accordingly

## Testing Strategy

### Unit Tests
- `ManifestProfileSelectionService`: Test balanced distribution
- `loadProfilesByIds()`: Test file fetching and filtering
- `useCategoriesFromManifest()`: Test manifest parsing

### Integration Tests
- CategorySelect flow: manifest → categories → category selection
- Game start flow: category selection → profile ID selection → profile loading → game start
- Verify correct profiles are loaded by IDs

### E2E Tests
- Full game flow: Category selection → Rounds input → Game start
- Verify game loads correct profiles and plays correctly

## Performance Impact

### Expected Improvements
- **Initial Load**: ~90% faster (1 small manifest.json vs 6 large profile files)
- **CategorySelect Page Load**: Immediate (no profile loading)
- **Game Start**: Minimal delay (loading only selected profiles instead of all)
- **Memory**: Significantly reduced (only game profiles in memory, not all)
- **Network**: Optimized file fetching (only necessary files)

### Benchmarks to Capture
- Time to display categories (currently blocked by profile loading)
- Memory usage during CategorySelect
- Network bandwidth for initial page and game start

## Risk Assessment

### Low Risk
- Service layer approach keeps changes isolated
- Existing game logic unchanged
- Profile structure (IDs) unchanged
- Tests can verify behavior incrementally

### Mitigation
- Maintain fallback to profile loading if manifest is unavailable
- Add comprehensive tests for new services
- Verify profile ID patterns match generator output

## Success Criteria

1. ✅ Categories display without loading profiles
2. ✅ Profiles load only when game starts
3. ✅ Game works exactly as before (same logic, same flow)
4. ✅ Only necessary data files are fetched
5. ✅ All tests pass
6. ✅ Performance metrics improved (faster initial load, less memory)
7. ✅ E2E tests verify full game flow works correctly

## Timeline Estimate

- Phase 1: 15 minutes (manifest update)
- Phase 2: 1-2 hours (services and hooks)
- Phase 3: 30 minutes (component update)
- Phase 4: 30 minutes (game store integration)
- Phase 5: 30 minutes (cleanup)
- Testing: 1-2 hours (unit, integration, E2E)

**Total: 4-5 hours of focused work**
