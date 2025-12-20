---
description: Create new profiles for the Perfil project.
agent: build
---

## WORKFLOW

1. **Ask**: How many profiles does the user want? Create ONLY that number.
2. **Prepare**: Read `@config/profiles.config.json` (categories, languages, existing profiles) and `@config/profiles.schema.json` (structure).
3. **Create ENGLISH FIRST**: Generate profiles in English (EN) following rules below. This is the source of truth.
4. **LOCALIZE**: For each English profile, create localized versions (ES, pt-BR) by:
   - Translating the movie/book/person name to the target language (use official localized titles)
   - Translating ALL 20 clues to the target language
   - Keeping the same structure, difficulty, IDs, and metadata (only changing language and names)
5. **Update**: Modify `profiles.config.json` and `public/data/manifest.json`.
6. **Validate**: Check for JSON errors and exact rule compliance.

## PROFILE STRUCTURE

Each profile MUST have:
- **id**: Format `profile-{category}-{number}` (e.g., `profile-animal-001`)
- **name**: Profile name (in target language)
- **category**: From profiles.config.json
- **clues**: Exactly 20 clues (no more, no less), hard→easy progression (5 hard, 5 medium, 10 easy)
- **metadata**: 
  - `language`: en, es, or pt-BR
  - `difficulty`: easy, medium, or hard
  - `source`: Wikipedia, IMDb, Fandom, etc.

## DATA SOURCES

- Wikipedia
- IMDb, Rotten Tomatoes
- Fandom wikis (e.g., https://starwars.fandom.com/)
- Celebrity wikis
- Other relevant sources

## CATEGORY GUIDANCE

- **Animals**: Real, fictional, mythical creatures; habitats (avoid obvious clues)
- **Brands**: Origin, products, facts (avoid obvious clues)
- **Famous People**: Historical and contemporary personalities (avoid obvious clues)
- **Geography**: Countries, cities, capitals, languages, currencies, tourism (avoid obvious clues)
- **History**: Events, people, places (avoid obvious clues)
- **Literature**: Books, authors, characters (avoid obvious clues)
- **Movies**: Films, actors, characters, directors (avoid obvious clues)
- **Music**: Artists, albums, songs, events (avoid obvious clues)
- **Sports**: Teams, players, events (e.g., World Cup)
- **Technology**: Tech, companies, products, fictional tech (e.g., iPhone 14, Star Trek) (avoid obvious clues)

## MULTILINGUAL PROFILE CREATION (CRITICAL)

### ⚡ Key Principle: ENGLISH-FIRST APPROACH

**ALWAYS follow this process:**

1. **CREATE IN ENGLISH FIRST**
   - Generate all new profiles in English (EN) with English names and English clues
   - This is the source of truth for the profile structure
   - Example: Profile 31 = "Jaws" with 20 English clues

2. **THEN LOCALIZE TO OTHER LANGUAGES**
   - For Spanish (ES): Take the English profile and:
     - Replace name with Spanish title: "Jaws" → "Tiburón"
     - Translate ALL 20 clues to Spanish (naturally, not word-for-word)
     - Set metadata language to "es"
   - For Portuguese (pt-BR): Same process with Portuguese translations
     - Replace name with Portuguese title: "Jaws" → "Tubarão"
     - Translate ALL 20 clues to Portuguese
     - Set metadata language to "pt-BR"

3. **IMPORTANT: Full Localization, Not Lazy Translation**
   - ❌ DO NOT keep English clues in Spanish/Portuguese files
   - ✅ DO translate ALL 20 clues to each target language
   - ✅ Use official/authentic titles (e.g., "Tiburón" for Jaws in Spanish, not "Jaws")
   - ✅ Maintain difficulty progression in translated clues
   - ✅ Keep natural language, not literal translations

### Example Structure

```
English Profile 31:
  id: profile-movie-031
  name: "Jaws"
  clues: ["1975 thriller adventure film", "Directed by Steven Spielberg", ...]
  metadata: { language: "en", difficulty: "medium" }

Spanish Profile 31 (SAME ID):
  id: profile-movie-031
  name: "Tiburón"  ← Localized name
  clues: ["Película de thriller de 1975", "Dirigida por Steven Spielberg", ...]  ← All translated
  metadata: { language: "es", difficulty: "medium" }

Portuguese Profile 31 (SAME ID):
  id: profile-movie-031
  name: "Tubarão"  ← Localized name
  clues: ["Filme de thriller de 1975", "Dirigido por Steven Spielberg", ...]  ← All translated
  metadata: { language: "pt-BR", difficulty: "medium" }
```

## CORE RULES (NON-NEGOTIABLE)

- ❌ **NEVER** create duplicate profiles (check profiles.config.json)
- ❌ **NEVER** create more profiles than requested
- ❌ **NEVER** remove/modify existing profiles
- ❌ **NEVER** include profile name in clues
- ❌ **NEVER** escape text (keep accented characters)
- ❌ **NEVER** create extra files (documentation, scripts, etc.)
- ❌ **NEVER** leave English clues in Spanish/Portuguese files (ALWAYS translate)
- ❌ **NEVER** use English profile names in Spanish/Portuguese files (use localized titles)
- ✅ **DO** create exactly 20 clues per profile
- ✅ **DO** arrange clues: hard (5) → medium (5) → easy (10)
- ✅ **DO** use correct language in names, categories, clues
- ✅ **DO** create same profile structure for all languages (EN → ES → pt-BR)
- ✅ **DO** translate ALL clues, not just the name
- ✅ **DO** use official localized movie/book/person names
- ✅ **DO** balance difficulty levels and categories
- ✅ **MUST DO** use Serena MCP to write files (token efficiency)

## FILE MANAGEMENT

- **Max 100 profiles per data file**: If exceeded, create new file (data-1.json, data-2.json, etc.). The source of truth of the number of profiles in a file is the amount of entries in the data-json file (not the id number as some categories does not follow the numbering, so read the amount of entries in the file to know the number of profiles in that file).
- **Only create new files if current file has 100+ profiles**
- **Update `public/data/manifest.json`**: Add new files and update `profileAmount` for each category/language
- **Files location**: `public/data/{category}/{language}/data-{number}.json`
- **No other files**: Only JSON profile files in public/data

## ⚠️ COMMON MISTAKES TO AVOID

### ❌ Mistake 1: English Clues in Spanish/Portuguese Files
**WRONG**: Copy English profiles to ES/pt-BR without translating clues
```json
// ❌ WRONG - Spanish file with English clues
{
  "id": "profile-movie-031",
  "name": "Tiburón",
  "clues": ["1975 thriller adventure film", ...],  // English clues!
  "metadata": { "language": "es" }
}
```

**CORRECT**: Translate all clues
```json
// ✅ CORRECT - Spanish file with Spanish clues
{
  "id": "profile-movie-031",
  "name": "Tiburón",
  "clues": ["Película de thriller de 1975", "Dirigida por Steven Spielberg", ...],  // Spanish!
  "metadata": { "language": "es" }
}
```

### ❌ Mistake 2: Using English Names in Localized Files
**WRONG**: 
```json
{ "name": "Jaws" }  // In Spanish file - should be localized!
```

**CORRECT**:
```json
{ "name": "Tiburón" }  // Spanish file
{ "name": "Tubarão" }  // Portuguese file
```

### ❌ Mistake 3: Creating Extra Profiles by Mistake
**WRONG**: Creating 30 profiles when user asked for 20
- Always count profiles in the file AFTER adding, not by ID numbers
- Some categories don't have sequential IDs

**CORRECT**: Count actual entries in data files:
```bash
jq '.profiles | length' public/data/movies/en/data-1.json
```

### ❌ Mistake 4: Not Updating Manifest for All Languages
**WRONG**: Only updating manifest for English
```json
// ❌ WRONG - Only EN updated
{
  "en": { "profileAmount": 50 },
  "es": { "profileAmount": 30 },  // Not updated!
  "pt-BR": { "profileAmount": 30 }  // Not updated!
}
```

**CORRECT**: Update for all languages
```json
// ✅ CORRECT - All languages updated
{
  "en": { "profileAmount": 50 },
  "es": { "profileAmount": 50 },  // Updated
  "pt-BR": { "profileAmount": 50 }  // Updated
}
```

## BATCH PROCESSING

If profile count is high (e.g., 500+), split into batches of 100 each for efficiency.

## VALIDATION CHECKLIST

- [ ] No duplicate profile names (check profiles.config.json)
- [ ] Exactly 20 clues per profile
- [ ] Clue progression: hard→medium→easy
- [ ] Profile name NOT in clues
- [ ] Correct language for all text (EN clues in EN files, ES clues in ES files, PT clues in PT files)
- [ ] Valid JSON (no syntax errors)
- [ ] Spanish files have Spanish names AND Spanish clues (not English)
- [ ] Portuguese files have Portuguese names AND Portuguese clues (not English)
- [ ] profiles.config.json updated with new profiles
- [ ] manifest.json updated with new files (if any) and profileAmount counts for ALL languages
- [ ] No extra files created
- [ ] Profile count matches actual entries in files (use `jq '.profiles | length'`)

Once prepared, create profiles as requested.
