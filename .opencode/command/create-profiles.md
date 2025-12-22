---
description: Create new profiles for the Perfil project using markdown-first workflow.
agent: build
---

## 🔄 WORKFLOW OVERVIEW

This command follows a **markdown-first approach** with multiple approval gates to ensure quality and avoid duplicates.

### Phase 1: Profile Names Generation (English Only)

1. Ask user for category and number of profiles
2. Read existing profiles from data JSON files to check for duplicates
3. Generate N profile names in ENGLISH only (no clues yet), not less, not more than the number requested.
4. Check for duplicates against existing profiles
5. If duplicates found: remove and replace with new unique profiles
6. **APPROVAL GATE 1**: Show list to user and wait for approval

### Phase 2: Clues Generation (English Only)

7. For each approved profile name, generate 20 clues in English. DO NOT NEED TO SHOW ME, just generate and store in the markdown file, I will review the files directly.
8. Clues must be natural, concise, comprehensive phrases (not just words)
9. Follow difficulty progression: 5 hard → 5 medium → 10 easy
10. **APPROVAL GATE 2**: Once the file is written at the indicated location, I will review the file and approve it, do not need to show the clues in the screen, I will look directly in the file.

### Phase 3: Translations (Spanish & Portuguese)

11. Create Spanish translations with natural localization
12. Create Portuguese (pt-BR) translations with natural localization
13. Save as markdown files: `{category}_en.md`, `{category}_es.md`, `{category}_pt-BR.md` in `docs/tmp/`
14. **APPROVAL GATE 3**: Once the files are written at the indicated location, I will review the files and approve them, do not need to show the clues in the screen, I will look directly in the files.

### Phase 4: JSON Integration

15. Use `@scripts/markdown_to_json.py` to convert markdown to JSON
16. Update data JSON files for all languages (en, es, pt-BR)
17. Update `public/data/manifest.json` with new profile counts
18. Update `config/profiles.config.json` with new profile entries
19. Validate all JSON files are correct and valid
20. **FINAL VERIFICATION**: Report completion with file counts

---

## 📋 PHASE 1: PROFILE NAMES GENERATION

### Step 1.1: Read Configuration

```
Read: config/profiles.config.json
Read: config/profiles.schema.json
Read: public/data/{category}/{lang}/data-*.json (all files for the category)
```

### Step 1.2: Extract Existing Profile Names

- Parse all JSON files for the requested category
- Extract all existing profile names (for duplicate checking)
- Note: Check across ALL languages to catch variations

### Step 1.3: Generate Profile Names (English)

- Generate exactly N profile names (user requested amount)
- Names should be in ENGLISH only
- Follow category guidance (see below)
- Ensure diversity and quality

### Step 1.4: Duplicate Check

```python
# Pseudo-code for duplicate checking
existing_names = get_all_existing_profile_names(category)
new_names = generate_profile_names(count=N)

duplicates = []
for name in new_names:
    if name.lower() in [e.lower() for e in existing_names]:
        duplicates.append(name)

if duplicates:
    # Remove duplicates and generate replacements
    new_names = remove_and_replace(new_names, duplicates)
```

### Step 1.5: Present to User (APPROVAL GATE 1)

**Format:**

```
Generated {N} new {category} profiles:

1. Profile Name 1
2. Profile Name 2
3. Profile Name 3
...
N. Profile Name N

✓ No duplicates found (checked against {X} existing profiles)

Do you approve these profile names? (yes/no)
```

**Wait for user response before proceeding.**

---

## 📝 PHASE 2: CLUES GENERATION

### Step 2.1: Generate 20 Clues per Profile (English Only)

For each approved profile name:

- Research the profile topic thoroughly
- Create exactly 20 clues following this structure:
  - **Clues 1-5**: Hard (obscure facts, technical details, less known information)
  - **Clues 6-10**: Medium (moderately known facts, specific details)
  - **Clues 11-20**: Easy (well-known facts, obvious characteristics)

### Step 2.2: Clue Quality Requirements

✅ **DO:**

- Write natural, complete sentences or phrases
- Make clues comprehensible and informative
- Include varied information (dates, people, events, characteristics)
- Progress from hard to easy difficulty
- Avoid profile name in clues

❌ **DON'T:**

- Use just words without context
- Create word salads or fragments
- Include obvious giveaways in early clues
- Repeat information across clues
- Use profile name directly
- Escape special characters (e.g., apostrophes, hyphens, accents), keep them as-is, always in all files/languages

### Step 2.3: Format as Markdown

Create temporary markdown content:

```markdown
1. Profile Name 1
- Clue 1 for profile 1
- Clue 2 for profile 1
...
- Clue 20 for profile 1

2. Profile Name 2
- Clue 1 for profile 2
...
```

### Step 2.4: Present to User (APPROVAL GATE 2)

**Format:**

```
Generated 20 clues for each of the {N} profiles.

Sample (first 3 profiles):

1. Profile Name 1
   - [Hard] Clue 1
   - [Hard] Clue 2
   ...
   - [Easy] Clue 20

2. Profile Name 2
   ...

[Show first 3 profiles in detail, mention rest are ready]

Do you approve these clues? (yes/no)
```

**Wait for user response before proceeding.**

---

## 🌍 PHASE 3: TRANSLATIONS

### Step 3.1: Create Spanish Translations

For each English profile:

1. Translate profile name to Spanish (use official title if applicable)
2. Translate ALL 20 clues to natural Spanish
3. Maintain difficulty progression
4. Use natural phrases, not word-for-word translation

**Example:**

```
English: "The Matrix" with "Released in 1999"
Spanish: "Matrix" with "Estrenada en 1999"
```

### Step 3.2: Create Portuguese (pt-BR) Translations

Same process as Spanish:

1. Translate profile name to Brazilian Portuguese
2. Translate ALL 20 clues to natural Portuguese
3. Maintain difficulty progression
4. Use natural Brazilian Portuguese phrases

### Step 3.3: Save Markdown Files

Create 3 files in `docs/tmp/`:

- `{category}_en.md` - English profiles with clues
- `{category}_es.md` - Spanish profiles with clues  
- `{category}_pt-BR.md` - Portuguese profiles with clues

**File Format:**

```markdown
1. Profile Name
- Clue 1
- Clue 2
...
- Clue 20

2. Next Profile Name
...
```

### Step 3.4: Present to User (APPROVAL GATE 3)

**Format:**

```
Created 3 markdown files with translations:

✓ docs/tmp/{category}_en.md ({N} profiles, 549 lines)
✓ docs/tmp/{category}_es.md ({N} profiles, 549 lines)
✓ docs/tmp/{category}_pt-BR.md ({N} profiles, 549 lines)

All translations completed with natural localization.

Do you approve these translations? (yes/no)
```

**Wait for user response before proceeding.**

---

## 🔧 PHASE 4: JSON INTEGRATION

### Step 4.1: Determine Starting ID

Read current data JSON files to determine next available ID. Check for the last profile id, not the count (since not necessary to start from 1 or it may be a gap in the sequence)

```python
# Get current profile count
en_data = read_json(f"public/data/{category}/en/data-1.json")
last_id = en_data['profiles'][-1]['id']
start_id = int(last_id.split('-')[-1]) + 1
```

### Step 4.2: Run markdown_to_json.py Script

Execute the Python script to convert markdown files to JSON:

```bash
python scripts/markdown_to_json.py \
    --category {category} \
    --id-prefix {id_prefix} \
    --markdown-dir docs/tmp \
    --json-dir public/data \
    --start-id {start_id} \
    --languages en es pt-BR \
    --manifest public/data/manifest.json
```

**Parameters:**

- `--category`: Category name (e.g., "movies", "famous-people")
- `--id-prefix`: Profile ID prefix (use the same from already existing profiles)
- `--markdown-dir`: Location of markdown files (`docs/tmp`)
- `--json-dir`: Root of data directory (`public/data`)
- `--start-id`: Starting ID number for new profiles
- `--languages`: Languages to process (`en es pt-BR`)
- `--manifest`: Path to manifest.json for automatic updates

### Step 4.3: Update profiles.config.json

Add new profile entries:

```json
{
  "{category}": [
    "Profile Name 1",
    "Profile Name 2",
    ...
  ]
}
```

### Step 4.4: Validate JSON Files

Check all modified JSON files:

```bash
python3 -m json.tool public/data/{category}/en/data-1.json > /dev/null
python3 -m json.tool public/data/{category}/es/data-1.json > /dev/null
python3 -m json.tool public/data/{category}/pt-BR/data-1.json > /dev/null
python3 -m json.tool public/data/manifest.json > /dev/null
python3 -m json.tool config/profiles.config.json > /dev/null
```

All must return valid JSON.

### Step 4.5: Verify Profile Counts

```python
# Verify counts match across all files
en_count = len(read_json("public/data/{category}/en/data-1.json")['profiles'])
es_count = len(read_json("public/data/{category}/es/data-1.json")['profiles'])
pt_count = len(read_json("public/data/{category}/pt-BR/data-1.json")['profiles'])

assert en_count == es_count == pt_count, "Profile counts don't match!"

# Verify manifest is updated
manifest = read_json("public/data/manifest.json")
manifest_count = manifest['categories'][category]['locales']['en']['profileAmount']

assert manifest_count == en_count, "Manifest count doesn't match actual!"
```

### Step 4.6: Final Report

**Format:**

```
✅ Profile Creation Complete!

📊 Summary:
- Profiles Created: {N} per language
- Total Profiles Added: {N * 3} (across 3 languages)
- Category: {category}
- Starting ID: {start_id}
- Ending ID: {start_id + N - 1}

📁 Files Modified:
✓ public/data/{category}/en/data-1.json ({old_count} → {new_count} profiles)
✓ public/data/{category}/es/data-1.json ({old_count} → {new_count} profiles)
✓ public/data/{category}/pt-BR/data-1.json ({old_count} → {new_count} profiles)
✓ public/data/manifest.json (counts updated)
✓ config/profiles.config.json ({N} entries added)

📝 Markdown Files Created:
✓ docs/tmp/{category}_en.md
✓ docs/tmp/{category}_es.md
✓ docs/tmp/{category}_pt-BR.md

✅ All JSON files validated successfully
✅ Profile counts verified across all languages
✅ No duplicates detected

Ready for commit!
```

---

## 📚 CATEGORY GUIDANCE

### Animals

- Real animals (Lion, Dolphin, Eagle)
- Fictional creatures (Dragons from specific stories)
- Mythical creatures (Phoenix, Unicorn)
- Avoid: Common pets without specificity

### Brands

- Global brands (Apple, Nike, Coca-Cola)
- Historical brands with interesting stories
- Tech, fashion, food & beverage brands
- Avoid: Local-only or very obscure brands

### Famous People

- Historical figures (Albert Einstein, Cleopatra)
- Contemporary celebrities (actors, musicians, athletes)
- Political leaders, scientists, artists
- Avoid: Controversial or offensive figures

### Geography

- Countries (France, Japan, Brazil)
- Capital cities (Paris, Tokyo, Brasília)
- Landmarks (Eiffel Tower, Great Wall)
- Historical landmarks (Statue of Liberty, Sydney Opera House)
- Natural wonders (Great Barrier Reef, Mount Everest)
- Cultural landmarks (Colosseum, Notre-Dame Cathedral)
- Geographic features (rivers, oceans, continents, mountains, valleys) - most famous ones
- Avoid: Tiny villages or disputed territories

### History

- Major historical events (World War II, Moon Landing)
- Ancient civilizations (Roman Empire, Egypt)
- Historical periods (Renaissance, Industrial Revolution)
- Historical people (Charles Darwin, Marie Curie)

### Literature

- Classic books (1984, Pride and Prejudice)
- Famous authors (Shakespeare, Tolkien)
- Literary characters (Sherlock Holmes, Harry Potter)
- Avoid: Self-published or very niche books
- Famous quotes (from literature)

### Movies

- Classic films (The Godfather, Casablanca)
- Modern blockbusters (Avatar, Inception)
- Award winners (Oscar, Cannes)
- Avoid: Direct-to-video or very obscure films
- Actors and actresses
- Famous quotes (from movies)

### Music

- Famous artists (The Beatles, Mozart, Beyoncé)
- Iconic albums (Dark Side of the Moon)
- Music genres and movements
- Avoid: One-hit wonders or very local artists
- Famous quotes (from music)

### Sports

- Major sports (Football, Basketball, Tennis)
- Famous athletes (Messi, Michael Jordan)
- Historic events (World Cup, Olympics)
- Avoid: Local teams or amateur sports

### Technology

- Tech products (iPhone, PlayStation, Windows)
- Companies (Google, Microsoft, Tesla)
- Inventions (Internet, Computer, Smartphone)
- Fictional tech (Star Trek devices, Marvel tech)
- Avoid: Beta products or failed technology

---

## ⚠️ CRITICAL RULES

### Duplicate Prevention

- ✅ **ALWAYS** check existing profiles before generating
- ✅ **ALWAYS** verify across ALL languages
- ✅ **ALWAYS** check case-insensitive (Lion = lion = LION)
- ❌ **NEVER** skip duplicate checking
- ❌ **NEVER** create profiles with names that differ only in case (e.g., "The Matrix" and "matrix")
- ❌ **NEVER** create profiles with names that differ only in accents (e.g., "Café" and "Cafe")
- ❌ **NEVER** create profiles with names that differ only in hyphens (e.g., "The Matrix" and "Matrix")


### Translation Quality

- ✅ **ALWAYS** use natural language in target language
- ✅ **ALWAYS** translate ALL 20 clues (not just the name)
- ✅ **ALWAYS** use official localized titles when available
- ❌ **NEVER** use word-for-word literal translation
- ❌ **NEVER** leave English text in Spanish/Portuguese files

### Approval Gates

- ✅ **ALWAYS** wait for user approval at each gate
- ✅ **ALWAYS** show clear summaries before asking
- ❌ **NEVER** proceed without explicit "yes" from user
- ❌ **NEVER** skip approval gates

### File Management

- ✅ **ALWAYS** use markdown files in `docs/tmp/`
- ✅ **ALWAYS** use the provided Python script for JSON conversion
- ✅ **ALWAYS** validate JSON after modifications
- ❌ **NEVER** manually edit JSON (use script instead)
- ❌ **NEVER** commit files (user does that manually)
- ❌ **NEVER** escape special characters (e.g., apostrophes, hyphens, accents), keep them as-is, always in all files/languages

### Script Usage

- ✅ **ALWAYS** use `scripts/markdown_to_json.py` for JSON updates
- ✅ **ALWAYS** pass `--manifest` parameter to update manifest
- ✅ **ALWAYS** verify script output shows success
- ❌ **NEVER** create JSON manually
- ❌ **NEVER** skip the Python script
- ❌ **NEVER** escape special characters (e.g., apostrophes, hyphens, accents), keep them as-is, always in all files/languages

---

## 🔍 VALIDATION CHECKLIST

Before marking complete, verify:

- [ ] No duplicate profiles (checked against existing)
- [ ] Exactly 20 clues per profile
- [ ] Clue progression: 5 hard → 5 medium → 10 easy
- [ ] Profile names not mentioned in their own clues
- [ ] Natural language in all translations
- [ ] All 3 markdown files created (`_en.md`, `_es.md`, `_pt-BR.md`)
- [ ] Python script executed successfully
- [ ] All JSON files valid (no syntax errors)
- [ ] Profile counts match across all languages
- [ ] Manifest.json updated with correct counts
- [ ] profiles.config.json updated with new entries
- [ ] Starting ID calculated correctly
- [ ] User approved at all 3 gates
- [ ] No special characters are escaped (e.g., apostrophes, hyphens, accents), keep them as-is, always in all files/languages
- [ ] All profile names are unique (checked case-insensitive)
- [ ] Check duplicates even in different forms (e.g., with/without accents, hyphens. Example: "The Matrix" and "Matrix")
- [ ] Ensure the exactly number of profiles requested are created, not less, not more.

---

## 📖 EXAMPLE WORKFLOW

```
USER: Create 5 new movie profiles

AGENT: I'll create 5 new movie profiles. Let me start by checking existing profiles...

[Reads public/data/movies/en/data-1.json, es/data-1.json, pt-BR/data-1.json]

Current movie profiles: 100 (IDs 001-100)
Next starting ID: 101

Generating 5 new movie profile names...

Generated 5 new movie profiles:
1. The Shawshank Redemption
2. 12 Angry Men
3. Schindler's List
4. The Green Mile
5. Forrest Gump

✓ No duplicates found (checked against 100 existing profiles)

Do you approve these profile names?

USER: yes

AGENT: Great! Now generating 20 clues for each profile...

[Generates clues with hard→medium→easy progression]

Generated 20 clues for each of the 5 profiles.

Sample (first profile):

1. The Shawshank Redemption
   - [Hard] Based on a Stephen King novella from Different Seasons
   - [Hard] Features the Mexican beach town of Zihuatanejo as a symbolic destination
   ...
   - [Easy] Stars Morgan Freeman and Tim Robbins
   - [Easy] Set primarily in a prison

Do you approve these clues?

USER: yes

AGENT: Perfect! Now creating translations...

[Creates Spanish and Portuguese translations]

Created 3 markdown files with translations:
✓ docs/tmp/movies_en.md (5 profiles, 137 lines)
✓ docs/tmp/movies_es.md (5 profiles, 137 lines)
✓ docs/tmp/movies_pt-BR.md (5 profiles, 137 lines)

Do you approve these translations?

USER: yes

AGENT: Excellent! Now integrating into JSON files using the script...

[Runs: python scripts/markdown_to_json.py --category movies --markdown-dir docs/tmp --json-dir public/data --start-id 101 --languages en es pt-BR --manifest public/data/manifest.json]

Script output: ✓ Successfully added 5 profiles to each language

Updating profiles.config.json...
Validating all JSON files...

✅ Profile Creation Complete!

📊 Summary:
- Profiles Created: 5 per language
- Total Profiles Added: 15 (across 3 languages)
- Category: movies
- Starting ID: 101
- Ending ID: 105

📁 Files Modified:
✓ public/data/movies/en/data-1.json (100 → 105 profiles)
✓ public/data/movies/es/data-1.json (100 → 105 profiles)
✓ public/data/movies/pt-BR/data-1.json (100 → 105 profiles)
✓ public/data/manifest.json (counts updated)
✓ config/profiles.config.json (5 entries added)

✅ All JSON files validated successfully
✅ Profile counts verified across all languages

Ready for commit!
```

---

## 🎯 SUCCESS CRITERIA

A successful profile creation session must have:

1. ✅ User approval at all 3 gates
2. ✅ No duplicates in final profile list
3. ✅ All JSON files valid and correctly formatted
4. ✅ Profile counts matching across all languages
5. ✅ Markdown files created in `docs/tmp/`
6. ✅ Python script executed successfully
7. ✅ All validations passing

Once these criteria are met, the profiles are ready for user to commit.

