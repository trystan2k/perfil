---
description: Review profiles for data quality and consistency across all categories in the Perfil project.
agent: build
---

## 🔍 PROFILE REVIEW WORKFLOW

This command provides a comprehensive review of profile data across all categories to ensure quality, consistency, and correctness.

### Overview

The review checks 22 critical validation points across all categories:
- **Data Structure**: Profile counts, IDs, sequences
- **Content Quality**: Clues, translations, duplicates
- **Configuration Sync**: manifest.json and profiles.config.json alignment
- **Language Consistency**: Proper translations, no language mixing
- **File Integrity**: JSON validity, no corruption

---

## 📋 REVIEW CHECKLIST

### Phase 1: Data Structure Validation

#### Check 1: Profile Count
- **Description**: All categories must have exactly 100 profiles in each language file
- **Action**: Count profile objects in EN, ES, PT-BR data files
- **Command**: Read entire data-1.json file and count profiles array
- **Expected**: EN: 100, ES: 100, PT-BR: 100

#### Check 2: Profile ID Format
- **Description**: All profile IDs must follow format `profile-{category-prefix}-XXX`
- **Action**: Scan all profile IDs in data files
- **Examples**: 
  - Technology: `profile-tech-001` to `profile-tech-100`
  - Animals: `profile-animals-001` to `profile-animals-100`
  - Movies: `profile-movies-001` to `profile-movies-100`
- **Expected**: All IDs match correct format for category

#### Check 3: Sequential ID Sequence
- **Description**: Profile IDs must be sequential from 001 to 100 with no gaps
- **Action**: Extract all ID numbers and check for continuity
- **Expected**: [1, 2, 3, ..., 98, 99, 100] with no missing numbers

#### Check 4: ID Consistency Across Languages
- **Description**: Same profile ID must exist in all three language files (EN, ES, PT-BR)
- **Action**: Compare profile IDs across language files
- **Expected**: Identical ID sets in all three files

#### Check 5: Profile Clues Count
- **Description**: Each profile must have exactly 20 clues in every language
- **Action**: Count clues array length for each profile
- **Expected**: All profiles have length 20

---

### Phase 2: Content Quality Validation

#### Check 6: Category Values
- **Description**: Category field must have correct language-specific values
- **Action**: Check category field for each profile
- **Expected Values**:
  - EN: "Technology" (or appropriate category in English)
  - ES: "Tecnología" (or appropriate Spanish translation)
  - PT-BR: "Tecnologia" (or appropriate Portuguese translation)

#### Check 7: Duplicate Profile Names
- **Description**: No profile name should appear twice within the same language file
- **Action**: Extract all profile names per language and check for duplicates
- **Expected**: All profile names unique within each file (case-insensitive check)

#### Check 8: English Clues in Spanish/Portuguese Files
- **Description**: Spanish and Portuguese files must not contain English clues
- **Action**: Compare clue sets between EN and ES/PT files
- **Expected**: No exact matches of English clues in other language files

#### Check 9: Profile Name in Clues
- **Description**: Profile name should not appear as a clue in its own profile
- **Action**: For each profile, check if name appears in any of its 20 clues
- **Expected**: Profile name should not appear (minor exceptions acceptable for context)

#### Check 10: Clue Quality - Natural Phrases
- **Description**: All clues must be natural phrases with 2+ words, not single words
- **Action**: Check clue word count for each profile
- **Expected**: No single-word clues

#### Check 11: Clue Character Escaping
- **Description**: Clues should not have escaped special characters
- **Action**: Check for backslash escaping of apostrophes, hyphens, accents
- **Expected**: Raw characters preserved (e.g., "it's" not "it\'s", "café" not "caf\u00e9")

---

### Phase 3: Configuration Sync Validation

#### Check 12: Manifest.json Profile Counts
- **Description**: manifest.json must show correct profile counts for all locales
- **Action**: Read manifest.json and check technology/category counts
- **Expected**: 
  - `categories[X].locales.en.profileAmount: 100`
  - `categories[X].locales.es.profileAmount: 100`
  - `categories[X].locales.pt-BR.profileAmount: 100`

#### Check 13: profiles.config.json Profile Names
- **Description**: profiles.config.json must contain all English profile names matching data files
- **Action**: Compare profile names in config with EN data file
- **Expected**: Exact match of 100 English profile names in same order

#### Check 14: JSON Syntax Validity
- **Description**: All JSON files must have valid syntax without escaping issues
- **Action**: Validate JSON parsing for manifest.json and profiles.config.json
- **Expected**: All files parse successfully without syntax errors

#### Check 15: Complete JSON File Validation
- **Description**: All data JSON files must have valid syntax
- **Action**: Validate syntax for all EN, ES, PT-BR data files
- **Expected**: All files parse successfully

---

### Phase 4: Translation & ID Consistency

#### Check 16: Profile Name Translation Consistency
- **Description**: Same profile ID should have consistent name translations
- **Action**: For each profile ID, verify EN/ES/PT names are proper translations
- **Expected**: Names represent same profile in different languages

#### Check 17: Corrupted Profile Detection
- **Description**: No profiles should have mismatched names and clues
- **Action**: Verify profile name matches its clue content
- **Expected**: Profile name and clues describe same entity

#### Check 18: Profile ID Sequence Gaps
- **Description**: Profile IDs must be sequential with no gaps (001-100)
- **Action**: Extract all ID numbers and verify continuity; regenerate if gaps found
- **Gap Detection**:
  - Extract numeric part from each ID (e.g., "profile-tech-045" → 45)
  - Sort all IDs numerically
  - Check for missing numbers between 1 and 100
  - Report any gaps found
- **Auto-Fix if Gaps Found**:
  - Sort profiles by current ID number
  - Regenerate IDs sequentially: profile-{prefix}-001 through profile-{prefix}-100
  - Update all three language files (EN, ES, PT-BR)
  - Update manifest.json and profiles.config.json accordingly
- **Expected**: Continuous sequence [1, 2, 3, ..., 98, 99, 100] with no missing numbers

#### Check 19: ID Prefix in Manifest
- **Description**: manifest.json idPrefix must match category convention
- **Action**: Check idPrefix field for each category
- **Expected Examples**:
  - Technology: `"idPrefix": "tech"`
  - Animals: `"idPrefix": "animals"`
  - Movies: `"idPrefix": "movies"`

---

### Phase 5: Metadata & Final Quality

#### Check 20: Clue Quality Assessment
- **Description**: Clues should be natural, comprehensive, and well-phrased
- **Action**: Sample and review clue content for quality
- **Expected**: Natural language, informative, varied content

#### Check 21: Orphaned Profiles Check
- **Description**: No orphaned profiles in config that don't exist in data files
- **Action**: Verify all profiles in config exist in EN data file
- **Expected**: 100% match between config and data files

#### Check 22: Profile Metadata Fields
- **Description**: All profiles should have metadata fields (language, difficulty, source)
- **Action**: Check metadata object for each profile
- **Expected**: Present fields: language, difficulty, source

#### Check 23: Summary Report & Actionable TODO List
- **Description**: Generate comprehensive summary with any issues and action items
- **Action**: Compile all check results and create actionable TODO list
- **Expected**: Clear report identifying any problems and next steps

---

## 🔧 ID SEQUENCE GAP DETECTION & AUTO-FIX

### What This Check Does

The ID sequence gap check automatically:
1. Detects any missing profile IDs in the sequence
2. Identifies gaps (e.g., missing IDs 61-70)
3. Automatically regenerates IDs sequentially if gaps found
4. Updates all three language files simultaneously
5. Synchronizes manifest.json and profiles.config.json

### Gap Detection Algorithm

```
1. Extract numeric part from all profile IDs
2. Sort numerically to get: [1, 2, 3, ..., 100]
3. Check for missing numbers in sequence
4. If gaps found:
   - Sort profiles by current ID
   - Assign new sequential IDs: 001-100
   - Update all profile objects
   - Save all three language files
   - Update manifest counts
   - Update config profile list
5. Report results (gaps found, auto-fixed, or clean)
```

### Example Scenario

**Before Fix:**
```
EN file IDs: 1-60, 71-100 (missing 61-70)
ES file IDs: 1-60, 71-100 (missing 61-70)
PT-BR file IDs: 1-60, 71-100 (missing 61-70)
```

**After Fix (Automatic):**
```
EN file IDs: 1-100 (sequential)
ES file IDs: 1-100 (sequential)
PT-BR file IDs: 1-100 (sequential)
All profiles renumbered to fill gaps
Manifest & config updated automatically
```

### When Regeneration Happens

Auto-fix triggers when:
- Gaps detected in ID sequence
- IDs are not 001-100 range
- Multiple sequences found (e.g., 001-050 and 075-100)

Manual fix may be needed if:
- Gaps are intentional (rare)
- External systems reference old IDs
- Historical data needs preservation

---

## 🚀 HOW TO USE THIS COMMAND

### Usage Format

```
@.opencode/command/review-profiles category [specific-check]
```

### Examples

**Review entire technology category:**
```
@.opencode/command/review-profiles technology
```

**Review specific check on technology:**
```
@.opencode/command/review-profiles technology check-6
```

**Review all categories:**
```
@.opencode/command/review-profiles all
```

**Review multiple categories:**
```
@.opencode/command/review-profiles technology animals movies
```

---

## 📊 EXECUTION STEPS

### Step 1: Determine Scope
- Parse command arguments to identify which categories to review
- If "all" specified, review: animals, brands, famous-people, geography, history, literature, movies, music, sports, technology

### Step 2: Load Data Files
For each category:
- Load EN data file: `public/data/{category}/en/data-1.json`
- Load ES data file: `public/data/{category}/es/data-1.json`
- Load PT-BR data file: `public/data/{category}/pt-BR/data-1.json`
- Load manifest.json and profiles.config.json

### Step 3: Execute Checks
Run all 23 checks for each category:
1. Profile count (EN, ES, PT-BR)
2. ID format validation
3. Sequential ID check
4. ID consistency across languages
5. Clue count validation
6. Category values
7. Duplicate names
8. English clues in other languages
9. Profile name in clues
10. Clue natural phrases
11. Character escaping
12. Manifest counts
13. Config profile names
14. JSON syntax (config files)
15. JSON syntax (data files)
16. Name translation consistency
17. Corrupted profile detection
18. ID sequence gaps detection and auto-fix
19. ID prefix matching
20. Clue quality assessment
21. Orphaned profiles
22. Metadata fields
23. Generate summary report

### Step 4: Report Results

For each check, report:
- ✅ PASS - Check succeeded
- ⚠️ WARNING - Minor issue found
- ❌ FAIL - Critical issue found

Provide:
- Summary statistics
- List of any issues found
- Actionable TODO list for fixes
- Recommendations

---

## 📋 REPORT FORMAT

```
================================================================================
PROFILE REVIEW REPORT - {category}
================================================================================

📊 SUMMARY
- Total Categories Reviewed: {count}
- Total Profiles Checked: {count}
- Critical Issues: {count}
- Warnings: {count}
- Checks Passed: {count}/22

✅ PASSED CHECKS
- Check 1: Profile Count
- Check 2: Profile ID Format
- ... (list all passed)

⚠️ WARNINGS
- {category}: Check 7 - 2 duplicate profile names found
- ... (list warnings)

❌ CRITICAL ISSUES
- {category}: Check 3 - IDs not sequential (missing: 45, 67)
- ... (list failures)

📝 ACTIONABLE TODO LIST
1. Fix ID sequence gaps in {category}
   - Missing IDs: [list]
   - Action: Regenerate IDs sequentially

2. Remove duplicates in {category}
   - Duplicates: [list]
   - Action: Rename or remove second occurrence

3. Update manifest.json
   - {category}: EN=98, ES=98, PT-BR=98 (should be 100)
   - Action: Update profile counts

... (more action items)

================================================================================
NEXT STEPS
================================================================================
1. Address critical issues first
2. Resolve warnings for completeness
3. Run review again to confirm all fixes
4. Prepare changes for commit
================================================================================
```

---

## 🎯 SUCCESS CRITERIA

A successful review results in:
- ✅ 23/23 checks passed for all categories
- ✅ 0 critical issues
- ✅ 0 warnings
- ✅ All profile counts: 100 per language
- ✅ All IDs sequential: 001-100
- ✅ All translations consistent
- ✅ No duplicates or corruption
- ✅ manifest.json and config.json synchronized

---

## ⚠️ CRITICAL RULES FOR REVIEW

### Data Integrity
- ✅ **ALWAYS** read entire JSON files (they can be large)
- ✅ **ALWAYS** check all three languages
- ✅ **ALWAYS** verify counts programmatically
- ❌ **NEVER** assume data integrity without verification
- ❌ **NEVER** skip checking any category

### Reporting
- ✅ **ALWAYS** provide actionable recommendations
- ✅ **ALWAYS** list specific items with issues
- ✅ **ALWAYS** include exact line numbers/IDs when referring to issues
- ❌ **NEVER** report generic "some issues found"
- ❌ **NEVER** provide recommendations without details

### Issue Categorization
- ✅ Use ❌ CRITICAL for: missing profiles, invalid IDs, file corruption, missing data
- ✅ Use ⚠️ WARNING for: minor inconsistencies, optional fields, edge cases
- ✅ Use ✅ PASS for: all checks where no issues found

---

## 📖 EXAMPLE REVIEW OUTPUT

```
================================================================================
PROFILE REVIEW REPORT - technology
================================================================================

📊 SUMMARY
- Categories Reviewed: 1
- Total Profiles Checked: 100
- Critical Issues: 0
- Warnings: 0
- Checks Passed: 22/22

✅ PASSED CHECKS (23/23)
✓ Check 1: Profile Count (EN: 100, ES: 100, PT-BR: 100)
✓ Check 2: Profile ID Format (all use profile-tech-XXX)
✓ Check 3: Sequential ID Sequence (001-100, no gaps)
✓ Check 4: ID Consistency (identical across EN/ES/PT-BR)
✓ Check 5: Clues Count (all profiles: 20 clues)
✓ Check 6: Category Values (EN: Technology, ES: Tecnología, PT-BR: Tecnologia)
✓ Check 7: Duplicate Names (no duplicates found)
✓ Check 8: No English Clues in ES/PT (verified)
✓ Check 9: Profile Names in Clues (not found)
✓ Check 10: Natural Phrases (all 2000+ clues are phrases)
✓ Check 11: Character Escaping (no escaping detected)
✓ Check 12: Manifest Counts (all correct: 100)
✓ Check 13: Config Profile Names (100 names, all match EN)
✓ Check 14: Config JSON Syntax (valid)
✓ Check 15: Data Files JSON Syntax (all valid)
✓ Check 16: Name Translation Consistency (proper translations)
✓ Check 17: Corrupted Profiles (none detected)
✓ Check 18: ID Sequence Gaps (no gaps detected)
✓ Check 19: ID Prefix (manifest: "tech" ✓)
✓ Check 20: Clue Quality (natural, comprehensive)
✓ Check 21: Orphaned Profiles (none found)
✓ Check 22: Metadata Fields (all present)
✓ Check 23: Summary Report (ready)

📋 ID SEQUENCE CHECK DETAILS
- Check Type: Automatic Gap Detection & Auto-Fix
- Gaps Detected: 0
- Profiles Regenerated: 0
- Status: All IDs sequential (001-100) ✓

================================================================================
✅ REVIEW COMPLETE - ALL 23 CHECKS PASSED
================================================================================

All 100 profiles in Technology category are valid and consistent!
- No ID sequence gaps found
- All IDs properly sequential
- Ready for production use
```

---

## 🔄 REVIEW WORKFLOW CYCLE

1. **Plan**: Decide which categories to review
2. **Execute**: Run this command for target categories
3. **Analyze**: Review the generated report
4. **Address**: Fix any issues found
5. **Re-verify**: Run review again on fixed categories
6. **Confirm**: Ensure all checks pass
7. **Commit**: Ready to commit changes

---

## 📚 CATEGORIES TO REVIEW

- animals
- brands
- famous-people
- geography
- history
- literature
- movies
- music
- sports
- technology

---

## 🎯 MAINTENANCE SCHEDULE

**Recommended Review Frequency:**
- After creating new profiles (every time)
- Monthly comprehensive audit (all categories)
- Before production releases
- After merging profile changes
- When user reports data issues
